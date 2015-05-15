/*
    Feature Structure Factory class
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
var logger = log4js.getLogger('FeatureStructureFactory');

var TypedFeatureStructure = require('./TypedFeatureStructure');

// Constructor
function FeatureStructureFactory(typeLattice) {
  this.type_lattice = typeLattice;
}

// Sets the type lattice that should be used for types of (sub) feature
// structures
FeatureStructureFactory.prototype.setTypeLattice = function(typeLattice) {
  this.type_lattice = typeLattice;
};

// Creates a feature structures. Options may contain:
// - dag: a JSON structure that represents the feature structure
// - features: a mapping from features to feature structures
// - type: a type for the root node of the feature structure
// - type_lattice: ...
FeatureStructureFactory.prototype.createFeatureStructure = function(options) {
  
  logger.debug('FeatureStructureFactory.createFeatureStructure: enter');

  if (options.type_lattice) {
    this.type_lattice = options.type_lattice;
  }
  // build the feature structure from the JSON structure
  var fs = new TypedFeatureStructure(options.type, this.type_lattice);
  if (options.dag) {
    fs.process_dag(options.dag, this.type_lattice);
  }
  if (options.features) {
    fs.set_features(options.features, this.type_lattice);
  }
  return(fs);
};

module.exports = FeatureStructureFactory;