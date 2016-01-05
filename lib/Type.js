/*
    Type class
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
var logger = log4js.getLogger('Type');

// Constructor
// - name is a string
// - super_types is an array of types; it should be nonempty
function Type(name, super_types, fs) {
  this.super_types = [];
  this.name = name;
  if (super_types) {
    this.super_types = super_types;
  }
  this.fs = fs;
}

// Simple least upper bound for atomic values: type names (strings) are compared
Type.prototype.lubAtomic = function(type, type_lattice) {
  if (this.name === type.name) {
    return(type);
  }
  else {
    return(type_lattice.top);
  }
};

// Returns the least upper bound of two types
// type1 and type2 are strings
// returns the type object
Type.prototype.LUB = function(type, typeLattice) {
  var lub;
  var index1 = this.index;
  var index2 = type.index;
  if (index1 >= index2) {
    lub = typeLattice.lubMatrix[index1][index2];
  }
  else {
    lub = typeLattice.lubMatrix[index2][index1];
  }
  return(typeLattice.types[lub]);
};

// Returns true if this is more general than type: this <= type
// which means that this is a super type of t
Type.prototype.subsumes = function(type) {
  if (this === type) {
    return(true);
  }
  else {
    var result = false;
    var that = this;
    type.super_types.forEach(function(t) {
      result = result || that.subsumes(t);
    });
    return(result);
  }
};

// Prints the type as can be parsed by the type lattice parser
Type.prototype.printSpecification = function() {
  var result = this.name + ' (';
  this.super_types.forEach(function(t) {
    result += t.name + ' ';
  });
  if (this.super_types.length) {
    result = result.substr(0, result.length - 1);
  }
  result += ')';
  return(result);
};

Type.prototype.prettyPrint = function() {
  return(this.name);
};

Type.prototype.prettyPrintWithSuperTypes = function() {
  var result = 'Type: ' + this.name + '\nSuper types: ';
  this.super_types.forEach(function(t) {
    result += t.name + ' ';
  });
  result = result.substr(0, result.length - 2);
  return(result);
};

module.exports = Type;