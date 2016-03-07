/*
  PEG grammar for lexicons with feature structures
  Copyright (C) 2016 Hugo W.L. ter Doest

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

lexicon
  = S (lexical_entry) +
{
  logger.debug('Lexicon parsed, result: ' + lexicon.prettyPrint());
  return(lexicon);
}

lexical_entry
  = word: word Arrow fs: feature_structure
{
  fs.setSharedNodes(map_label_to_node, signature);
  //fs = fs.completeFS(signature);
  if (GLOBAL.config.addPhonString) {
    logger.debug('LexiconParser: adding lexical string');
    if (fs.features[GLOBAL.config.featureOfLexicalString]) {
      // Phonological feature is already set -> set lexical string
      fs.features[GLOBAL.config.featureOfLexicalString].lexicalString = word;
    }
    else {
      // Construct an fs
      // Set the PHON feature with the lexical string
      var phonType = signature.typeLattice.
        getTypeByName(GLOBAL.config.typeOfLexicalString);
      var phonFS = new TypedFeatureStructure({
        type: phonType,
        signature: signature
      });
      phonFS.lexicalString = word;
      fs.addFeature(GLOBAL.config.featureOfLexicalString, phonFS, signature);
    }
  }
  logger.debug('LexiconParser: fs: ' + fs.prettyPrint());
  lexicon.addWord(word, fs);
  map_label_to_node = {};
}

word
  = StartWord characters: [^\]]+ EndWord
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

feature_structure
  = OpenFS t: type features: features CloseFS
{
  var fs = new TypedFeatureStructure({type: t,
    features: features, signature: signature});
  // Unify with the type's FS if it exists
  //if (t && t.fs) {
  //  var copyOfTypeFS = t.fs.copy(signature);
  //  fs = fs.unify(copyOfTypeFS, signature);
  //}
  return(fs);
}

features
  = features: (feature_plus_value / feature_plus_reference) *
{
  var result = {};
  features.forEach(function(feature_plus_value) {
    result[feature_plus_value.feature] = feature_plus_value.value;
  });
  return(result);
}

// Value is one of the following: lexical string, concatenation of
// (cross references to) strings, type (defined in the type lattice), or
// feature structure
feature_plus_value
  = feature: feature HasValue listOfLabels: concatCrossRefs
{
  var t = signature.typeLattice.getTypeByName(GLOBAL.config.typeOfListOfCrossRefs);
  var fs = new TypedFeatureStructure({
    type: t,
    signature: signature
  });
  fs.listOfCrossRefs = listOfLabels;
  fs.coreference = true;
  var result = {};
  result.feature = feature;
  result.value = fs;
  return(result);
}
  / feature: feature HasValue label: label_with_value ? value:
(
  s: lexicalString
{
  var t = signature.typeLattice.getTypeByName(GLOBAL.config.typeOfLexicalString);
  var fs = new TypedFeatureStructure({
    type: t,
    signature: signature
  });
  fs.lexicalString = s;
  return(fs);
}
  / t: type
{
  var fs = new TypedFeatureStructure({
    type: t,
    signature: signature
  });
  return(fs);
}
  / fs: feature_structure
{
  return(fs);
})
{
  var result = {};
  result.feature = feature;
  result.value = value;
  if (label) {
    map_label_to_node[label] = value;
    logger.debug('LexiconParser: label registered: ' + label);
  }
  logger.debug('LexiconParser: feature plus value parsed: ' + result.feature
    + ' \n' + result.value.prettyPrint());
  return(result);
}

feature_plus_reference
  = feature: feature HasValue label: label
{
  var result = {};
  result.feature = feature;
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
    var fs = new TypedFeatureStructure({
      type: signature.typeLattice.bottom,
      signature: signature
    });
    fs.coreference = true;
    fs.label = label;
    result.value = fs;
  }
  return(result);
}

type = name: identifier
{
  var type = signature.typeLattice.getTypeByName(name);
  if (!type) {
    logger.warn('LexiconParser: type not defined: ' + name);
  }
  return(type);
}

feature
  = identifier

label_with_value
  = bracket1: OpenLabel id: identifier bracket2: CloseLabelWithoutNewline
{
  return(id);
}

label
  = bracket1: OpenLabel id: identifier bracket2: CloseLabel
{
  //return("[" + id + "]");
  return(id);
}

// A lexical string consists of a string surrounded by <>
lexicalString
  = lessThan characters: [^>]+ greaterThan S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

// Two or more labels concatenated with +
concatCrossRefs
  = l1: label concat moreLabels: concatCrossRefs
{
  // Put the new label in front of the array
  moreLabels.unshift(l1);
  return(moreLabels);
}
  / l1: label concat l2: label
{
  // Return a list consisting of the two arrays
  return([l1, l2]);
}

identifier
  = characters: [a-zA-Z_\-0-9]+ S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

integer
  = digits: [0-9]+
{ 
  var s = "";
  for (var i = 0; i < digits.length; i++) {
    s += digits[i];
  }
  return(s);
}

// Terminals
lessThan =
  "<"
greaterThan =
  ">"
concat =
  "+" S
OpenLabel = 
  "["
CloseLabel = 
  "]" S
CloseLabelWithoutNewline =
 "]" S_no_eol
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