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
  var logger = log4js.getLogger('TypeLatticeParser');

  var Type = require('./Type');
  var Signature = require('./Signature');
  var signature = new Signature(options);
}

signature_specification = type_definition * approp_definition *
{
  return(signature);
}

feature_definition = Feature f: feature
{
  signature.featureSet.addFeature(f);
}

approp_definition = Approp t1: type feature: feature t2: type
{
  var type1 = signature.typeLattice.getTypeByName(t1);
  var type2 = signature.typeLattice.getTypeByName(t2);
  signature.featureSet.addFeature(feature);
  if ((type1 !== null) &&
      (type2 !== null)) {
    signature.appropriateFunction.addMapping(type1, feature, type2);
  }
  else {
    // Abort parsing
    expected('One of the types or the feature was not specified: ' + t1 +
     ' ' + feature + ' ' + t2);
  }
}

feature = identifier

type_definition = Type type: type OpenBrace super_types: type_seq CloseBrace
{
  var type = new Type(type, super_types);
  signature.typeLattice.addType(type);
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
  return(result);
}

type = name: identifier

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
Type = 
  "Type" S_no_eol
Approp = 
  "Approp" S_no_eol

Feature =
  "Feature" S_no_eol

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