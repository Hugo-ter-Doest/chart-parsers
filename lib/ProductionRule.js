/*
    Production rule class including unification constraints
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

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('ProductionRule');

var FeatureStructureFactory = require('./FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();

// Constructor
// - lhs is a string
// - rhs is an array of strings
// - head is a number pointing to a rhs nonterminal
function ProductionRule(lhs, rhs, head) {
  this.lhs = lhs;
  this.rhs = rhs;
  this.head = head;
  // feature structure of the constraints specified with the rule
  this.fs = null;
}

// Process a single constraint consisting of two feature paths
ProductionRule.prototype.process_constraint = function(constraint, type_lattice) {
  logger.debug('ProductionRule.process_constraint: enter: ' + JSON.stringify(constraint));
  
  // Process the left path
  var current_fs = this.fs;
  constraint.left.forEach(function(feature, index) {
    logger.debug('ProductionRule.process_constraint: processing left path, feature: ' + feature);
    if (!current_fs.features[feature]) { 
      current_fs.features[feature] = 
        featureStructureFactory.createFeatureStructure({type: type_lattice.bottom, type_lattice: type_lattice});
    }
    logger.debug('ProductionRule.process_constraint: processing left path, added feature: ' + feature + ' value: ' + current_fs.features[feature]);
    current_fs = current_fs.features[feature];
  });
  // Current_fs points to the last created fs
  logger.debug('ProductionRule.process_constraint: processed left path');
  var last_fs = current_fs;
  
  // Process the right path
  var current_fs = this.fs;
  constraint.right.forEach(function(feature, index, array) {
    logger.debug('ProductionRule.process_constraint: processing right path, feature: ' + feature);
    if (!current_fs.features[feature]) { 
      current_fs.features[feature] = 
        featureStructureFactory.createFeatureStructure({type: type_lattice.bottom, type_lattice: type_lattice});
    }
    if (index === (array.length - 1)) { // this is the last feature
      // Make a coreference to last_fs
      current_fs.features[feature] = last_fs;
    }
    current_fs = current_fs.features[feature];
  });
  logger.debug('ProductionRule.process_constraint: exit: ' + JSON.stringify(this.fs));
};

// Process a single constraint consisting of a feature path and a type (string)
ProductionRule.prototype.process_constraint_type = function(constraint, type_lattice) {
  logger.debug('ProductionRule.process_constraint_type: enter: ' + JSON.stringify(constraint));
  var current_fs = this.fs;
  constraint.left.forEach(function(feature) {
    if (!current_fs.features[feature]) { 
      var new_fs = featureStructureFactory.createFeatureStructure({});
      current_fs.features[feature] = new_fs;
    }
    current_fs = current_fs.features[feature];
  });
  var type = type_lattice.get_type_by_name(constraint.right);
  current_fs.type = type;
  logger.debug('ProductionRule.process_constraint_type: exit: ' + '\n' + 
    this.fs.pretty_print());
};

// Process an array of constraints
ProductionRule.prototype.process_constraints = function(constraints, type_lattice) {
  logger.debug('ProductionRule.process_constraints: enter: ' + JSON.stringify(constraints));
  this.fs = featureStructureFactory.createFeatureStructure({'type_lattice': type_lattice});
  logger.debug('ProductionRule.process_constraints: created fs');
  var that = this;
  constraints.forEach(function(c) {
    if (typeof(c.right) === "string") {
      that.process_constraint_type(c, type_lattice);
    }
    else {
      that.process_constraint(c, type_lattice);
    }
  });
  logger.debug('ProductionRule.process_constraints: exit: ' + '\n' + 
    this.fs.pretty_print());
};

// Pretty prints a production rule to a string
ProductionRule.prototype.pretty_print = function() {
  var result = '';
  var space = ' ';
  var newline = '\n';
  
  result += this.lhs + space + '->' + space + this.rhs.join(space) +'\n';
  result += this.fs.pretty_print();
  return(result);
};

module.exports = ProductionRule;