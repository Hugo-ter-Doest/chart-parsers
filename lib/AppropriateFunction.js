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

// Separator used for concatenation of combinations of type, feature, type
var separator = settings.appropriateSeparator;

// Constructor
function AppropriateFunction() {
  this.appropriate = {};
}

// Adds an appropriate mapping of type1, feature to type2
// type1 and type2 are objects, feature is a string
AppropriateFunction.prototype.addMapping = function(type1, feature, type2) {
  logger.debug('AppropriateFunction.addMapping: type ' + type1.name + ' and' +
    ' feature ' + feature + ' and type ' + type2.name);
  if (this.appropriate[type1.name] && this.appropriate[type1.name][feature]) {
    logger.warn('AppropriateFunction.addMapping: mapping already defined' +
      ' for type ' + type1.name + ' and feature ' + feature);
  }
  if (this.appropriate[type1.name]) {
    this.appropriate[type1.name][feature] = type2;
  }
  else {
    this.appropriate[type1.name] = {};
    this.appropriate[type1.name][feature] = type2;
  }
};

// Checks if type2 is allowed with type1 and feature
// type1 and type2 are objects, feature is a string
AppropriateFunction.prototype.isAppropriate = function(type1, feature, type2) {
  logger.debug('AppropriateFunction.isAppropriate: checking (' + type1.name + ', ' + feature + ') -> ' + type2.name);
  if (GLOBAL.config.APPROPRIATE_FUNCTION) {
    if (type1 && type2 && this.appropriate[type1.name]) {
      // type 2 may be more specific than the appropriate type
      if (this.appropriate[type1.name][feature]) {
        logger.debug('AppropriateFunction.isAppropriate' + JSON.stringify(this.appropriate[type1.name][feature]));
        return (this.appropriate[type1.name][feature].subsumes(type2));
      }
      else {
        return(false);
      }
    }
    else {
      return(false);
    }
  }
  else {
    return(true);
  }
};

// Returns the size of the appropriate function (in terms of number of entries)
AppropriateFunction.prototype.size = function() {
  var size = 0;
  var that = this;
  Object.keys(this.appropriate).forEach(function(type, index) {
    size += Object.keys(that.appropriate[type]).length;
  });
  return(size);
};

// Prints the appropriate function as a specification that can be read by
// the type lattice parser.
AppropriateFunction.prototype.printSpecification = function() {
  var result = '';
  var that = this;
  Object.keys(this.appropriate).forEach(function(type, index) {
    Object.keys(this.appropriate[type]).forEach(function(feature, index) {
      result += 'Approp ';
      result += type + ' ' + feature + ' ' + that.appropriate[type][feature].name;
    });
  });
  result = result.substr(0, result.length - 2);
  return(result);
};

module.exports = AppropriateFunction;