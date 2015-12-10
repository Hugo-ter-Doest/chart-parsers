/*
    PEG grammar for lexicons with feature structures
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

{

  var settings = require('../config/Settings');

  var log4js = require('log4js');
  log4js.configure(settings.log4js_config);
  var logger = log4js.getLogger('LexiconParser');

  var Type = require('./Type');
  var TypeLattice = require('./TypeLattice');
  var FeatureStructureFactory = require('./FeatureStructureFactory');
  var Lexicon = require('./Lexicon');

  // A type lattice must be passed in the options variable
  var type_lattice = options.type_lattice;
  var lexicon = new Lexicon();
  var feature_structure_factory = new FeatureStructureFactory();
  var map_label_to_node = {};
}

lexicon = (lexical_entry) +
{
  //lexicon.set_type_lattice(type_lattice);
  logger.debug('Lexicon parsed, result: ' + lexicon.prettyPrint());
  return(lexicon);
}

lexical_entry = word: word Arrow fs: feature_structure
{
  /*
  var new_type = new Type('\"' + word + '\"', []);
  type_lattice.addType(new_type);
  var new_fs = feature_structure_factory.createFeatureStructure(
    {type_lattice: type_lattice, type: new_type});
  fs.addFeature('string', new_fs, type_lattice);
  */
  fs.setSharedNodes(map_label_to_node, type_lattice);
  lexicon.addWord(word, fs);
  map_label_to_node = {};
}

word = StartWord characters: [^\]]+ EndWord
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

feature_structure = OpenFS type: type features: features CloseFS
{
  var fs = feature_structure_factory.createFeatureStructure({type: type,
    features: features, type_lattice: type_lattice});
  return(fs);
}

features = features: feature_plus_value *
{
  var result = {};
  features.forEach(function(feature_plus_value) {
    result[feature_plus_value.feature] = feature_plus_value.value;
  });
  return(result);
}

feature_plus_value = feature: feature HasValue label: label ? value: (t: type 
{
  var fs = feature_structure_factory.createFeatureStructure({type: t,
    type_lattice: type_lattice});
  return(fs);
} / feature_structure) ?
{
  var result = {};
  result.feature = feature;
  result.value = value;
  if (label && !value) {
    // create a temporary node with coreference set to true
    var fs = feature_structure_factory.createFeatureStructure({type_lattice:
      type_lattice});
    fs.coreference = true;
    fs.label = label;
    result.value = fs;
  }
  if (label && value) {
    map_label_to_node[label] = value;
    console.log(label);
  }
  return(result);
}

feature = identifier

label = bracket1: OpenLabel number: integer bracket2: CloseLabel
{
  return("[" + number + "]");
}

type = name: identifier
{
  var type = type_lattice.getTypeByName(name);
  return(type);
}

identifier = characters: [a-zA-Z_0-9]+ S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

integer = digits: [0-9]+
{ 
  var s = "";
  for (var i = 0; i < digits.length; i++) {
    s += digits[i];
  }
  return(s);
}

// Terminals
OpenLabel = 
  "["
CloseLabel = 
  "]" S
OpenFS = 
  "[" S
CloseFS = 
  "]" S
StartWord = 
  "["
EndWord = 
  "]" S
HasValue = 
  ":" S_no_eol
Arrow =
  "->" S

// Blanks
EOL =
  '\r\n' / '\n' / '\r'
Comment =
  "\/\/" (!EOL .)* (EOL/EOI)
S =
  (' ' / '\t' / EOL / Comment)*
S_no_eol =
  (' ' / '\t' / Comment)*
EOI= 
  !.