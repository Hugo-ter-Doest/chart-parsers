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

// Adds an appropriate combination of type1, feature and type2
AppropriateFunction.prototype.addMapping = function(type1, feature, type2) {
  this.appropriate[type1 + separator + feature + separator + type2] = true;
};

// Checks if type2 is allowed with type1 and feature 
AppropriateFunction.prototype.isAppropriate = function(type1, feature, type2) {
  logger.debug('AppropriateFunction.isAppropriate: checking ' + type1.name + separator + feature + separator + type2.name);
  if (GLOBAL.config.APPROPRIATE_FUNCTION) {
    if (type1 && type2) {
      return (this.appropriate[type1.name + separator + feature + separator + type2.name]);
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
  return(Object.keys(this.appropriate).length);
};

// Prints the appropriate function as a specification that can be read by
// the type lattice parser.
AppropriateFunction.prototype.printSpecification = function() {
  var result = '';
  Object.keys(this.appropriate).forEach(function(key, index){
    result += 'Approp ';
    var typeFeatureType = key.split(separator);
    result += typeFeatureType[0] + ' ' + typeFeatureType[1] + ' ' + typeFeatureType[2];
  });
  result = result.substr(0, result.length - 2);
  return(result);
};

module.exports = AppropriateFunction;