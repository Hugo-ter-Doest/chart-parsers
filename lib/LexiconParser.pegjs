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
  var labelCounter = 0;

  // Checks if the label is a macro label: should start with a character
  function isMacroLabel(label) {
    var regExp = /^[a-zA-Z]/;
    logger.debug('LexiconParser: isMacroLabel(' + label + ') = ' +
      regExp.test(label));
    return(regExp.test(label));
  }

  // Increases labelCounter and returns an implicit label counter starting
  // with "I".
  function genLabel() {
    labelCounter++;
    logger.debug('LexiconParser: implicit label: I' + labelCounter);
    return('I' + labelCounter);
  }
}

lexicon
  = S (lexical_entry) +
{
  logger.debug('Lexicon parsed, result: ' + lexicon.prettyPrint(signature));
  return(lexicon);
}

lexical_entry
  = word: word Arrow fs: featureStructure
{
  fs.setSharedNodes(map_label_to_node, signature);
  fs = fs.completeFS1(signature);
  if (GLOBAL.config.addPhonString) {
    logger.debug('LexiconParser: adding lexical string');
    if (fs.features[GLOBAL.config.featureOfLexicalString]) {
      // Phonological feature is already set -> set lexical string
      fs.features[GLOBAL.config.featureOfLexicalString].lexicalString = word;
    }
    else {
      // Construct an fs
      // Set the PHON feature with the lexical string
      var phonFS = new TypedFeatureStructure({
        type: signature.typeLattice.string,
        signature: signature
      });
      phonFS.lexicalString = word;
      fs.addFeature(GLOBAL.config.featureOfLexicalString, phonFS, signature);
    }
  }
  logger.debug('LexiconParser: fs: ' + fs.prettyPrint(signature));
  lexicon.addWord(word, fs, signature);
  map_label_to_node = {};
}

word
  = StartWord characters: [^\]]+ EndWord
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  logger.debug('LexiconParser: parsing entry: ' + s);
  return(s);
}

featureStructure
  = OpenFS t: type features: features CloseFS
{
  var fs = new TypedFeatureStructure({
    type: t,
    features: features,
    signature: signature
  });
  return(fs);
}

// A sequence of features each having either a value or a reference
features
  = featureSeq: featurePlusValue *
{
  var features = {};
  featureSeq.forEach(function(result) {
    features[result.feature] = result.value;
  });
  return(features);
}

featurePlusValue
  = f: feature hasValue
  v:
  (v: value
  / l: label
{
  // create a temporary node with coreference set to true
  var fs = new TypedFeatureStructure({
    type: signature.typeLattice.bottom,
    signature: signature
  });
  fs.coreference = true;
  fs.label = l;
  // Make sure that the map points to an fs in case there is no value
  // specified with this label
  if (!map_label_to_node[l]) {
    map_label_to_node[l] = fs;
  }
  return(fs);
})
{
  var result = {};
  result.feature = f;
  result.value = v;
  return(result);
}

value
 = l: labelFollowedByValue ?
  v:
  (
   s: lexicalString
{
  var fs = new TypedFeatureStructure({
    type: signature.typeLattice.string,
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
  / fs: featureStructure
{
  return(fs);
}
  / list: concatCrossRefs
{
  var fs = new TypedFeatureStructure({
    type: signature.typeLattice.concatlist,
    signature: signature
  });
  fs.listOfCrossRefs = list;
  fs.coreference = true;
  return(fs);

}
  / list: listOfValues
{
  var fs = new TypedFeatureStructure({
    type: signature.typeLattice.list,
    signature: signature
  });
  fs.listOfCrossRefs = list;
  fs.coreference = true;
  return(fs);
})
{
  if (l) { // So we have a label and a value
    map_label_to_node[l] = v;
    logger.debug('SignatureParser: label registered: ' + l);
  }
  return(v);
}

// A list of one or more feature structures and/or references to feature
// structures
listOfValues
  = (startList endList)
{
  return([]);
}
  / (startList
    firstElt: (fs: featureStructure
{
  var newLabel = genLabel();
  map_label_to_node[newLabel] = fs;
  return(newLabel);
}
     / label)
     restOfList: (
       listSeparator
       (fs: featureStructure
{
  var newLabel = genLabel();
  map_label_to_node[newLabel] = fs;
  return(newLabel);
}
          / label))*
     endList)
{
  var list = [firstElt];
  restOfList.forEach(function(separatorPlusElt) {
    list.push(separatorPlusElt[1]);
  });
  return(list);
}

// Two or more labels concatenated with +
concatCrossRefs
  = startList l1: label moreLabels: (concat label) + endList
{
  var list = [l1];
  moreLabels.forEach(function(concatPlusLabel) {
    list.push(concatPlusLabel[1]);
  });
  return(list);
}

type
  = name: identifier
{
  var type = signature.typeLattice.getTypeByName(name);
  if (type === null) {
    logger.warn('LexiconParser: type not defined: ' + name);
  }
  else {
    logger.debug('LexiconParser: type found: ' + name);
  }
  return(type);
}

feature
  = identifier

// A label is a bracketed number
label
  = bracket1: OpenLabel id: number bracket2: CloseLabel
{
  return(id);
}

labelFollowedByValue
  = bracket1: OpenLabel id: number bracket2: CloseLabelWithoutNewline
{
  return(id);
}

labelFollowedByNewline
  = bracket1: OpenLabel id: number bracket2: CloseLabelWithNewline
{
  return(id);
}

// A lexical string consists of a string surrounded by double quotes
lexicalString
  = stringQuote characters: [^\"]+ stringQuote S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
  }
  return(s);
}

// Two or more labels concatenated with +
concatCrossRefs
  = startList l1: label moreLabels: (concat label) + endList
{
  var list = [l1];
  moreLabels.forEach(function(concatPlusLabel) {
    list.push(concatPlusLabel[1]);
  });
  return(list);
}

listCrossRefs
  = startList labels: (label (listSeparator label) *) ? endList
{
  var list = [];
  if (labels) {
    var firstLabel = labels[0];
    var restLabels = labels[1];
    list.push(firstLabel);
    restLabels.forEach(function(array) {
      list.push(array[1]);
    });
  }
  return(list);
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

number
  = characters: [0-9]+ S
{
  var s = "";
  for (var i = 0; i < characters.length; i++) {
    s += characters[i];
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

stringQuote
  = "\""

concat
  = "+" S

OpenLabel
  = "["

CloseLabel
  = "]" S

CloseLabelWithoutNewline
  = "]" S_no_eol

CloseLabelWithNewline
 = "]" S_no_eol EOL

OpenFS
  = "[" S

CloseFS
  = "]" S

StartWord
  = "["

EndWord
  = "]" S

hasValue
  = ":" S_no_eol

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