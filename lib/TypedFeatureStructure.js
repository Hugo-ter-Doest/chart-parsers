/*
  Typed Feature Structure class
  Copyright (C) 2016 Hugo W.L. ter Doest

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Based on Tomabechi's algorithm

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('TypedFeatureStructure');

require('string.prototype.repeat');
var _ = require('underscore');

var NO_GENERATION = 0;
// Global counter for generating new generation
var current_generation = 1;
// Global counter for generating unique node id's
var node_id_counter = 0;

// Constructor
function TypedFeatureStructure(options) {
  this.type = options.type;
  if (!this.type) {
    this.type = options.signature.typeLattice.bottom;
  }
  this.features = {};
  this.aux_type = null;
  this.aux_features = {};
  this.forward = null;
  this.forward_mark = NO_GENERATION;
  this.unifact = null;
  this.unifact_mark = NO_GENERATION;
  this.label = null;
  this.printed = false;
  this.id = node_id_counter++;
  this.coreference = false;
  if (options.features) {
    this.setFeatures(options.features, options.signature);
  }
  this.lexicalString = null;
  this.incoming = {};
}

// Remove the intermediate nodes with coreference = true
// Reset incoming counters to 0
TypedFeatureStructure.prototype.setSharedNodes = function(map_label_to_node, signature) {
  var cycleDetect = {};
  setSharedNodes0(this, map_label_to_node, signature);

  function setSharedNodes0(fs, map_label_to_node, signature) {
    if (!cycleDetect[fs.id]) {
      cycleDetect[fs.id] = true;
      Object.keys(fs.features).forEach(function (feature) {
        logger.debug('TypedFeatureStructure.setSharedNodes: processing feature: ' + feature);
        if (fs.features[feature].coreference) {
          if (fs.features[feature].type.name === GLOBAL.config.typeOfListOfCrossRefs) {
            // Resolve the list of references to node ids
            var list = [];
            fs.features[feature].listOfCrossRefs.forEach(function(id) {
              list.push(map_label_to_node[fs.features[feature].label]);
            });
            fs.features[feature].listOfCrossRefs = list;
          }
          else {
            fs.features[feature] = map_label_to_node[fs.features[feature].label];
          }
        }
        else {
          setSharedNodes0(fs.features[feature], map_label_to_node, signature);
        }
      });
    }
  }
};

// Set the features of the current node with value fs
// features is mapping of feature label to feature structures
TypedFeatureStructure.prototype.setFeatures = function(features, signature) {
  var that = this;
  Object.keys(features).forEach(function (f) {
    that.addFeature(f, features[f], signature);
  });
};

// Add a feature to the current node
TypedFeatureStructure.prototype.addFeature = function(feature, fs, signature) {
  if (!this.features[feature]) {
    logger.debug('TypedFeatureStructure.addFeature: added feature ' + feature +
      ' to node ' + this.id);
  }
  else {
    logger.warn('TypedFeatureStructure.addFeature: feature ' + feature +
      ' of node ' + this.id + ' already has a value');
  }
  this.features[feature] = fs;
};

// Adds a feature to the current feature structure with substructure fs
TypedFeatureStructure.prototype.addAuxFeature = function(feature, fs) {
  this.aux_features[feature] = fs;
};

// Unification method: first checks if feature structures are unifiable,
// then unifies the two.
TypedFeatureStructure.prototype.unify = function(fs, signature) {
  // increase the generation counter
  nextGeneration();
  if (this.unifiable(fs, signature)) {
    logger.debug('TypedFeatureStructure.unify: feature structures are unifiable');
    var copy = this.copyUnifact(signature);
    return(copy);
  }
  else {
    logger.debug('TypedFeatureStructure.unify: feature structures are not' +
      ' unifiable:\n' + this.prettyPrint() + '\n' + fs.prettyPrint());
    // Return a feature structure consisting of type TOP
    var result = new TypedFeatureStructure({
      type: signature.typeLattice.top,
      signature: signature
    });
    return(result);
  }
};

// Returns an associative array of backpointers (node id -> feature)
// Traverses the fs depth first and records a stack of traversed nodes
// If a node is traversed twice (that is, in the stack) we found a cycle.
TypedFeatureStructure.prototype.findCycles = function() {
  var cycles = {};
  findCycles0(this, [this.id]);
  this.cycles = cycles;

  function findCycles0(fs, stack) {
    Object.keys(fs.features).forEach(function(f) {
      // Check for a cycle in the stack
      if (stack.indexOf(fs.features[f].id) > -1) {
        // This is a back pointer
        if (cycles[fs.id]) {
          if (cycles[fs.id].indexOf(f) === -1) {
            cycles[fs.id].push(f);
          }
        }
        else {
          cycles[fs.id] = [f];
        }
      }
      else {
        var newStack = stack.slice();
        // Add the node to the stack
        newStack.push(fs.id);
        // Recurse depth first
        findCycles0(fs.features[f], newStack);
      }
    });
  }
};

// Checks if feature of fs is a back pointer
TypedFeatureStructure.prototype.isBackPointer = function(fs, feature) {
  return(this.cycles[fs.id] && this.cycles[fs.id].indexOf(feature) > -1);
};

// Checks if two feature structures can be unified and registers forward
// pointers to (sub)structures that can be unified.
TypedFeatureStructure.prototype.unifiable = function(fs, signature) {
  logger.debug('TypedFeatureStructure.unifiable: enter');
  var that = this;
  this.findCycles();
  fs.findCycles();
  return(unifiable0(this, fs, signature));

  function unifiable0(a, b, signature) {
    var fs1 = a.dereference();
    var fs2 = b.dereference();

    if (fs1 === fs2) {
      return (true);
    }
    // determine the least upper bound of the current nodes and store it
    // temporarily in aux_type
    fs1.aux_type = fs1.type.LUB(fs2.type, signature.typeLattice);
    if (fs1.aux_type === signature.typeLattice.top) {
      logger.debug('TypedFeatureStructure.unifiable: types cannot be unified: ' + fs1.type.prettyPrint() + ' ' + fs2.type.prettyPrint());
      return (false);
    }

    // Reset aux_features (previous unifications may have filled it)
    fs1.aux_features = {};
    // Checks if a feature of two features structures can be unified
    function featureIsUnifiable(feature) {
      logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature + fs2.features[feature]);
      if (fs1.features[feature]) {
        // This is tricky: if feature of fs2 is a back pointer we want it to
        // overrule feature of the fs1.
        if (fs.isBackPointer(fs2, feature)) {
          fs1.addAuxFeature(feature, fs2.features[feature]);
        }
        // One of the features should be not a back pointer because
        // otherwise we are checking for unification multiple times
        if (!that.isBackPointer(fs1, feature) || !fs.isBackPointer(fs2, feature)) {
          var unifiable = unifiable0(fs1.features[feature], fs2.features[feature], signature);
          logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature +
            ' with result: ' + unifiable);
          return (unifiable);
        }
        else {
          return(true);
        }
      }
      else {
        fs1.addAuxFeature(feature, fs2.features[feature]);
        return (true);
      }
    }

    var still_unifies = Object.keys(fs2.features).every(featureIsUnifiable);

    if (still_unifies) {
      fs2.forwardFS(fs1);
      return (true);
    }
    else {
      return (false);
    }
  }
};

TypedFeatureStructure.prototype.dereference = function() {
  if (this.forward_mark === current_generation) {
    return(this.forward);
  }
  else {
    return(this);
  }
};

TypedFeatureStructure.prototype.forwardFS = function(fs){
  this.forward = fs;
  this.forward_mark = current_generation;
};

// Increases the generation counter
function nextGeneration() {
  current_generation++;
}

// Copies the feature structure that is the unification of two feature
// structures. The stack allows detection of cycles.
TypedFeatureStructure.prototype.copyUnifact = function(signature) {
  logger.debug('TypedFeatureStructure.copyUnifact: enter');
  return(copyUnifact0(this, signature, []));

  function copyUnifact0(fs, signature, stack) {
    logger.debug('TypedFeatureStructure.copyUnifact0: enter with node ' + fs.id);

    if (stack.indexOf(fs.id) > -1) {
      logger.debug('TypedFeatureStructure.copyUnifact0: cycle detected ' + fs.id);
      if (fs.unifact_mark !== current_generation) {
        // We create the unifact already here, because we have a cycle
        fs.unifact = new TypedFeatureStructure({
          type: signature.typeLattice.bottom,
          signature: signature
        });
        fs.unifact_mark = current_generation;
        logger.debug('TypedFeatureStructure.copyUnifact0: create new' +
          ' unifact node: ' + fs.id + ' -> ' + fs.unifact.id);
      }
      return (fs.unifact);
    }

    var newStack = stack.slice();
    newStack.push(fs.id);
    fs = fs.dereference();

    if (fs.unifact_mark === current_generation) {
      logger.debug('TypedFeatureStructure.copyUnifact0: unifact_mark equals' +
        ' current_generation: ' + fs.unifact.id);
      return (fs.unifact);
    }

    var copies = {};
    Object.keys(fs.features).forEach(function (feature) {
      copies[feature] = copyUnifact0(fs.features[feature], signature, newStack);
    });
    Object.keys(fs.aux_features).forEach(function (feature) {
      copies[feature] = copyUnifact0(fs.aux_features[feature], signature, newStack);
    });

    if ((fs.unifact === null) || (fs.unifact_mark !== current_generation)) {
      fs.unifact = new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      });
      fs.unifact_mark = current_generation;
      logger.debug('TypedFeatureStructure.copyUnifact0: create new' +
        ' unifact node: ' + fs.id + ' -> ' + fs.unifact.id);
    }

    // Set the type of the unifact
    if (fs.aux_type) {
      fs.unifact.type = fs.aux_type;
    }
    else {
      fs.unifact.type = fs.type;
    }

    // Copy the lexical string if necessary
    if ((GLOBAL.config.addPhonString) &&
      (fs.unifact.type.name === GLOBAL.config.typeOfLexicalString)) {
      fs.unifact.lexicalString = fs.lexicalString;
    }

    // Assign the features
    Object.keys(copies).forEach(function (feature) {
      logger.debug('TypedFeatureStructure.copyUnifact0: feature: '
        + feature + ' ' + copies[feature]);
      fs.unifact.addFeature(feature, copies[feature], signature);
    });

    return (fs.unifact);
  }
};

// Compares two feature structures
TypedFeatureStructure.prototype.isEqualTo = function(fs) {
  var cycleDetect = {};
  this.setIncomingCounters();
  fs.setIncomingCounters();
  return(isEqualTo0(this, fs));

  function isEqualTo0(fs1, fs2) {
    if (!cycleDetect[fs1.id]) {
      cycleDetect[fs1.id] = {};
    }
    if (!cycleDetect[fs2.id]) {
      cycleDetect[fs2.id] = {};
    }
    if (cycleDetect[fs1.id][fs2.id]) {
      return(true);
    }
    cycleDetect[fs1.id][fs2.id] = true;
    cycleDetect[fs2.id][fs1.id] = true;
    // compare types
    if (fs1.type !== fs2.type) {
      logger.debug('TypedFeatureStructure.is_equal_to: false ' + fs1.type.prettyPrint() + ' !== ' + fs2.type.prettyPrint());
      return (false);
    }
    // Compare number of incoming arrows
    if (Object.keys(fs1.incoming).length !== Object.keys(fs2.incoming).length) {
      logger.debug('TypedFeatureStructure.is_equal_to: false because' +
        ' number of incoming is not equal: ' + Object.keys(fs1.incoming).length + ' !== ' + Object.keys(fs2.incoming).length);
      return(false);
    }
    // compare features
    var a1 = Object.keys(fs1.features).sort();
    var a2 = Object.keys(fs2.features).sort();
    if (!_.isEqual(a1, a2)) {
      logger.debug('TypedFeatureStructure.is_equal_to: false ' + JSON.stringify(a1) + ' !== ' + JSON.stringify(a2));
      return (false);
    }
    // recursively compare substructures
    var equal = true;
    var that = this;
    Object.keys(fs1.features).forEach(function (f) {
      equal =
        equal &&
        isEqualTo0(fs1.features[f], fs2.features[f]);
    });
    return (equal);
  }
};

// The actual copying is done in this method
TypedFeatureStructure.prototype.copy = function(signature) {
  logger.debug('TypedFeatureStructure.copy: enter');
  // Mapping from id's of the original feature structure to nodes of the copy
  var old_id_to_new_node = {};
  return(copy0(this, signature));

  function copy0(fs, signature) {
    if (!old_id_to_new_node[fs.id]) {
      // Copy the new node
      var result = new TypedFeatureStructure({
        type: fs.type,
        signature: signature
      });
      if ((GLOBAL.config.addPhonString) &&
          (fs.type.name === GLOBAL.config.typeOfLexicalString)) {
        result.lexicalString = fs.lexicalString;
      }
      old_id_to_new_node[fs.id] = result;
      // and recurse on the features
      Object.keys(fs.features).forEach(function (feature) {
        result.features[feature] = copy0(fs.features[feature], signature);
      });
      return (result);
    }
    else {
      logger.warn('TypedFeatureStructure.copy: node already copied');
      return(old_id_to_new_node[fs.id])
    }
  }
};

// This unifies the feature structure associated with this.type with the
// feature structures of its super types.
TypedFeatureStructure.prototype.inheritFromSuperTypes = function(signature) {
  logger.debug('TypedFeatureStructure.inheritFromSuperTypes');
  var fs = this;
  this.type.super_types.forEach(function (superType) {
    if (superType.fs) {
      var copyOfTypeFS = superType.fs.copy(signature);
      fs = fs.unify(copyOfTypeFS, signature);
    }
  });
  return(fs);
};

// Unifies each node of the feature structure with the FS of the appropriate
// type.
TypedFeatureStructure.prototype.completeFS = function(signature) {
  logger.debug('TypedFeatureStructure.completeFS');
  var cycleDetect = {};
  return (completeFS0(this, signature));

  function completeFS0(fs, signature) {
    if (cycleDetect[fs.id]) {
      return (fs);
    }
    cycleDetect[fs.id] = true;
    if (fs.type.fs) {
      var copyOfTypeFS = fs.type.fs.copy(signature);
      fs = fs.unify(copyOfTypeFS, signature);
      if (fs.type === signature.typeLattice.top) {
        logger.warn('TypedFeatureStructure.completeFS: unification failed');
      }
      else {
        logger.debug('TypedFeatureStructure.completeFS: expanded fs with' +
          ' type: ' + fs.type.name);
      }
    }
    Object.keys(fs.features).forEach(function (f) {
      fs.features[f] = completeFS0(fs.features[f], signature);
    });
    return (fs);
  };
};

// Returns the lexical category from the feature structure
// In simple lexicons the category is a root feature
// In HPSG this may be something like <SYNSEM LOC CAT HEAD>
TypedFeatureStructure.prototype.getLexicalCategory = function() {
  var that = this;
  GLOBAL.config.pathToLexicalCategory.forEach(function(f) {
    that = that.features[f];
  });
  return(that.type.name);
};

// Reset the flags that indicate that a node already was seen/printed
TypedFeatureStructure.prototype.resetFlags = function() {
  var cycleDetect = {};
  resetFlags0(this);

  function resetFlags0(fs) {
    if (fs && !cycleDetect[fs.id]) {
      fs.incoming = {};
      fs.printed = false;
      cycleDetect[fs.id] = true;
      Object.keys(fs.features).forEach(function (feature) {
        resetFlags0(fs.features[feature]);
      });
    }
  }
};

// Rebuild the administration for coreferences
TypedFeatureStructure.prototype.setIncomingCounters = function() {
  var fs = this;
  this.resetFlags();
  setIncomingCounters0(this);

  function setIncomingCounters0(fs) {
    Object.keys(fs.features).forEach(function (feature) {
      // NB: we register node id and feature (in case multiple features of the
      // current node point the next node
      if (fs.features[feature] && !fs.features[feature].incoming[fs.id + feature]) {
        fs.features[feature].incoming[fs.id + feature] = true;
        setIncomingCounters0(fs.features[feature]);
      }
    });
  }
};

// Generates a new unique label for coreferencing substructures
TypedFeatureStructure.prototype.getLabel = function() {
  return('[' + this.id + ']');
};

// Pretty print a feature structure
// If debug is true all node id's are printed
TypedFeatureStructure.prototype.prettyPrint = function(debug) {
  var space = ' ';
  this.setIncomingCounters();

  return (prettyPrint0(this, 0));

  // Actual pretty printer
  function prettyPrint0(fs, indent) {
    logger.debug('prettyPrint0: ' + fs);
    var result = '';

    if (fs) {
      if (Object.keys(fs.incoming).length > 1) {
        if (fs.printed) {
          // return the label
          return (fs.getLabel());
        }
        else {
          // generate a new label
          result += fs.getLabel() + space;
          indent += fs.getLabel().length + 1;
          // and continue to print the substructure
        }
      }
      // mark the current node as printed
      fs.printed = true;

      if (!Object.keys(fs.features).length) {
        logger.debug('prettyPrint0() ' + fs.type.name);
        //if ((GLOBAL.config.addPhonString) &&
        if (fs.type.name === GLOBAL.config.typeOfLexicalString) {
          // Print the lexical string
          result += '\"' + fs.lexicalString + '\"';
        }
        else {
          if (fs.type.name === GLOBAL.config.typeOfListOfCrossRefs) {
            result += fs.listOfCrossRefs;
          }
          else {
            // Print the type
            result += (debug ? '[' + fs.id + ']' : '') + fs.type.prettyPrint();
          }
        }
      }
      else {
        // Print the substructure
        result += '[' + (debug ? fs.getLabel() : '');
        Object.keys(fs.features).forEach(function (feature, index) {
          if (index === 0) {
            // first print the type of the substructure
            logger.debug('prettyPrint0(): ' + fs.type.name);
            result += fs.type.prettyPrint() + '\n'; // + ' (incoming: ' +' +
            //' Object.keys(fs.incoming).length + ')' + '\n';
            result += space.repeat(indent + 1);
            result += feature + ':' + space;
            result += prettyPrint0(fs.features[feature], indent + feature.length + 3) + '\n';
          }
          else {
            result += space.repeat(indent + 1) + feature + ':' + space;
            result += prettyPrint0(fs.features[feature], indent + feature.length + 3) + '\n';
          }
        });
        result += space.repeat(indent) + ']';
      }
    }
    else {
      result += 'WARNING: empty fs\n';
    }
    return (result);
  }

}

module.exports = TypedFeatureStructure;