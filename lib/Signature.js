/*
  Signature class that specifies well typed well formed feature structures
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

var TypeLattice = require('./TypeLattice');

function Signature(options) {
  this.typeLattice = new TypeLattice(options);
}

// Output a specification that can be read by SignatureParser.
Signature.prototype.printSpecification = function() {
  var result = '';
  this.typeLattice.types.forEach(function(type) {
    result += type.name + ' (';
    type.super_types.forEach(function(superType, index, array) {
      result += superType.name;
      if (index < array.length - 1) {
        result += ' ';
      }
    });
    result += ')';
    if (type.fs) {
      result += ' -> \n';
      result += type.fs.prettyPrint();
      result += '\n'
    }
    else {
      result += '\n';
    }
  });
  return(result);
};

module.exports = Signature;