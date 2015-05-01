/*
    Unification grammar integration test: tests combination of TypeLattice, 
    LexiconParser, and ChartParser
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

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('EarleyItem');

var fs = require('fs');

var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

var fs_base = '/home/hugo/Workspace/feature-structures/lib/';
//var fs_base = '/e/Eclipse Workspace/feature-structures/lib/';
//var fs_base = 'E:\\Eclipse Workspace\\feature-structures\\lib\\';
var typeLatticeParser = require(fs_base + 'TypeLatticeParser');
var lexiconParser = require(fs_base + 'LexiconParser');

var GrammarParser = require('../lib/GrammarParser');

var ParserFactory = require('../lib/ParserFactory');
var parserFactory = new ParserFactory();
var parserType = 'Earley';

var base = '/home/hugo/Workspace/chart-parsers/data/UG/';

var lexicon_file = base + 'UG_lexicon.txt';
var type_lattice_file = base + 'UG_type_lattice.txt';
var grammar_file = base + 'UG_grammar.txt';
var sentences_file = base + 'UG_sentences.txt';

describe('Unification grammar chain', function() {

  var type_lattice;
  var lexicon;
  var grammar;
  var parser;
  var sentences;
  
  beforeEach(function(done) { 
    fs.readFile(type_lattice_file, 'utf8', function (error, text) {
      if (error) {
        console.log(error);
      }
      // Parse the type lattice
      type_lattice = typeLatticeParser.parse(text);
      type_lattice.appropriate_function = null;
      console.log('beforeEach: parsed the type lattice');
      console.log(type_lattice.pretty_print());
      fs.readFile(lexicon_file, 'utf8', function (error, text) {
        if (error) {
          console.log(error);
        }
        // Parse the lexicon
        lexicon = lexiconParser.parse(text, {'type_lattice': type_lattice});
        console.log(lexicon.pretty_print());
        fs.readFile(grammar_file, 'utf8', function (error, text) {
          if (error) {
            console.log(error);
          }
          // Parse the grammar
          grammar = GrammarParser.parse(text, {type_lattice: type_lattice});
          console.log(grammar.pretty_print());
          // Create the parser
          parser = parserFactory.createParser({'type': parserType, 'grammar': grammar, 'type_lattice': type_lattice});
          console.log('beforeEach: created the parser');
          // Read sentences from file
          fs.readFile(sentences_file, 'utf8', function (error, text) {
            if (error) {
              console.log(error);
            }
            // Parse sentences and compare with result
            sentences = text.split('\n');
            console.log('beforeEach: read ' + sentences.length + ' test sentences');
            done();
          });
        });
      });
    });
  });


  console.log('beforeEach executed: sentences ' + sentences);

  it('should correctly parse a set of sentences using unification grammar', function() {
    sentences.forEach(function(sentence) {
      // Tokenize sentence
      var words = tokenizer.tokenize(sentence);
      // Tag sentence
      var tagged_sentence = lexicon.tag_sentence(words);
      logger.debug(tagged_sentence);
      // Parse sentence
      var parse_result = parser.parse(tagged_sentence);
      parse_result.full_parse_items(grammar.get_start_symbol(), 'earleyitem').forEach(function(item) {
        logger.debug(item.pretty_print());
        item.children.forEach(function(c) {
          logger.debug(c.pretty_print());
        });
      });
    });
  });
});