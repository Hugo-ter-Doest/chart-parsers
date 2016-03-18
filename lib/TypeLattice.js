/*
    Type Lattice class
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
var logger = log4js.getLogger('TypeLattice');

require('string.prototype.repeat');

var Type = require('./Type');

// Initialises the lattice
// Creates top and bottom and initialises the list of types and the lubMatrix
// options: implicitTypes configures if types can be implicitly introduced
function TypeLattice(options) {
  this.implicitTypes = options.implicitTypes;
  // least specific, smallest type
  this.bottom = new Type("BOTTOM");
  // undefined, result of two types that cannot be unified
  this.top = new Type("TOP");
  this.lubMatrix = new Array(2);
  this.bottom.index = 0;
  this.top.index = 1;
  this.lubMatrix[0] = [this.bottom.index];
  this.lubMatrix[1] = [this.top.index, this.top.index];
  this.types = [this.bottom, this.top];
  this.number_of_types = 2;

  // Add a type for feature structure that belong to rules
  this.rule = new Type('RULE', [this.bottom]);
  this.addType(this.rule);
  // Add a type for feature structures that belong to consituents of the
  // context-free backbone
  this.constituent = new Type('CONSTITUENT', [this.rule]);
  this.addType(this.constituent);
  // Add a type for lists of cross references in feature structures
  this.list = new Type('LIST', [this.bottom]);
  this.addType(this.list);
  // Add a type for strings
  this.string = new Type('STRING', [this.bottom]);
  this.addType(this.string);
}

// Look up the type with name name
// If a type is not found, it is created and added to the lattice with empty 
// supertypes
// Lookup is now inefficient for a large number of types
// Maybe add a map from names to types later
TypeLattice.prototype.getTypeByName = function(name) {
  var found = false;
  var i = 0;

  logger.debug('TypeLattice.getTypeByName: looking up type: ' + name);
  // loop while not found
  do {
    found = (this.types[i].name === name);
    i++;
  }
  while ((found === false) && (i < this.types.length));
  if (found) {
    logger.debug('TypeLattice.getTypeByName: found!');
    return(this.types[i-1]);
  }
  else {
    if (this.implicitTypes) {
      // create the type
      var new_type = new Type(name, []);
      this.addType(new_type);
      return(new_type);
    }
    else {
      return(null);
    }
  }
};

// Adds a type to the lattice
// type is an object
TypeLattice.prototype.addType = function(type) {
  type.index = this.number_of_types;
  this.number_of_types++;
  this.types.push(type);
  logger.debug('TypeLattice.addType: ' + type.prettyPrint());
  // add a row to the lubMatrix of length this.number_of_types
  this.lubMatrix.push(new Array(this.number_of_types));
  // initialise the new row to top
  for (var i = 0; i < this.number_of_types; i++) {
    this.lubMatrix[type.index][i] = this.top.index;
  }
  // add trivial least upper bounds with bottom and itself
  this.lubMatrix[type.index][this.bottom.index] = type.index;
  this.lubMatrix[type.index][type.index] = type.index;
  // add the super types to the matrix: least upper bound is the new type
  var that = this;
  if (type.super_types) {
    type.super_types.forEach(function(super_type) {
      that.lubMatrix[type.index][super_type.index] = type.index;
    });
  }
  // recalculate the lubMatrix
  this.computeLUBMatrix();
};

// Computes the least upper bound matrix
// Based on an algorithm by Mark Moll
TypeLattice.prototype.computeLUBMatrix = function() {
  var i,j;
  // variables for better readability
  var n = this.number_of_types;
  var newType = n - 1;
  var lub = this.lubMatrix;

  logger.debug('TypeLattice.computeLUBMatrix');

  // Rule 1: newType + i = newType /\ i + j = i => newType + j = newType
  for (i = n - 2; i > 2; i--) {
    if (lub[newType][i] === newType) {
      for (j = i - 1; j > 1; j--) {
        if (lub[i][j] === i) {
          lub[newType][j] = newType;
        }
      }
    }
  }

  // Rule 2: newType + i = newType /\ newType + j = newType /\ i + j = TOP => i + j = newType
  for (i = 3; i < n - 1; i++) {
    if (lub[newType][i] === newType) {
      for (j = 2; j < i; j++) {
        if ((lub[newType][j] === newType) && (lub[i][j] === this.top.index)) {
          lub[i][j] = newType;
        }
      }
    }
  }
};

// Prints a specification of the type lattice that can be read by the type
// lattice parser
TypeLattice.prototype.printSpecification = function() {
  var res = '';
  for (var i = 2; i < this.types.length; i++) {
    res += this.types[i].printSpecification() + '\n';
  }
  return(res);
};

// Prints a table with the least upper bound relation
TypeLattice.prototype.printLUBMatrix = function() {
  var n = this.number_of_types;
  var result = '';
  
  result += '\t' + '-'.repeat(8);
  result += '\n';
  for (var i = 0; i < n; i++) {
    result += this.types[i].name.substr(0,6);
    result += '\t|';
    for (var j = 0; j <= i; j++) {
      result += this.types[this.lubMatrix[i][j]].name.substring(0, 6) + '\t|';
    }
    result += '\n';
    result += '\t' + '-'.repeat(8 * (i + ((i === n-1) ? 1 : 2)));
    result += '\n';
  }
  result += '\t ';
  for (i = 0; i < n; i++) {
    result += this.types[i].name.substr(0,6) + '\t ';
  }  
  return(result);
};

module.exports = TypeLattice;