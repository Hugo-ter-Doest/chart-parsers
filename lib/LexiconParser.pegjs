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
  var TypedFeatureStructure = require('./TypedFeatureStructure');
  var Lexicon = require('./Lexicon');

  // A signature must be passed in the options variable
  var signature = options.signature;
  var lexicon = new Lexicon(signature);
  var map_label_to_node = {};

  // Checks if the label is a macro label: should start with a character
  function isMacroLabel(label) {
    var regExp = /^[a-zA-Z]/;
    logger.debug('LexiconParser: isMacroLabel(' + label + ') = ' +
      regExp.test(label));
    return(regExp.test(label));
  }
}

lexicon = S (lexical_entry) +
{
  logger.debug('Lexicon parsed, result: ' + lexicon.prettyPrint());
  return(lexicon);
}

lexical_entry = word: word Arrow fs: feature_structure
{
  /*
  var new_type = new Type('\"' + word + '\"', []);
  signature.typeLattice.addType(new_type);
  var new_fs = new TypedFeatureStructure(
    {signature: signature, type: new_type});
  fs.addFeature('string', new_fs, signature);
  */
  fs.setSharedNodes(map_label_to_node, signature);
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
  var fs = new TypedFeatureStructure({type: type,
    features: features, signature: signature});
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
  var fs = new TypedFeatureStructure({type: t,
    signature: signature});
  return(fs);
} / feature_structure) ?
{
  var result = {};
  result.feature = feature;
  result.value = value;
  if (label && !value) {
    if (isMacroLabel(label)) {
      var featureStructures = lexicon.getWord(label);
      if (featureStructures) { // Entry found in lexicon
        // Take the first feature structure
        result.value = featureStructures[0];
        logger.debug('LexiconParser: looked up macro ' + label +
        ' in the lexicon: ' + result.value.prettyPrint());
      }
      else {
        // Macro not found
        expect('Macro ' + label + ' was not found in the lexicon');
      }
    }
    else {
      // create a temporary node with coreference set to true
      var fs = new TypedFeatureStructure({signature: signature});
      fs.coreference = true;
      fs.label = label;
      result.value = fs;
    }
  }
  if (label && value) {
    map_label_to_node[label] = value;
    console.log(label);
  }
  return(result);
}

feature = identifier

//label = bracket1: OpenLabel number: integer bracket2: CloseLabel
label = bracket1: OpenLabel id: identifier bracket2: CloseLabel
{
  //return("[" + id + "]");
  return(id);
}

type = name: identifier
{
  var type = signature.typeLattice.getTypeByName(name);
  return(type);
}

identifier = characters: [a-zA-Z_\-0-9]+ S
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