/*
  PEG parser for parsing signatures
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
  var logger = log4js.getLogger('SignatureParser');

  var Type = require('./Type');
  var TypedFeatureStructure = require('./TypedFeatureStructure');
  var Signature = require('./Signature');

  var signature = new Signature(options);
  var map_label_to_node = {};
  var labelCounter = 0;

  // Checks if the label is a macro label: should start with a character
  function isMacroLabel(label) {
    var regExp = /^[a-zA-Z]/;
    logger.debug('SignatureParser: isMacroLabel(' + label + ') = ' +
      regExp.test(label));
    return(regExp.test(label));
  }

  // Increases labelCounter and returns an implicit label counter starting
  // with "I".
  function genLabel() {
    labelCounter++;
    logger.debug('SignatureParser: implicit label: I' + labelCounter);
    return('I' + labelCounter);
  }
}

signature_specification
  = S (sign_definition) *
{
  return(signature);
}

sign_definition
  = type: type_definition values: (Arrow feature_structure) ?
{
  if (values) {
    type.fs = values[1];
    type.fs.setSharedNodes(map_label_to_node, signature);
    type.fs = type.fs.inheritFromSuperTypes(signature);
    type.fs = type.fs.completeFS1(signature);
    map_label_to_node = {};
  }
  else {
    type.fs = new TypedFeatureStructure({
      type: type,
      signature: signature
    });
    type.fs = type.fs.inheritFromSuperTypes(signature)
  }
}

type_definition
  = Type type: type OpenBrace super_types: type_seq CloseBrace
{
  // It is allowed to use a pre-defined type like BOTTOM and CONSTITUENT in
  // the signature.
  var result = signature.typeLattice.getTypeByName(type);
  if (result === null) { // Create a new type
    var newType = new Type(type, super_types);
    signature.typeLattice.addType(newType);
    result = newType;
  }
  return(result);
}

type_seq
  = types: type *
{
  var result = [];
  if (types) {
    types.forEach(function(t) {
      var typeObject = signature.typeLattice.getTypeByName(t);
      if (!typeObject) {
        // Abort parsing
        expected('super type: ' + t);
      }
      result.push(typeObject);
    });
  }
  if (result.length === 0) {
    // Abort parsing
    // expected('super type are mandatory');
  }
  return(result);
}

type
  = identifier

feature_structure
  = OpenFS type: type features: features CloseFS
{
  var typeObject = signature.typeLattice.getTypeByName(type);
  var fs = new TypedFeatureStructure({type: typeObject,
    features: features, signature: signature});
  return(fs);
}

// A sequence of features each having either a value or a reference
features
  = features: (feature_plus_value / feature_plus_reference) *
{
  var result = {};
  features.forEach(function(f_plus_v) {
    result[f_plus_v.feature] = f_plus_v.value;
  });
  return(result);
}

// A feature with a value which is either a type or a feature structure
feature_plus_value
  = feature: feature HasValue label: label_with_value ? value:
  (t: type
{
  var typeObject = signature.typeLattice.getTypeByName(t);
  var fs = new TypedFeatureStructure({type: typeObject, signature: signature});
  return(fs);
} / feature_structure)
{
  var result = {};
  result.feature = feature;
  result.value = value;
  if (label) {
    map_label_to_node[label] = value;
    logger.debug('LexiconParser: label registered: ' + label);
  }
  //logger.debug('LexiconParser: feature plus value parsed: ' + result.feature
  //  + ' ' + result.value.prettyPrint(signature));
  return(result);
}

// A feature with a reference which is either a single label or a list of
// coreferences or a concatenation of corefererences
feature_plus_reference
  = feature: feature HasValue value: (
  l: label ? listOfLabels: listOfFeatureStructures
{
  var fs = new TypedFeatureStructure({
    type: signature.typeLattice.list,
    signature: signature
  });
  if (l) {
    fs.label = l;
    map_label_to_node[l] = fs;
  }
  fs.listOfCrossRefs = listOfLabels;
  fs.coreference = true;
  return(fs);
}
  / listOfLabels: concatCrossRefs
{
  var fs = new TypedFeatureStructure({
    type: signature.typeLattice.list,
    signature: signature
  });
  fs.listOfCrossRefs = listOfLabels;
  fs.coreference = true;
  return(fs);
}
  / label: label
{
  var fs = null;
  if (isMacroLabel(label)) {
    var featureStructures = lexicon.getWord(label);
    if (featureStructures) { // Entry found in lexicon
      // Take the first feature structure
      fs = featureStructures[0];
      logger.debug('LexiconParser: looked up macro ' + label +
      ' in the lexicon: ' + result.value.prettyPrint(signature));
    }
    else {
      // Macro not found
      expected('Macro ' + label + ' was not found in the lexicon');
    }
  }
  else {
    // create a temporary node with coreference set to true
    fs = new TypedFeatureStructure({
      type: signature.typeLattice.bottom,
      signature: signature
    });
    fs.coreference = true;
    fs.label = label;
    // Make sure that the map points to an fs in case there is no value
    // specified with this label
    if (!map_label_to_node[label]) {
      map_label_to_node[label] = fs;
    }
  }
  return(fs);
})
{
  var result = {};
  result.feature = feature;
  result.value = value;
  return(result);
}

// A list of one or more feature structures and/or references to feature
// structures
listOfFeatureStructures
  = startList
    firstElt: (fs: feature_structure
      {
        var newLabel = genLabel();
        map_label_to_node[newLabel] = fs;
        return(newLabel);
      }
     / label)
     restOfList: (
       listSeparator
       (fs: feature_structure
           {
             var newLabel = genLabel();
             map_label_to_node[newLabel] = fs;
             return(newLabel);
           }
          / label))*
    endList
{
  var list = [firstElt];
  restOfList.forEach(function(separatorPlusElt) {
    list.push(separatorPlusElt[1]);
  });
  return(list);
}

// Two or more labels concatenated with +
concatCrossRefs
  = l1: label moreLabels: (concat label) +
{
  var list = [l1];
  moreLabels.forEach(function(concatPlusLabel) {
    list.push(concatPlusLabel[1]);
  });
  return(list);
}

listCrossRefs
  = startList labels: (label *) endList
{
  if (!labels) {
    labels = [];
  }
  return(labels);
}

feature = identifier

// A label followed by a value is a bracketed number that is not followed
// by a newline
label_with_value
  = bracket1: OpenLabel id: number bracket2:
CloseLabelWithoutNewline
{
  return(id);
}

// A label is a bracketed number
label
  = bracket1: OpenLabel id: number bracket2: CloseLabel
{
  return(id);
}

number
  = characters: [0-9]+ S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

// An identifier is a string that starts with an alphabetical character, rest
// is alphanumerical
identifier
  = firstChar: [a-zA-Z] restOfChars: [a-zA-Z_\-0-9]* S
{
  var s = "";
  s += firstChar;
  for (var i = 0; i < restOfChars.length; i++) {
    s += restOfChars[i];
  }
  return(s);
}

// Terminals
startList
  = "<" S
endList
  = ">" S
listSeparator
  = "," S_no_eol
concat
  = "+" S
OpenBrace
  = "(" S
CloseBrace
  = ")" S
OpenFS
  = "[" S
CloseFS
  = "]" S
OpenLabel
  = "["
CloseLabel
  = "]" S
CloseLabelWithoutNewline
 = "]" S_no_eol
HasValue
  = ":" S_no_eol
Type
  = "Type" S_no_eol
Arrow
  = "->" S

// Blanks
EOL
  = '\r\n' / '\n' / '\r'
Comment
  = "\/\/" (!EOL .)* (EOL/EOI)
S
  = (' ' / '\t' / EOL / Comment)*
S_no_eol
  = (' ' / '\t' / Comment)*
EOI
  = !.