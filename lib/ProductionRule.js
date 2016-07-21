/*
    Production rule class including unification constraints
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
  
  var newFS = new TypedFeatureStructure({
    type: signature.typeLattice.bottom,
    signature: signature
  });
  var current_fs = newFS;
  var incomingFeature = null;
  var incomingNode = null;

  // Process the left path
  constraint.left.forEach(function(feature) {
    logger.debug('ProductionRule.processConstraint: processing left path, feature: ' + feature);
    current_fs.addFeature(
      feature,
      new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      }),
      signature);
    logger.debug('ProductionRule.processConstraint: processing left path, added feature: ' + feature + ' value: ' + current_fs.features[feature]);
    incomingFeature = feature;
    incomingNode = current_fs;
    current_fs = current_fs.features[feature];
  });
  logger.debug('ProductionRule.processConstraint: processed left path');

  // Process the right path
  current_fs = newFS;
  constraint.right.forEach(function(feature) {
    logger.debug('ProductionRule.processConstraint: processing right path, feature: ' + feature);
    // Feature may already exist because of the left path
    if (!current_fs.features[feature]) {
      current_fs.addFeature(
        feature,
        new TypedFeatureStructure({
          type: signature.typeLattice.bottom,
          signature: signature
        }),
        signature);
      logger.debug('ProductionRule.processConstraint: processing right path,' +
        ' added feature: ' + feature + ' value: ' + current_fs.features[feature]);
    }
    current_fs = current_fs.features[feature];
  });
  incomingNode.features[incomingFeature] = current_fs;
  this.fs = this.fs.unify(newFS, signature);
  logger.debug('ProductionRule.processConstraint: exit: ' + this.fs.prettyPrint(signature));
};

// Process a single constraint consisting of a feature path and a type (string)
ProductionRule.prototype.processConstraintType = function(constraint, signature) {
  logger.debug('ProductionRule.processConstraintType: enter: ' + JSON.stringify(constraint));
  var newFS = new TypedFeatureStructure({
    type: signature.typeLattice.bottom,
    signature: signature
  });
  var current_fs = newFS;
  var incomingNode = null;
  var incomingFeature = null;

  // Process path
  constraint.left.forEach(function(feature) {
    current_fs.addFeature(
      feature,
      new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      }),
      signature);
    incomingNode = current_fs;
    incomingFeature = feature;
    current_fs = current_fs.features[feature];
  });

  // Process type
  var type = signature.typeLattice.getTypeByName(constraint.right);
  if (type) {
    logger.debug('ProductionRule.processConstraintType: type is: ' + type.name);
    current_fs.type = type;
    // Unify with the type's FS if it exists:
    if (type.fs) {
      //var copyOfTypeFS = type.fs.copy(signature);
      incomingNode.features[incomingFeature] = current_fs.unify(type.fs, signature);
    }
  }
  else {
    logger.warn('ProductionRule.processConstraintType: type not found: ' + constraint.right);
    current_fs.type = signature.typeLattice.bottom;
  }

  // Unify the new FS with the rule's FS:
  this.fs = this.fs.unify(newFS, signature);
  logger.debug('ProductionRule.processConstraintType: exit: ' + '\n' +
    this.fs.prettyPrint(signature));
};

// Process a constraint with a rhs consisting of a list of feature paths
ProductionRule.prototype.processConstraintList = function(constraint, signature) {
  // Process the left path
  logger.debug('ProductionRule.processConstraintList: enter: ' + JSON.stringify(constraint));
  var newFS = new TypedFeatureStructure({
    type: signature.typeLattice.bottom,
    signature: signature
  });
  var current_fs = newFS;
  var incomingNode = null;
  var incomingFeature = null;
  constraint.left.forEach(function(feature) {
    logger.debug('ProductionRule.processConstraintList: processing left path,' +
      ' feature: ' + feature);
    current_fs.addFeature(
      feature,
      new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      }),
      signature);
    logger.debug('ProductionRule.processConstraintList: processing left path,' +
      ' added feature: ' + feature + ' value: ' + current_fs.features[feature]);
    incomingFeature = feature;
    incomingNode = current_fs;
    current_fs = current_fs.features[feature];
  });
  logger.debug('ProductionRule.processConstraintList: processed left path');

  // Process the right path
  listFS = new TypedFeatureStructure({
    type: signature.typeLattice.list,
    signature: signature
  });
  listFS.listOfCrossRefs = [];
  var that = this;
  constraint.right.forEach(function(path) {
    logger.debug('ProductionRule.processConstraintList: processing ' + path);
    if (typeof(path) === "string") {
      listFS.listOfCrossRefs.push(signature.typeLattice.getTypeByName(path));
    }
    else { // Right hand side is a feature path
      var current_fs = new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      });
      var pathFS = current_fs;

      // Process path such
      path.forEach(function(feature) {
        current_fs.addFeature(
          feature,
          new TypedFeatureStructure({
            type: signature.typeLattice.bottom,
            signature: signature
          }),
          signature);
        current_fs = current_fs.features[feature];
      });

      // Unify the new FS with the rule's FS
      that.fs = that.fs.unify(pathFS, signature);
      logger.debug('ProductionRule.processConstraintList: unified rule\'s FS' +
        ' with: ' + pathFS.prettyPrint(signature));
      // Obtain the cross reference following the path
      var ref = that.fs.followPath(path);
      // Append the cross reference to the list
      listFS.listOfCrossRefs.push(ref);
    }
  });
  incomingNode.features[incomingFeature] = listFS;
  this.fs = this.fs.unify(newFS, signature);
  logger.debug('ProductionRule.processConstraintList: exit: ' + this.fs.prettyPrint(signature));
};

// Process an array of constraints
ProductionRule.prototype.processConstraints = function(constraints, signature) {
  logger.debug('ProductionRule.processConstraints: enter: ' + JSON.stringify(constraints));
  var storeListConstraints = [];
  this.fs = new TypedFeatureStructure({
    type: signature.typeLattice.rule,
    signature: signature
  });
  logger.debug('ProductionRule.processConstraints: created fs');
  var that = this;
  constraints.forEach(function(c) {
    if (c.isList) {
      // Store the constraint for processing at the end
      storeListConstraints.push(c);
    }
    else {
      if (typeof(c.right) === "string") {
        that.processConstraintType(c, signature);
      }
      else { // Right hand side is a feature path
        that.processConstraint(c, signature);
      }
    }
  });
  storeListConstraints.forEach(function(c) {
    that.processConstraintList(c, signature);
  });
  logger.debug('ProductionRule.processConstraints: exit: ' + '\n' +
    this.fs.prettyPrint(signature));
};

// Pretty prints a production rule to a string
ProductionRule.prototype.prettyPrint = function(signature) {
  var result = '';
  var space = ' ';
  var newline = '\n';
  
  result += this.lhs + space + '->' + space + this.rhs.join(space) + newline;
  if (this.fs) {
    result += this.fs.prettyPrint(signature);
  }
  return(result);
};

module.exports = ProductionRule;