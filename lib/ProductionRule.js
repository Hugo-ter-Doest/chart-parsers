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
ProductionRule.prototype.processConstraint1 = function(constraint, signature) {
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

ProductionRule.prototype.processListConstraint = function(c, signature) {
  var listFS = new TypedFeatureStructure({
    type: signature.typeLattice.list,
    signature: signature
  });
  listFS.listOfCrossRefs = [];
  var that = this;
  c.right.forEach(function(path) {
    logger.debug('ProductionRule.processConstraintList: processing ' + path);
    if (typeof(path) === "string") { // Resolve the type name
      var t = signature.typeLattice.getTypeByName(path);
      var tempFS = new TypedFeatureStructure({
          type: t,
          signature: signature
      });
      logger.debug('ProductionRule.processConstraintList: created fs ' + tempFS.prettyPrint(signature, true));
      listFS.listOfCrossRefs.push(tempFS);
    }
    else { // Right hand side is a feature path
      var rulePtr = that.fs;
      path.forEach(function(feature) {
        if (rulePtr.features[feature]) {
          // walk further through the fs
        }
        else { // create a new node
          rulePtr.addFeature(
            feature,
            new TypedFeatureStructure({
              type: signature.typeLattice.bottom,
              signature: signature
            }),
            signature);
        }
        rulePtr = rulePtr.features[feature];
      });
      listFS.listOfCrossRefs.push(rulePtr);
    }
  });
  return(listFS);
};

ProductionRule.prototype.processConstraint = function(c, signature) {
  var rulePtr = this.fs;
  var incomingNode = null;
  var incomingFeature = null;
  var newNode = false;

  // Process left hand side
  c.left.forEach(function(feature) {
    if (rulePtr.features[feature]) {
      // walk further through the fs
    }
    else { // create a new node
      rulePtr.addFeature(
        feature,
        new TypedFeatureStructure({
          type: signature.typeLattice.bottom,
          signature: signature
        }),
        signature);
      newNode = true;
    }
    incomingNode = rulePtr;
    incomingFeature = feature;
    rulePtr = rulePtr.features[feature];
  });

  // Process the right right hand side
  if (c.isList) {
    // Store the constraint for processing at the end
    incomingNode.features[incomingFeature] = this.processListConstraint(c, signature);
  }
  else {
    if (typeof(c.right) === "string") {
      // look up the type
      var type = signature.typeLattice.getTypeByName(c.right);
      if (type) {
        rulePtr.type = rulePtr.type.LUB(type, signature.typeLattice);
        if (type.fs) {
          // Copy type's FS
          var copyOfTypeFS = type.fs.copy(signature);
          // Create FS with prefix
          var prefixedTypeFS = copyOfTypeFS.prefixPath1(signature, c.left);
          // Unify the rule's FS with the prefixed fs of the type
          this.fs = this.fs.unify(prefixedTypeFS, signature);
        }
      }
      else {
        logger.warn('ProductionRule.processConstraint: type not found: ' + c.right);
      }
    }
    else { // Right hand side is a feature path
      var RHS = new TypedFeatureStructure({
        type: signature.typeLattice.bottom,
        signature: signature
      });

      var RHSPtr = RHS;
      var prevNode = null;
      var prevFeature = null;

      // Process right hand side
      c.right.forEach(function(feature) {
        RHSPtr.addFeature(
          feature,
          new TypedFeatureStructure({
            type: signature.typeLattice.bottom,
            signature: signature
          }),
          signature);
        prevNode = RHSPtr;
        prevFeature = feature;
        RHSPtr = RHSPtr.features[feature];
      });
      prevNode.features[prevFeature] = rulePtr;
      // unify with the rule's fs
      this.fs = this.fs.unify(RHS, signature);
    }
  }
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
    that.processConstraint(c, signature);
    /*
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
    that.processConstraintList(c, signature);*/
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