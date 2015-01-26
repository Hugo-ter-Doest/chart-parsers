/*
    Index file to export necessary modules
    Copyright (C) 2014 Hugo W.L. ter Doest

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

module.exports.GrammarParser = require('./lib/GrammarParser');
module.exports.Chart = require('./lib/Chart');

CYKParser = require('./lib/CYKParser');
EarleyParser = require('./lib/EarleyParser');
LeftCornerParser = require('./lib/LeftCornerParser');
HeadCornerParser = require('./lib/HeadCornerParser');

function Parser(type, grammar) {
  switch (type) {
    case 'CYK': {
      return(new CYKParser(grammar));
    }
    case 'Earley': {
      return(new EarleyParser(grammar));
    }
    case 'LeftCorner': {
      return(new LeftCornerParser(grammar));
    }
    case 'HeadCorner': {
      return(new HeadCornerParser(grammar));
    }
    default: {
      return(new LeftCornerParser(grammar));
    }
  } 
}

module.exports.Parser = Parser;