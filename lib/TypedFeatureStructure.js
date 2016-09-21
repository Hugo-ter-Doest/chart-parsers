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
          if ((fs.features[feature].type === signature.typeLattice.list) ||
            (fs.features[feature].type === signature.typeLattice.concatlist)) {
            // Resolve the list of references to node ids
            var list = [];
            fs.features[feature].listOfCrossRefs.forEach(function(id) {
              logger.debug('TypedFeatureStructure.setSharedNodes: resolving' +
                ' lexical reference: ' + id + ' -> ' + map_label_to_node[id].id);
              list.push(map_label_to_node[id]);
              // Recurse on this node
              setSharedNodes0(map_label_to_node[id], map_label_to_node, signature);
            });
            fs.features[feature].listOfCrossRefs = list;
          }
          else {
            logger.debug('TypedFeatureStructure.setSharedNodes: resolving' +
              ' cross reference: ' + fs.features[feature].label);
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
TypedFeatureStructure.prototype.addFeature = function(feature, fs) {
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
  if (this.unifiable(fs, signature, [], [])) {
    logger.debug('TypedFeatureStructure.unify: feature structures are unifiable');
    var copy = this.copyUnifact(signature, []);
    return(copy);
  }
  else {
    logger.debug('TypedFeatureStructure.unify: feature structures are not' +
      ' unifiable:\n' + this.prettyPrint(signature) + '\n' + fs.prettyPrint(signature));
    // Return a feature structure consisting of type TOP
    var result = new TypedFeatureStructure({
      type: signature.typeLattice.top,
      signature: signature
    });
    return(result);
  }
};

// Compare lexical strings
TypedFeatureStructure.prototype.unifiableStrings = function(fs2) {
  var fs1 = this;
  if (fs1.lexicalString === fs2.lexicalString) {
    fs2.forwardFS(fs1);
    return (true);
  }
  else {
    return (false);
  }
};

// Checks if the lists of cross references can be unified
TypedFeatureStructure.prototype.unifiableListOfCrossRefs =
  function(fs2, signature, stacka, stackb) {
  logger.debug('TypedFeatureStructure.unifiableListOfCrossRefs');
  var fs1 = this;
  var unifiable = true;
  if (fs1.listOfCrossRefs && fs2.listOfCrossRefs) {
    // Compare array of references
    unifiable = (fs1.listOfCrossRefs.length === fs2.listOfCrossRefs.length);
    if (unifiable) {
      unifiable = fs1.listOfCrossRefs.every(function (ref, index) {
        return(ref.unifiable(fs2.listOfCrossRefs[index], signature, stacka, stackb));
      });
    }
    if (unifiable) {
      logger.debug('TypedFeatureStructure.unifiableListOfCrossRefs:' +
        ' fs1.listOfCrossRefs is empty');
      fs1.aux_listOfCrossRefs = fs1.listOfCrossRefs;
    }
  }
  else {
    if (fs1.listOfCrossRefs && !fs2.listOfCrossRefs) {
      logger.debug('TypedFeatureStructure.unifiableListOfCrossRefs: fs2.listOfCrossRefs is empty');
      fs1.aux_listOfCrossRefs = fs1.listOfCrossRefs;
    }
    else {
      if (fs2.listOfCrossRefs && !fs1.listOfCrossRefs) {
        logger.debug('TypedFeatureStructure.unifiableListOfCrossRefs: fs1.listOfCrossRefs is empty');
        fs1.aux_listOfCrossRefs = fs2.listOfCrossRefs;
      }
      else {
        // both lists are empty -> nothing to be done
        logger.debug('TypedFeatureStructure.unifiableListOfCrossRefs: both lists of' +
          ' cross references are empty');
      }
    }
  }
  logger.debug('TypedFeatureStructure.unifiableListOfCrossRefs: list of coreferences' +
    ' can be unified: ' + unifiable);
  if (unifiable) {
    fs2.forwardFS(fs1);
  }
  return (unifiable);
};

// Checks if two feature structures can be unified and registers forward
// pointers to (sub)structures that can be unified.
TypedFeatureStructure.prototype.unifiable = function(b, signature, stacka, stackb) {
  var a = this;
  var newStacka = stacka.slice();
  newStacka.push(a.id);

  var newStackb = stackb.slice();
  newStackb.push(b.id);

  var fs1 = a.dereference();
  var fs2 = b.dereference();

  if (fs1 === fs2) {
    return (true);
  }
  // determine the least upper bound of the current nodes and store it
  // temporarily in aux_type
  fs1.aux_type = fs1.type.LUB(fs2.type, signature.typeLattice);
  logger.debug('TypedFeatureStructure.unifiable: unified type: ' +
    fs1.aux_type.name);
  if (fs1.aux_type === signature.typeLattice.top) {
    logger.warn('TypedFeatureStructure.unifiable: types cannot be' +
      ' unified: ' + fs1.type.prettyPrint() + ' ' + fs2.type.prettyPrint());
    // Clean up the auxiliary type
    fs1.aux_type = undefined;
    return (false);
  }

  if (fs1.aux_type === signature.typeLattice.string) {
    return(fs1.unifiableStrings(fs2));
  }
  else {
    if ((fs1.aux_type === signature.typeLattice.list) ||
      (fs1.aux_type === signature.typeLattice.concatlist)){
      return(fs1.unifiableListOfCrossRefs(fs2, signature, newStacka, newStackb));
    }
    else { // Ordinary node
      // Reset aux_features (previous unifications may have filled it)
      fs1.aux_features = {};
      // Checks if a feature of two features structures can be unified
      function featureIsUnifiable(feature) {
        logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature + fs2.features[feature]);
        if (fs1.features[feature]) {
          // If feature of fs2 is a back pointer we want it to overrule feature
          // of the fs1.
          if (newStackb.indexOf(fs2.features[feature].id) > -1) {
            fs1.addAuxFeature(feature, fs2.features[feature], signature);
          }
          // One of the features should be not a back pointer because
          // otherwise we are checking for unification multiple times
          if ((newStacka.indexOf(fs1.features[feature].id) === -1) ||
            (newStackb.indexOf(fs2.features[feature].id) === -1)) {
            var unifiable = fs1.features[feature].unifiable(fs2.features[feature], signature, newStacka, newStackb);
            logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature +
              ' with result: ' + unifiable);
            return (unifiable);
          }
          else {
            return (true);
          }
        }
        else {
          fs1.addAuxFeature(feature, fs2.features[feature], signature);
          return (true);
        }
      }

      var stillUnifies = Object.keys(fs2.features).every(featureIsUnifiable);

      // Check fs1 for features of type list that are not in fs2 and copy
      // the list of references
      Object.keys(fs1.features).forEach(function(feature) {
        if (!fs2.features[feature]) {
          if ((fs1.features[feature].type === signature.typeLattice.list) ||
            (fs1.features[feature].type === signature.typeLattice.concatlist)) {
            fs1.features[feature].aux_listOfCrossRefs = fs1.features[feature].listOfCrossRefs;
          }
        }
      });

      if (stillUnifies) {
        fs2.forwardFS(fs1);
      }
      return (stillUnifies);
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
TypedFeatureStructure.prototype.copyUnifact = function(signature, stack) {
  logger.debug('TypedFeatureStructure.copyUnifact: enter with node ' + this.id);
  var fs = this;

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
    // Clean up the auxiliary type
    fs.aux_type = undefined;
  }
  else {
    fs.unifact.type = fs.type;
  }

  if (fs.unifact.type === signature.typeLattice.string) {
    // Copy the lexical string if necessary
    fs.unifact.lexicalString = fs.lexicalString;
  }
  else {
    if ((fs.unifact.type === signature.typeLattice.list) ||
      (fs.unifact.type === signature.typeLattice.concatlist)) {
      // Determine list of cross references to copy
      var crossRefsToCopy = null;
      if (fs.aux_listOfCrossRefs) {
        crossRefsToCopy = fs.aux_listOfCrossRefs;
      }
      else {
        if (fs.listOfCrossRefs) {
          crossRefsToCopy = fs.listOfCrossRefs;
        }
      }
      if (crossRefsToCopy) {
        // Copy the list of cross references
        logger.debug('TypedFeatureStructure.copyUnifact0: copying list');
        var list = [];
        crossRefsToCopy.forEach(function (ref) {
          list.push(ref.copyUnifact(signature, newStack));
        });
        fs.unifact.listOfCrossRefs = list;
        // Clean up the auxiliary list of cross references
        fs.aux_listOfCrossRefs = undefined;
      }
      else {
        logger.debug('TypedFeatureStructure.copyUnifact0: list is empty:' +
          ' node id ' + fs.id);
      }
    }
    else {
      // This is a node with features -> copy features
      var copies = {};
      Object.keys(fs.features).forEach(function (feature) {
        copies[feature] = fs.features[feature].copyUnifact(signature, newStack);
      });
      Object.keys(fs.aux_features).forEach(function (feature) {
        copies[feature] = fs.aux_features[feature].copyUnifact(signature, newStack);
      });
      // Assign the features
      Object.keys(copies).forEach(function (feature) {
        logger.debug('TypedFeatureStructure.copyUnifact0: feature: '
          + feature + ' ' + copies[feature]);
        fs.unifact.addFeature(feature, copies[feature], signature);
      });
    }
  }
  return (fs.unifact);
};

// Compares two feature structures
TypedFeatureStructure.prototype.isEqualTo = function(fs, signature) {
  var cycleDetect = {};
  this.setIncomingCounters(signature.typeLattice);
  fs.setIncomingCounters(signature.typeLattice);
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
      logger.debug('TypedFeatureStructure.isEqualTo: false ' +
        fs1.type.prettyPrint() + ' !== ' + fs2.type.prettyPrint());
      return (false);
    }

    // Compare number of incoming arrows
    if (Object.keys(fs1.incoming).length !== Object.keys(fs2.incoming).length) {
      logger.debug('TypedFeatureStructure.isEqualTo: false because' +
        ' number of incoming is not equal: ' + fs1.id + ': ' + Object.keys(fs1.incoming).length +
        ' !== ' + fs2.id + ': ' + Object.keys(fs2.incoming).length);
      return (false);
    }

    // Process lists
    // We know fs1 and fs2 have the same type
    if ((fs1.type === signature.typeLattice.list) ||
      (fs1.type === signature.typeLattice.concatlist)) {
      if (fs1.listOfCrossRefs && fs2.listOfCrossRefs) {
        if (fs1.listOfCrossRefs.length === fs2.listOfCrossRefs.length) {
          var equal = fs1.listOfCrossRefs.every(function (ref, index) {
            return (isEqualTo0(ref, fs2.listOfCrossRefs[index]));
          });
          // Node cannot have features, so we return the result
          return (equal);
        }
        else {
          // Lists differ in length
          return (false);
        }
      }
      // Only remaining possibility is that both lists are undefined
      return(!fs1.listOfCrossRefs && !fs2.listOfCrossRefs);
    }

    // compare features
    var a1 = Object.keys(fs1.features).sort();
    var a2 = Object.keys(fs2.features).sort();
    if (!_.isEqual(a1, a2)) {
      logger.debug('TypedFeatureStructure.isEqualTo: false ' + JSON.stringify(a1) + ' !== ' + JSON.stringify(a2));
      return (false);
    }

    // recursively compare substructures
    var equal = Object.keys(fs1.features).every(function (f) {
      return(isEqualTo0(fs1.features[f], fs2.features[f]));
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
      old_id_to_new_node[fs.id] = result;

      if (fs.type === signature.typeLattice.string) {
        // Copy lexical string
        result.lexicalString = fs.lexicalString;
      }
      else {
        if ((fs.type === signature.typeLattice.list) ||
          (fs.type === signature.typeLattice.concatlist)) {
          if (fs.listOfCrossRefs) {
            var list = [];
            // Copy list of cross references
            fs.listOfCrossRefs.forEach(function (ref) {
              list.push(copy0(ref, signature));
            });
            result.listOfCrossRefs = list;
          }
        }
        else {
          // Recurse on the features
          Object.keys(fs.features).forEach(function (feature) {
            result.features[feature] = copy0(fs.features[feature], signature);
          });
        }
      }
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
  logger.debug('TypedFeatureStructure.inheritFromSuperTypes: ' + this.type.name);
  var fs = this;
  this.type.super_types.forEach(function (superType) {
    if (superType.fs) {
      var copyOfTypeFS = superType.fs.copy(signature);
      logger.debug('TypedFeatureStructure.inheritFromSuperTypes: unify with' +
        ' type ' + superType.name);
      fs = fs.unify(copyOfTypeFS, signature);
    }
  });
  logger.debug('TypedFeatureStructure.inheritFromSuperTypes: result: ' +
    fs.prettyPrint(signature, true));
  return(fs);
};

// Recursive version
TypedFeatureStructure.prototype.prefixPath = function(signature, path) {
  logger.debug('TypedFeatureStructure.prefixPath: ' + path);
  if (path.length === 0) {
    // return fs
    return (this);
  }
  else {
    var newPath = path.slice();
    var feature = newPath.shift();
    // Prefix this feature and return fs
    var newFS = new TypedFeatureStructure({
      type: signature.typeLattice.bottom
    });
    newFS.addFeature(feature, this.prefixPath(signature, newPath), signature);
    return(newFS);
  }
};

// Follows the path of features and returns the fs it points to
TypedFeatureStructure.prototype.followPath = function(path) {
  var fs = this;
  path.forEach(function(feature) {
    if (fs.features[feature]) {
      fs = fs.features[feature];
    }
  });
  return(fs);
};

// Unifies each node of the feature structure with the FS of the appropriate
// type.
TypedFeatureStructure.prototype.completeFS1 = function(signature) {
  logger.debug('TypedFeatureStructure.completeFS');
  var visited = {};

  var root = this;
  Object.keys(root.features).forEach(function (f) {
    completeFS0(root.features[f], signature, [f]);
  });
  return (root);

  function completeFS0(fs, signature, path) {
    logger.debug('TypedFeatureStructure.completeFS0: path: ' + path);
    if (!visited[fs.id]) {
      visited[fs.id] = true;
      var newFS = fs;
      if (fs.type.fs) {
        logger.debug('TypedFeatureStructure.completeFS0: unify with type:' +
          ' ' + fs.type.name);
        var copyOfTypeFS = fs.type.fs.copy(signature);
        var copyWithPrefix = copyOfTypeFS.prefixPath(signature, path);
        logger.debug('TypedFeatureStructure.completeFS0: root: ' + root.prettyPrint(signature, true));
        logger.debug('TypedFeatureStructure.completeFS0: fs of type ' +
          fs.type.prettyPrint() + ' (with prefix): ' +
          copyWithPrefix.prettyPrint(signature, true));
        root = root.unify(copyWithPrefix, signature);
        //root = copyWithPrefix.unify(root, signature);
        newFS = root.followPath(path);
        logger.debug('TypedFeatureStructure.completeFS0: result: ' +
          root.prettyPrint(signature, true));

      }
      Object.keys(newFS.features).forEach(function (f) {
        var newPath = path.slice();
        newPath.push(f);
        completeFS0(newFS.features[f], signature, newPath);
      });
    }
  }
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
TypedFeatureStructure.prototype.resetFlags = function(stack, typeLattice) {
  var fs = this;

  if (stack.indexOf(fs.id) === -1) {
    fs.incoming = {};
    fs.printed = false;
    var newStack = stack.slice();
    newStack.push(fs.id);
    Object.keys(fs.features).forEach(function (feature) {
      //if (fs.features[feature]) {
        if ((fs.features[feature].type === typeLattice.list) ||
          (fs.features[feature].type === typeLattice.concatlist)) {
          if (fs.features[feature].listOfCrossRefs) {
            fs.features[feature].listOfCrossRefs.forEach(function (ref) {
              ref.resetFlags(newStack, typeLattice);
            });
          }
          else {
          }
        }
        fs.features[feature].resetFlags(newStack, typeLattice);
      //}
    });
  }
};

// Rebuild the administration for coreferences
TypedFeatureStructure.prototype.setIncomingCounters = function(typeLattice) {
  this.resetFlags([], typeLattice);
  setIncomingCounters0(this, typeLattice);

  function setIncomingCounters0(fs, typeLattice) {
    Object.keys(fs.features).forEach(function (feature) {
      // NB: we register node id and feature (in case multiple features of the
      // current node point the same node)
      if (fs.features[feature] && !fs.features[feature].incoming[fs.id + feature]) {
        fs.features[feature].incoming[fs.id + feature] = true;
        if ((fs.features[feature].type === typeLattice.list) ||
          (fs.features[feature].type === typeLattice.concatlist)){
          if (fs.features[feature].listOfCrossRefs) {
            fs.features[feature].listOfCrossRefs.forEach(function(ref) {
              ref.incoming[fs.id + feature] = true;
              setIncomingCounters0(ref, typeLattice);
            });
          }
          else {
          }
        }
        else {
          setIncomingCounters0(fs.features[feature], typeLattice);
        }
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
TypedFeatureStructure.prototype.prettyPrint = function(signature, debug) {
  var space = ' ';
  this.setIncomingCounters(signature.typeLattice);
  return (prettyPrint0(this, 0));

  // Actual pretty printer
  function prettyPrint0(fs, indent) {
    logger.debug('prettyPrint0: ' + fs);
    var result = '';

    if (fs) {
      if (Object.keys(fs.incoming).length > 1) {
        if (fs.printed) {
          // Return the label
          return (fs.getLabel());
        }
        else {
          // Print the label
          result += fs.getLabel() + space;
          indent += fs.getLabel().length + 1;
          // and continue to print the substructure
        }
      }
      // mark the current node as printed
      fs.printed = true;

      if (!Object.keys(fs.features).length) {
        logger.debug('prettyPrint0() ' + fs.type.name);
        result += (debug ? fs.getLabel() : '');
        if (fs.type === signature.typeLattice.string) {
          // Print the lexical string
          result += '\"' + fs.lexicalString + '\"';
        }
        else {
          if (fs.type === signature.typeLattice.list) {
            // Distinguish ordinary references from list of references
            if (fs.listOfCrossRefs) {
              // Print the list of cross references
              result += '<';
              fs.listOfCrossRefs.forEach(function (ref) {
                if (ref.printed) {
                  result += ref.getLabel() + ', ';
                }
                else { // Print the referred fs
                  result += prettyPrint0(ref, indent + 1) + ',\n';
                }
              });
              // Remove the last comma plus space, if necessary
              if (fs.listOfCrossRefs.length) {
                result = result.substr(0, result.length - 2);
              }
              result += '>';
            }
            else {
              // Print the type
              result += fs.type.prettyPrint();
            }
          }
          else {
            if (fs.type === signature.typeLattice.concatlist) {
              // Print concatenation of lists of cross referenced nodes
              if (fs.listOfCrossRefs) {
                result += '<';
                var nrPrinted = 0;
                fs.listOfCrossRefs.forEach(function (ref) {
                  if (ref.printed) {
                    result += ref.getLabel() + ' + ';
                  }
                  else {
                    result += prettyPrint0(ref, indent + 1) + ' +\n';
                  }
                  nrPrinted++;
                });
                // Remove the last comma plus space, if one or more elements
                // were printed
                if (nrPrinted) {
                  result = result.substr(0, result.length - 3);
                }
                result += '>';
              }
              else {
                // Print the type
                result += fs.type.prettyPrint();
              }
            }
            else {
              // Print the type
              result += fs.type.prettyPrint();
            }
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
