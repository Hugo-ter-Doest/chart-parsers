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
function FeatureStructureFactory() {

}

// Creates a feature structures. Options may contain:
// - features: a mapping from features to feature structures
// - type: a type for the root node of the feature structure (Type class)
// - type_lattice: will be stored and used for future feature structures
FeatureStructureFactory.prototype.createFeatureStructure = function(options) {
  
  logger.debug('FeatureStructureFactory.createFeatureStructure: enter');
  var type = options.type;
  if (!type) {
    type = options.type_lattice.bottom;
  }
  var fs = new TypedFeatureStructure(type);
  if (options.features) {
    fs.setFeatures(options.features, options.type_lattice);
  }
  return(fs);
};

module.exports = FeatureStructureFactory;