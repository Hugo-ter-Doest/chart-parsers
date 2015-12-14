/*
  Feature set class: maintains a collection of allowed features
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

function FeatureSet() {
  this.features = [];
}

// f is a string. If f is a new feature it is added to the collection.
FeatureSet.prototype.addFeature = function (f) {
  if (this.features.indexOf(f) === -1) {
    this.features.push(f);
  }
};

// Returns true if the feature is defined
FeatureSet.prototype.featureIsDefined = function (f) {
  if (GLOBAL.config.APPLY_SIGNATURE) {
    return (this.features.indexOf(f) > -1);
  }
  else {
    return(true);
  }
};

module.exports = FeatureSet;