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
}

// Process a single constraint
ProductionRule.prototype.process_constraint = function(constraint, type_lattice) {
  var current_fs = this.fs;
  constraint.left.forEach(function(feature) {
    var new_fs = featureStructureFactory.createFeatureStructure({});
    current_fs.add_feature(feature, new_fs, type_lattice);
    current_fs = current_fs.features[feature];
  });
  var coref_fs = current_fs;
  var current_fs = this.fs;
  constraint.right.forEach(function(feature) {
    var new_fs = featureStructureFactory.createFeatureStructure({});
    current_fs.add_feature(feature, new_fs, type_lattice);
    current_fs = current_fs.features[feature]; 
  });
  coref_fs = current_fs;
};

// Process an array of constraints
ProductionRule.prototype.process_constraints = function(constraints, type_lattice) {
  this.fs = featureStructureFactory.createFeatureStructure({});
  var that = this;
  constraints.forEach(function(c) {
    that.process_constraint(c, type_lattice);
  });
};

module.exports = ProductionRule;