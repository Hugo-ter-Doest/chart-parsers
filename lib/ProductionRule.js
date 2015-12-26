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

var _ = require('underscore');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('ProductionRule');

var TypedFeatureStructure = require('./TypedFeatureStructure');

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

ProductionRule.prototype.isEqualTo= function(rule) {
  return ((this.lhs === rule.lhs) &&
    _.isEqual(this.rhs, rule.rhs) &&
    (this.fs ? this.fs.isEqualTo(rule.fs) : true) &&
    (this.head === rule.head));
};

// Process a single constraint consisting of two feature paths
ProductionRule.prototype.processConstraint = function(constraint, signature) {
  logger.debug('ProductionRule.processConstraint: enter: ' + JSON.stringify(constraint));
  
  // Process the left path
  var current_fs = this.fs;
  var incomingFeature = null;
  var incomingNode = null;
  constraint.left.forEach(function(feature) {
    logger.debug('ProductionRule.processConstraint: processing left path, feature: ' + feature);
    if (!current_fs.features[feature]) {
      // Do not use addFeature because of signature checks
      current_fs.features[feature] = new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      });
      logger.debug('ProductionRule.processConstraint: processing left path, added feature: ' + feature + ' value: ' + current_fs.features[feature]);
    }
    incomingFeature = feature;
    incomingNode = current_fs;
    current_fs = current_fs.features[feature];
  });
  // Current_fs points to the last created fs
  logger.debug('ProductionRule.processConstraint: processed left path');

  // Process the right path
  current_fs = this.fs;
  constraint.right.forEach(function(feature, index, array) {
    logger.debug('ProductionRule.processConstraint: processing right path, feature: ' + feature);
    if (!current_fs.features[feature]) {
      // Do not use addFeature because of signature checks
      current_fs.features[feature] = new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature});
      logger.debug('ProductionRule.processConstraint: processing right path,' +
        ' added feature: ' + feature + ' value: ' + current_fs.features[feature]);
    }
    if (index === (array.length - 1)) { // this is the last feature
      // Make a coreference to last_fs
      incomingNode.features[incomingFeature] = current_fs.features[feature];
    }
    current_fs = current_fs.features[feature];
  });
  logger.debug('ProductionRule.processConstraint: exit: ' + this.fs.prettyPrint());
};

// Process a single constraint consisting of a feature path and a type (string)
ProductionRule.prototype.processConstraintType = function(constraint, signature) {
  logger.debug('ProductionRule.processConstraintType: enter: ' + JSON.stringify(constraint));
  var current_fs = this.fs;
  constraint.left.forEach(function(feature) {
    // Do not use addFeature because of signature checks
    if (!current_fs.features[feature]) {
      current_fs.features[feature] = new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature});
    }
    current_fs = current_fs.features[feature];
  });
  var type = signature.typeLattice.getTypeByName(constraint.right);
  logger.debug('ProductionRule.processConstraintType: type is: ' + type.name);
  current_fs.type = type;
  current_fs = current_fs.unify(type.fs, signature);
  logger.debug('ProductionRule.processConstraintType: exit: ' + '\n' +
    this.fs.prettyPrint());
};

// Process an array of constraints
ProductionRule.prototype.processConstraints = function(constraints, signature) {
  logger.debug('ProductionRule.processConstraints: enter: ' + JSON.stringify(constraints));
  this.fs = new TypedFeatureStructure({
    type: signature.typeLattice.rule,
    signature: signature
  });
  logger.debug('ProductionRule.processConstraints: created fs');
  var that = this;
  constraints.forEach(function(c) {
    if (typeof(c.right) === "string") {
      that.processConstraintType(c, signature);
    }
    else {
      that.processConstraint(c, signature);
    }
  });
  this.fs = this.fs.completeFS(signature);
  logger.debug('ProductionRule.processConstraints: exit: ' + '\n' +
    this.fs.prettyPrint());
};

// Pretty prints a production rule to a string
ProductionRule.prototype.prettyPrint = function() {
  var result = '';
  var space = ' ';
  var newline = '\n';
  
  result += this.lhs + space + '->' + space + this.rhs.join(space) + newline;
  if (this.fs) {
    result += this.fs.prettyPrint();
  }
  return(result);
};

module.exports = ProductionRule;