/*
  Appropriate class that puts constraints on the use of types
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
var logger = log4js.getLogger('AppropriateFunction');

// Constructor
function AppropriateFunction(options) {
  this.applyAppropriateTypes = options.appropriateTypes;
  this.applyAppropriateFeatures = options.appropriateFeatures;
  this.completeAndAppropriateFeatures = options.completeAndAppropriateFeatures;
  // Admin for mapping a pair (type, feature) to an (one) appropriate type
  this.appropriateType = {};
  // Admin for mapping a type to appropriate (allowed) features
  this.appropriateFeatures = {};
}

// Adds an appropriate mapping of type1, feature to type2
// type1 and type2 are objects, feature is a string
AppropriateFunction.prototype.addMapping = function(type1, feature, type2) {
  logger.debug('AppropriateFunction.addMapping: type ' + type1.name + ' and' +
    ' feature ' + feature + ' and type ' + type2.name);
  if (this.appropriateType[type1.name] && this.appropriateType[type1.name][feature]) {
    logger.warn('AppropriateFunction.addMapping: mapping already defined' +
      ' for type ' + type1.name + ' and feature ' + feature);
  }
  // Add appropriate type mapping
  if (this.appropriateType[type1.name]) {
    this.appropriateType[type1.name][feature] = type2;
  }
  else {
    this.appropriateType[type1.name] = {};
    this.appropriateType[type1.name][feature] = type2;
  }
  // Add appropriate feature mapping type1 -> feature
  if (this.appropriateFeatures[type1.name]) {
    // Add feature to the list of appropriate features
    this.appropriateFeatures[type1.name].push(feature);
  }
  else {
    // Create a an array with feature as first element
    this.appropriateFeatures[type1.name] = [feature];
  }
};

// Returns true if feature and type2 are appropriate for type1
AppropriateFunction.prototype.isAppropriateType = function(type1, feature, type2) {
  logger.debug('AppropriateFunction.isAppropriateType: checking (' + type1.name + ', ' + feature + ') -> ' + type2.name);
  if (this.applyAppropriateTypes) {
    if (this.appropriateType[type1.name] &&
        this.appropriateType[type1.name][feature] &&
        this.appropriateType[type1.name][feature].subsumes(type2)) {
      logger.debug('AppropriateFunction.isAppropriateType: is appropriate: (' + type1.name + ', ' + feature + ') -> ' + type2.name);
      return (true);
    }
    else {
      // Recursively try super types of type1
      var isAppropriate = false;
      var that = this;
      if (type1.super_types) {
        type1.super_types.forEach(function (t) {
          isAppropriate = isAppropriate ||
            that.isAppropriateType(t, feature, type2);
        });
      }
      return (isAppropriate);
    }
  }
  else {
    return(true);
  }
};

// Checks if the feature set is allowed and complete with respect to the
// signature
AppropriateFunction.prototype.hasCompleteAndAppropriateFeatures = function(type, features) {
  if (this.completeAndAppropriateFeatures) {
    var that = this;
    // Are all features allowed?
    var allowed = true;
    Object.keys(features).forEach(function (f) {
      allowed = allowed &&
        (that.appropriateFeatures[type.name].indexOf(f) > -1);
    });
    // Are all features present?
    var complete = true;
    this.appropriateFeatures[type.name].forEach(function (f) {
      complete = complete && features[f];
    });
    return (allowed && complete);
  }
  else {
    return(true);
  }
};

// Returns the size of the appropriate function (in terms of number of entries)
AppropriateFunction.prototype.size = function() {
  var size = 0;
  var that = this;
  Object.keys(this.appropriateType).forEach(function(type, index) {
    size += Object.keys(that.appropriateType[type]).length;
  });
  return(size);
};

// Prints the appropriate function as a specification that can be read by
// the type lattice parser.
AppropriateFunction.prototype.printSpecification = function() {
  var result = '';
  var that = this;
  Object.keys(this.appropriateType).forEach(function(type, index) {
    Object.keys(this.appropriateType[type]).forEach(function(feature, index) {
      result += 'Approp ';
      result += type + ' ' + feature + ' ' + that.appropriateType[type][feature].name;
    });
  });
  result = result.substr(0, result.length - 2);
  return(result);
};

module.exports = AppropriateFunction;