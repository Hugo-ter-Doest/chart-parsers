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

var FeatureSet = require('./FeatureSet');
var TypeLattice = require('./TypeLattice');
var AppropriateFunction = require('./AppropriateFunction');

function Signature(options) {
  this.featureSet = new FeatureSet();
  this.typeLattice = new TypeLattice(options);
  this.appropriateFunction = new AppropriateFunction(options);
}

// Convenience function for checking both feature and type appropriateness
Signature.prototype.isAppropriate = function(type1, feature, type2) {
  return(
    this.appropriateFunction.isAppropriateType(type1, feature, type2) &&
    this.appropriateFunction.isAppropriateFeature(type1, feature)
  );
};

Signature.prototype.hasCompleteAndAppropriateFeatures = function(type, features) {
  return (this.appropriateFunction.hasCompleteAndAppropriateFeatures(type, features));
};

// Output a specification that can be read by SignatureParser.
Signature.prototype.printSpecification = function() {

};

module.exports = Signature;