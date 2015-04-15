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

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('DEBUG');

// Path to the feature structure module
// Will be removed once the feature structure module can be installed using npm
var fs_base = '/home/hugo/Workspace/feature-structures/lib/';
var FeatureStructureFactory = require(fs_base + 'FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory;

// Constructor
// - lhs is a string
// - rhs is an array of strings
// - head is a number pointing to a rhs nonterminal
function ProductionRule(lhs, rhs, head) {
  this.lhs = lhs;
  this.rhs = rhs;
  this.head = head;
  this.fs = null;
}

// Process a single constraint consisting of two feature paths
ProductionRule.prototype.process_constraint = function(constraint, type_lattice) {
  logger.debug('ProductionRule.process_constraint: enter: ' + JSON.stringify(constraint));
  var current_fs = this.fs;
  constraint.left.forEach(function(feature) {
    var new_fs = featureStructureFactory.createFeatureStructure({});
    current_fs.add_feature(feature, new_fs, type_lattice);
    current_fs = current_fs.features[feature];
  });
  // coref points to the last created fs
  var last_fs = current_fs;
  var current_fs = this.fs;
  constraint.right.forEach(function(feature, index, array) {
    var new_fs = featureStructureFactory.createFeatureStructure({});
    current_fs.add_feature(feature, new_fs, type_lattice);
    if (index === array.length - 1) { // this is the last feature
      // make a coreference to last_fs
      current_fs.features[feature] = last_fs;
    }
    current_fs = current_fs.features[feature]; 
  });
  logger.debug('ProductionRule.process_constraint: exit: ' + JSON.stringify(this.fs));
};

// Process a single constraint consisting of two feature paths
ProductionRule.prototype.process_constraint_type = function(constraint, type_lattice) {
  logger.debug('ProductionRule.process_constraint_type: enter: ' + JSON.stringify(constraint));
  var current_fs = this.fs;
  constraint.left.forEach(function(feature) {
    var new_fs = featureStructureFactory.createFeatureStructure({});
    current_fs.add_feature(feature, new_fs, type_lattice);
    current_fs = current_fs.features[feature];
  });
  var type = type_lattice.get_type_by_name(constraint.right);
  current_fs.type = type;
  logger.debug('ProductionRule.process_constraint_type: exit: ' + JSON.stringify(this.fs));
};

// Process an array of constraints
ProductionRule.prototype.process_constraints = function(constraints, type_lattice) {
  logger.debug('ProductionRule.process_constraints: enter: ' + JSON.stringify(constraints));
  this.fs = featureStructureFactory.createFeatureStructure({'type_lattice': type_lattice});
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

module.exports = ProductionRule;