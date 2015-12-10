/*
    PEG grammar for type lattices
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
  var AppropriateFunction = require('./AppropriateFunction');
  var TypeLattice = require('./TypeLattice');

  var appropriate_function = new AppropriateFunction();
  var type_lattice = new TypeLattice({implicit_types: false});
}

type_specification = approp_definition * type_definition *
{
  if (appropriate_function.size()) {
    type_lattice.appropriate_function = appropriate_function;
  }
  else {
    type_lattice.appropriate_function = null;
  }
  return(type_lattice);
}

approp_definition = Approp type1: type feature: feature type2: type
{
  appropriate_function.addMapping(type1, feature, type2);
}

feature = identifier

type_definition = Type type: type OpenBrace super_types: type_seq CloseBrace
{
  var type = new Type(type, super_types);
  type_lattice.addType(type);
}

type_seq = types: type *
{
  var result = [];
  if (types) {
    types.forEach(function(t) {
      result.push(type_lattice.getTypeByName(t));
    });
  }
  return(result);
}

type = name: identifier

identifier = characters: [a-zA-Z_0-9]+ S
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