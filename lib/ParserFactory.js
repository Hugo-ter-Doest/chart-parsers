/*
    Parser factory to create different types of parsers
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

var log4js = require('log4js');
var logger = log4js.getLogger();

var settings = require('./Settings');
  
var CYKParser = require('./CYKParser');
var EarleyParser = require('./EarleyParser');
var LeftCornerParser = require('./LeftCornerParser');
var HeadCornerParser = require('./HeadCornerParser');

var GrammarParser = require('./GrammarParser');

logger.setLevel(settings.loggingLevels.ParserFactory);

// Constructor
function ParserFactory() {
  
}

// Our default parserClass is EarleyParser
ParserFactory.prototype.parserClass = EarleyParser;

ParserFactory.prototype.setGrammar = function(grammar_text) {
  this.grammar = GrammarParser.parse(grammar_text); 
};

// Our Factory method for creating new parser instances
ParserFactory.prototype.createParser = function(options) {

   switch (options.type) {
    case 'CYK': {
      this.parserClass = CYKParser;
      break;
    }
    case 'Earley': {
      this.parserClass = EarleyParser;
      break;
    }
    case 'LeftCorner': {
      this.parserClass = LeftCornerParser;
      break;
    }
    case 'HeadCorner': {
      this.parserClass = HeadCornerParser;
    }
    // defaults to EarleyParser
  } 
  if (options.grammar_text) {
    this.grammar = GrammarParser.parse(options.grammar_text);
  }
  if(options.grammar) {
    this.grammar = options.grammar;
  }

  return new this.parserClass(this.grammar);
};

module.exports = ParserFactory;