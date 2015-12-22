/*
  PEG parser for parsing signatures
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
  var logger = log4js.getLogger('SignatureParser');

  var Type = require('./Type');
  var TypedFeatureStructure = require('./TypedFeatureStructure');
  var Signature = require('./Signature');

  // Save these options and set them to false, because we are going to parse
  // feature structures that _define_ appropriate features and types.
  oldAppropriateTypes = options.appropriateTypes;
  options.appropriateTypes = false;
  oldAppropriateFeatures = options.appropriateFeatures;
  options.appropriateFeatures = false;
  oldCompleteAndAppropriateFeatures = options.completeAndAppropriateFeatures;
  options.completeAndAppropriateFeatures = false;

  var signature = new Signature(options);
  var map_label_to_node = {};

  // Checks if the label is a macro label: should start with a character
  function isMacroLabel(label) {
    var regExp = /^[a-zA-Z]/;
    logger.debug('LexiconParser: isMacroLabel(' + label + ') = ' +
      regExp.test(label));
    return(regExp.test(label));
  }
}

signature_specification = S (sign_definition) *
{
  signature.appropriateFunction.applyAppropriateTypes =
    options.appropriateTypes;
  signature.appropriateFunction.applyAppropriateFeatures =
    options.appropriateFeatures;
  signature.appropriateFunction.completeAndAppropriateFeatures =
    options.completeAndAppropriateFeatures;
  return(signature);
}

sign_definition = type: type_definition values: (Arrow feature_structure) ?
{
  if (values) {
    type.fs = values[1];
    type.fs.setSharedNodes(map_label_to_node, signature);
    //signature.appropriateFunction.processFeatureStructure(type.fs);
    type.fs = type.fs.inheritFromSuperTypes(signature);
    map_label_to_node = {};
  }
  else {
    type.fs = new TypedFeatureStructure({
      type: type,
      signature: signature
    });
    type.fs = type.fs.inheritFromSuperTypes(signature);
  }
}

type_definition = Type type: type OpenBrace super_types: type_seq CloseBrace
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

type_seq = types: type *
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

type = identifier

feature_structure = OpenFS type: type features: features CloseFS
{
  var typeObject = signature.typeLattice.getTypeByName(type);
  var fs = new TypedFeatureStructure({type: typeObject,
    features: features, signature: signature});
  return(fs);
}

features = features: (feature_plus_value / feature_plus_reference) *
{
  var result = {};
  features.forEach(function(f_plus_v) {
    result[f_plus_v.feature] = f_plus_v.value;
  });
  return(result);
}

feature_plus_value = feature: feature HasValue label: label_with_value ? value:
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
  logger.debug('LexiconParser: feature plus value parsed: ' + result.feature
    + ' ' + result.value.prettyPrint());
  return(result);
}

feature_plus_reference = feature: feature HasValue label: label
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
      expected('Macro ' + label + ' was not found in the lexicon');
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
    // Make sure that the map points to an fs in case there is no value
    // specified with this label
    if (!map_label_to_node[label]) {
      map_label_to_node[label] = fs;
    }
  }
  return(result);
}

feature = identifier

//label = bracket1: OpenLabel number: integer bracket2: CloseLabel
label_with_value = bracket1: OpenLabel id: identifier bracket2:
CloseLabelWithoutNewline
{
  //return("[" + id + "]");
  return(id);
}

label = bracket1: OpenLabel id: identifier bracket2: CloseLabel
{
  //return("[" + id + "]");
  return(id);
}

identifier = characters: [a-zA-Z_\-0-9]+ S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

// Terminals
OpenBrace = 
  "(" S
CloseBrace = 
  ")" S
OpenFS =
  "[" S
CloseFS =
  "]" S
OpenLabel =
  "["
CloseLabel =
  "]" S
CloseLabelWithoutNewline =
 "]" S_no_eol
HasValue =
  ":" S_no_eol
Type =
  "Type" S_no_eol
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