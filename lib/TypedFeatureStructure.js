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
var util = require('util');
var _ = require('underscore');

var NO_GENERATION = 0;
// Global counter for generating new generation
var current_generation = 1;
// Global counter for generating unique node id's
var node_id_counter = 0;

// Constructor
function TypedFeatureStructure(type, type_lattice) {
  this.features = {};
  if (type) {
    this.type = type;
  }
  else {
    this.type = type_lattice.bottom;
  }
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
}

TypedFeatureStructure.prototype.process_dag = function(dag, type_lattice) {
  var map_label_to_node = {};
  this.process_dag0(dag, map_label_to_node, type_lattice);
  this.set_shared_nodes(map_label_to_node);
};

// Process the JSON structure and translate it into a feature structure
TypedFeatureStructure.prototype.process_dag0 = function(dag, map_label_to_node, type_lattice) {
  if (typeof(dag) === 'string') {
    if (dag[0] === '[') {
      // this is a coreference
      logger.debug('TypedFeatureStructure.process_dag: found a coreference: ' + dag);
      this.coreference = true;
      this.label = dag;
    }
    else {
      // this is a type, look it up
      this.type = type_lattice.get_type_by_name(dag);
    }
  }
  else {
    // has features -> complex substructure
    var that = this;
    Object.keys(dag).forEach(function(feature) {
      if (feature.indexOf(':') >= 0) {
        logger.debug('TypedFeatureStructure.process_dag: this is node that is refered to: ' + dag);
        // feature contains a coreference -> split into feature and label
        var feature_plus_coref = feature.split(':');
        var new_feature = feature_plus_coref[0].trim();
        var label = feature_plus_coref[1].trim();
        logger.debug('TypedFeatureStructure.process_dag: split feature in two: ' + [label, new_feature]);
        var fs = new TypedFeatureStructure(type_lattice.bottom, type_lattice);
        fs.process_dag0(dag[feature], map_label_to_node, type_lattice);
        fs.label = label;
        that.add_feature(new_feature, fs, type_lattice);
        map_label_to_node[fs.label] = fs;
      }
      else {
        if (feature === 'type') {
          // set the type of the current node
          that.type = type_lattice.get_type_by_name(dag[feature]);
          logger.debug('found type: ' + dag[feature] + that.type);
        }
        else {
          // create a new subfeaturestructure
          var fs = new TypedFeatureStructure(type_lattice.bottom, type_lattice);
          fs.process_dag0(dag[feature], map_label_to_node, type_lattice);
          that.add_feature(feature, fs, type_lattice);
        }
      }
    });
  }
};

// Remove the intermediate nodes with coreference = true
// Reset incoming counters to 0
TypedFeatureStructure.prototype.set_shared_nodes = function(map_label_to_node, type_lattice) {
  var fs = this;
  Object.keys(fs.features).forEach(function(feature) {
    logger.debug('TypedFeatureStructure.set_shared_nodes: processing feature: ' + feature);
    if (fs.features[feature].coreference) {
      fs.features[feature] = map_label_to_node[fs.features[feature].label];
    }
    else {
      fs.features[feature].set_shared_nodes(map_label_to_node, type_lattice);
    }
  });
};

// Set the features of the current node with value fs
// features is mapping of feature label to feature structures
TypedFeatureStructure.prototype.set_features = function(features, type_lattice) {
  var that = this;
  Object.keys(features).forEach(function(f) {
    that.add_feature(f, features[f], type_lattice);
  });
};

// Add a feature to the current node with value fs (if appropriate)
TypedFeatureStructure.prototype.add_feature = function(feature, fs, type_lattice) {
  if (type_lattice.appropriate_function) {
    if (type_lattice.appropriate_function.is_appropriate(this.type, feature, fs.type)) {
      if (!this.features[feature]) {
        this.features[feature] = fs;
        logger.debug('TypedFeatureStructure.add_feature: added feature ' + feature);
      }
      else {
        logger.warn('TypedFeatureStructure.add_feature: feature ' + feature + 
          'already has a value');
      }
    }
    else {
      logger.warn('TypedFeatureStructure.add_feature: ' + 
        'type is not appropriate: (' + this.type.name + ', ' + feature + 
        ' -> ' + fs.type.name + '); feature is not added');
    }
  }
  else {
    // Appropriate function is not set, add the feature if it is not already
    // set
    if (!this.features[feature]) {
      this.features[feature] = fs;
      logger.debug('TypedFeatureStructure.add_feature: added feature ' + feature);
    }
    else {
      logger.warn('TypedFeatureStructure.add_feature: feature ' + feature + 
          'already has a value');
    }
  }
};

// Adds a feature to the current feature structure with substructure fs
TypedFeatureStructure.prototype.add_aux_feature = function(feature, fs) {
  this.aux_features[feature] = fs;
};

// Unification method: first checks if feature structures are unifiable,
// then unifies the two.
TypedFeatureStructure.prototype.unify = function(fs, type_lattice) {
  // increase the generation counter
  next_generation();
  if (this.unifiable(fs, type_lattice)) {
    logger.debug('TypedFeatureStructure.unify: feature structures are unifiable');
    var copy = this.copy_unifact(type_lattice);
    return(copy);
  }
  else {
    logger.debug('TypedFeatureStructure.unify: feature structures are not unifiable');
    return(type_lattice.top);
  }
};

// Checks if two feature structures can be unified and registers forward 
// pointers to (sub)structures that can be unified.
TypedFeatureStructure.prototype.unifiable = function(fs, type_lattice) {
  logger.debug('TypedFeatureStructure.unifiable: enter');
  var fs1 = this.dereference();
  var fs2 = fs.dereference();
  
  if (fs1 === fs2) {
    return(true);
  }
  // determine the least upper bound of the current nodes and store it 
  // temporarily in aux_type
  fs1.aux_type = fs1.type.lub(fs2.type, type_lattice);
  
  if (fs1.aux_type === type_lattice.top) {
    return(false);
  }
  
  // Checks if a feature of two features structures can be unified
  function feature_is_unifiable(feature) {
    logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature);
    if (fs1.features[feature]) {
      var unifiable = fs1.features[feature].unifiable(fs2.features[feature], type_lattice);
      logger.debug('TypedFeatureStructure.unifiable: checking feature: ' + feature + 
              ' with result: ' + unifiable);
      return(unifiable);
    }
    else {
      fs1.add_aux_feature(feature, fs2.features[feature]);
      return(true);
    }
  }
  
  still_unifies = Object.keys(fs2.features).every(feature_is_unifiable);

  if (still_unifies) {
    fs2.forward_fs(fs1);
    return(true);
  }
  else {
    return(false);
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

TypedFeatureStructure.prototype.forward_fs = function(fs){
  this.forward = fs;
  this.forward_mark = current_generation;
};

// Increases the generation counter
function next_generation() {
  current_generation++;
}

function add_referenced_node(label, to) {
  to.label = label;
  map_label_to_referenced_nodes[label] = to;
  logger.debug('add_referenced_node: ' + JSON.stringify(map_label_to_referenced_nodes, null, 2));
}

function reset_shared_nodes() {
  map_label_to_referenced_nodes = {};
}

// Copies the feature structure that is the unification of two feature 
// structures
TypedFeatureStructure.prototype.copy_unifact = function(type_lattice) {
  var fs = this;
  
  logger.debug('TypedFeatureStructure.copy_unifact: enter');
  // Check if there is a forward node, i.e. a node with which it can be unified
  fs = fs.dereference();
  if (fs.unifact_mark === current_generation) {
    logger.debug('TypedFeatureStructure.copy_unifact: unifact_mark equals current_generation: ' + fs.unifact_mark);
    return(fs.unifact);
  }
  var need_to_copy = ((Object.keys(fs.aux_features).length > 0) || 
                      (fs.aux_type !== fs.type));
  var copies = {};
  Object.keys(fs.features).forEach(function(feature) {
    copies[feature] = fs.features[feature].copy_unifact(type_lattice);
    need_to_copy = need_to_copy || (copies[feature] !== fs.features[feature]);
  });
  Object.keys(fs.aux_features).forEach(function(feature) {
    copies[feature] = fs.aux_features[feature].copy_unifact(type_lattice);
    need_to_copy = need_to_copy || (copies[feature] !== fs.aux_features[feature]);
  });
  if (need_to_copy) {
    if (fs.unifact === null) {
      logger.debug('TypedFeatureStructure.copy_unifact: create new unifact node');
      fs.unifact = new TypedFeatureStructure(type_lattice.bottom, type_lattice);
      if (fs.aux_type) {
        fs.unifact.type = fs.aux_type;
      }
      else {
        fs.unifact.type = fs.type;
      }
    }
    Object.keys(copies).forEach(function(feature) {
      logger.debug('TypedFeatureStructure.copy_unifact: feature: ' 
              + feature + ' ' + copies[feature]);
      fs.unifact.add_feature(feature, copies[feature], type_lattice);
    });
    fs.unifact_mark = current_generation;
    return(fs.unifact);
  }
  else {
    logger.debug('TypedFeatureStructure.copy_unifact: exit: no unifact created: current feature structure returned');
    return(fs);
  }
};

// Compares two feature structures
TypedFeatureStructure.prototype.is_equal_to = function(fs) {
  // compare types
  if (this.type !== fs.type) {
    logger.debug('TypedFeatureStructure.is_equal_to: false' + this.type + ' !== ' + fs.type);
    return(false);
  }
  // compare features
  var a1 = Object.keys(this.features).sort();
  var a2 = Object.keys(fs.features).sort();
  if (!_.isEqual(a1, a2)) {
    logger.debug('TypedFeatureStructure.is_equal_to: false' + a1 + ' !== ' + a2);
    return(false);
  }
  // recursively compare substructures
  var equal = true;
  var that = this;
  Object.keys(this.features).forEach(function(f) {
    equal = equal && that.features[f].is_equal_to(fs.features[f]);
  });
  return(equal);
};

// Mapping from id's of the original feature structure to nodes of the copy
var old_id_to_new_node = {};

// Creates a copy of the feature structure
TypedFeatureStructure.prototype.copy = function(type_lattice) {
  old_id_to_new_node = {};
  return(this.copy0(type_lattice));
};

// The actual copying is done in this method
TypedFeatureStructure.prototype.copy0 = function(type_lattice) {
  var result = new TypedFeatureStructure(this.type, type_lattice);
  //var result = new TypedFeatureStructure(null, null, type_lattice);
  //result.type = this.type;
  var that = this;
  Object.keys(this.features).forEach(function(feature) {
    if (!old_id_to_new_node[that.features[feature].id]) {
      result.features[feature] = that.features[feature].copy0(type_lattice);
      old_id_to_new_node[that.features[feature].id] = 
        result.features[feature];
    }
    else {
      result.features[feature] = old_id_to_new_node[that.features[feature].id];
    }
  });
  return(result);
};

// Pretty print a feature structure
TypedFeatureStructure.prototype.pretty_print = function() {
  label_counter = 1;
  this.reset_printed_flags();
  this.reset_incoming_counters();
  this.set_incoming_counters();
  return(this.pretty_print0(0));
};

// Reset the flags that indicate that a node already was seen/printed
TypedFeatureStructure.prototype.reset_printed_flags = function() {
  var fs = this;
  
  fs.printed = false;
  Object.keys(fs.features).forEach(function(feature) {
    fs.features[feature].reset_printed_flags();
  });
};

// Reset the administration for coreferences
TypedFeatureStructure.prototype.reset_incoming_counters = function() {
  var fs = this;
  
  fs.incoming = {};
  Object.keys(fs.features).forEach(function(feature) {
    fs.features[feature].reset_incoming_counters();
  });
};

// Rebuild the administration for coreferences
TypedFeatureStructure.prototype.set_incoming_counters = function() {
  var fs = this;
  
  Object.keys(fs.features).forEach(function(feature) {
    // NB: we register node id and feature (in case multiple features of the 
    // current node point the next node
    fs.features[feature].incoming[fs.id + feature] = true;
    fs.features[feature].set_incoming_counters();
  });
};

// Generates a new unique label for coreferencing substructures
TypedFeatureStructure.prototype.gen_label = function() {
  this.label = '[' + this.id + ']';
};

var space = ' ';

// Actual pretty printer
TypedFeatureStructure.prototype.pretty_print0 = function(indent) {
  var result = '';
  
  logger.debug('TypedFeatureStructure.pretty_print: features: ' + this);
  if (Object.keys(this.incoming).length > 1) {
    if (this.printed) {
      // return the label
      return(this.label);
    }
    else {
      // generate a new label
      this.gen_label();
      result += this.label + space;
      indent += this.label.length + 1;
      // and continue to print the substructure
    }
  }
  // mark the current node as printed
  this.printed = true;
  // print the substructure
  if (!Object.keys(this.features).length) {
    result += this.type.prettyPrint();
  }
  else {
    result += '[';
    var that = this;
    Object.keys(this.features).forEach(function(feature, index) {
      if (index === 0) {
        // first print the type of the substructure
        result += that.type.prettyPrint() + '\n';
        result += space.repeat(indent + 1);
        result += feature + ':' + space;
        result += that.features[feature].pretty_print0(indent + feature.length + 3) + '\n';
      }
      else {
        result += space.repeat(indent + 1) + feature + ':' + space;
        result += that.features[feature].pretty_print0(indent + feature.length + 3) + '\n';
      }
    });
    result += space.repeat(indent) + ']';
  }
  return (result);
};

module.exports = TypedFeatureStructure;