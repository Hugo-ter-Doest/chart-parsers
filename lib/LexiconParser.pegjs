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
  feature_structure_factory.set_type_lattice(type_lattice);
  var map_label_to_node = {};
}

lexicon = (lexical_entry) +
{
  //lexicon.set_type_lattice(type_lattice);
  logger.debug('Lexicon parsed, result: ' + lexicon.pretty_print());
  return(lexicon);
}

lexical_entry = word: word Arrow fs: feature_structure
{
  /*
  var new_type = new Type('\"' + word + '\"', []);
  type_lattice.add_type(new_type);
  var new_fs = feature_structure_factory.createFeatureStructure(
    {type_lattice: type_lattice, type: new_type});
  fs.add_feature('string', new_fs, type_lattice);
  */
  fs.set_shared_nodes(map_label_to_node, type_lattice);
  lexicon.add_word(word, fs);
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
  var fs = feature_structure_factory.createFeatureStructure({type: type, features: features});
  return(fs);
}

features = features: feature_plus_value +
{
  var result = {};
  features.forEach(function(feature_plus_value) {
    result[feature_plus_value.feature] = feature_plus_value.value;
  });
  return(result);
}

feature_plus_value = feature: feature HasValue label: label ? value: (t: type 
{
  var fs = feature_structure_factory.createFeatureStructure({type: t}); 
  return(fs);
} / feature_structure) ?
{
  var result = {};
  result.feature = feature;
  result.value = value;
  if (label && !value) {
    // create a temporary node with coreference set to true
    var fs = feature_structure_factory.createFeatureStructure({});
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
  var type = type_lattice.get_type_by_name(name, false);
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