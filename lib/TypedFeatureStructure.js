/*
  Typed Feature Structure class
  Copyright (C) 2015 Hugo W.L. ter Doest

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
          fs.features[feature] = map_label_to_node[fs.features[feature].label];
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
    this.features[feature] = fs;
    logger.debug('TypedFeatureStructure.addFeature: added feature ' + feature);
  }
  else {
    logger.warn('TypedFeatureStructure.addFeature: feature ' + feature +
      ' already has a value');
  }
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

// Checks if two feature structures can be unified and registers forward 
// pointers to (sub)structures that can be unified.
TypedFeatureStructure.prototype.unifiable = function(fs, signature) {
  logger.debug('TypedFeatureStructure.unifiable: enter');
  var cycleDetect = {};
  return(unifiable0(this, fs, signature));

  function unifiable0(a, b, signature) {

      // If both nodes were already checked we return true
      if (cycleDetect[a.id] && cycleDetect[b.id]) {
        return(true);
      }
      cycleDetect[a.id] = true;
      cycleDetect[b.id] = true;
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

      // Checks if a feature of two features structures can be unified
      function featureIsUnifiable(feature) {
        logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature + fs2.features[feature]);
        if (fs1.features[feature]) {
          var unifiable = unifiable0(fs1.features[feature], fs2.features[feature], signature);
          logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature +
            ' with result: ' + unifiable);
          return (unifiable);
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
// structures
TypedFeatureStructure.prototype.copyUnifact = function(signature) {
  logger.debug('TypedFeatureStructure.copyUnifact: enter');
  var cycleDetect = {};
  return(copyUnifact0(this, signature));

  function copyUnifact0(fs, signature) {
    if (fs) {
      if (cycleDetect[fs.id]) {
        logger.warn('TypedFeatureStructure.copyUnifact: node already copied');
        if (fs.unifact_mark === current_generation) {
          return(fs.unifact)
        }
        else {
          return(fs);
        }
      }
      // Mark this node
      cycleDetect[fs.id] = true;
      fs = fs.dereference();
      cycleDetect[fs.id] = true;
      if (fs.unifact_mark === current_generation) {
        logger.debug('TypedFeatureStructure.copyUnifact: unifact_mark equals current_generation: ' + fs.unifact_mark);
        return (fs.unifact);
      }
      var need_to_copy = ((Object.keys(fs.aux_features).length > 0) ||
        (fs.aux_type !== fs.type));
      var copies = {};
      Object.keys(fs.features).forEach(function (feature) {
        copies[feature] = copyUnifact0(fs.features[feature], signature);
        need_to_copy = need_to_copy || (copies[feature] !== fs.features[feature]);
      });
      Object.keys(fs.aux_features).forEach(function (feature) {
        copies[feature] = copyUnifact0(fs.aux_features[feature], signature);
        need_to_copy = need_to_copy || (copies[feature] !== fs.aux_features[feature]);
      });
      if (need_to_copy) {
        if (fs.unifact === null) {
          logger.debug('TypedFeatureStructure.copyUnifact: create new unifact node');
          fs.unifact = new TypedFeatureStructure({
            type: signature.typeLattice.bottom,
            signature: signature
          });
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
        }
        Object.keys(copies).forEach(function (feature) {
          logger.debug('TypedFeatureStructure.copyUnifact: feature: '
            + feature + ' ' + copies[feature]);
          fs.unifact.addFeature(feature, copies[feature], signature);
        });
        fs.unifact_mark = current_generation;
        return (fs.unifact);
      }
      else {
        logger.debug('TypedFeatureStructure.copyUnifact: exit: no need to' +
          ' copy: current feature structure returned');
        return (fs);
      }
    }
    else {
      return(fs);
    }
  }
};

// Compares two feature structures
TypedFeatureStructure.prototype.isEqualTo = function(fs) {
  var cycleDetect = {};
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
      equal = equal && isEqualTo0(fs1.features[f], fs2.features[f]);
    });
    return (equal);
  }
};

// The actual copying is done in this method
TypedFeatureStructure.prototype.copy = function(signature) {
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
  Object.keys(fs.features).forEach(function (feature) {
    // NB: we register node id and feature (in case multiple features of the
    // current node point the next node
    if (fs.features[feature] && !fs.features[feature].incoming[fs.id + feature]) {
      fs.features[feature].incoming[fs.id + feature] = true;
      fs.features[feature].setIncomingCounters();
    }
  });
};

// Generates a new unique label for coreferencing substructures
TypedFeatureStructure.prototype.genLabel = function() {
  this.label = '[' + this.id + ']';
};

// Pretty print a feature structure
TypedFeatureStructure.prototype.prettyPrint = function() {
  var space = ' ';
  this.resetFlags();
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
          return (fs.label);
        }
        else {
          // generate a new label
          fs.genLabel();
          result += fs.label + space;
          indent += fs.label.length + 1;
          // and continue to print the substructure
        }
      }
      // mark the current node as printed
      fs.printed = true;

      if (!Object.keys(fs.features).length) {
        logger.debug('prettyPrint0() ' + fs.type.name);
        if ((GLOBAL.config.addPhonString) &&
            (fs.type.name === GLOBAL.config.typeOfLexicalString)) {
          // Print the lexical string
          result += '\"' + fs.lexicalString + '\"';
        }
        else {
          // Print the type
          result += fs.type.prettyPrint();
        }
      }
      else {
        // Print the substructure
        result += '[';
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