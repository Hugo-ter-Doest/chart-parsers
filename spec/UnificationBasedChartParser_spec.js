/*
    Unification-based chart parser test
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
var logger = log4js.getLogger('CYK_Item');

var fs = require('fs');

var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

var typeLatticeParser = require('../lib/TypeLatticeParser');
var lexiconParser = require('../lib/LexiconParser');

var GrammarParser = require('../lib/GrammarParser');

var ParserFactory = require('../lib/ParserFactory');
var parserFactory = new ParserFactory();

var base = '/home/hugo/Workspace/chart-parsers/data/UG/';

var lexicon_file =      base + 'UG_lexicon.txt';
var type_lattice_file = base + 'UG_type_lattice.txt';
var grammar_file =      base + 'UG_grammar.txt';
var sentences_file =    base + 'UG_sentences.txt';
var results_file =      base + 'UG_expected_results.txt';

var parser_types = ['Earley', 'LeftCorner', 'HeadCorner', 'CYK'];
parser_types.forEach(function(parserType) {
  describe('Unification grammar chain', function() {

    var type_lattice;
    var lexicon;
    var grammar;
    var parser;
    var sentences;
    var results;

    beforeEach(function(done) { 
      fs.readFile(type_lattice_file, 'utf8', function (error, text) {
        if (error) {
          logger.debug(error);
        }
        // Parse the type lattice
        type_lattice = typeLatticeParser.parse(text);
        type_lattice.appropriate_function = null;
        console.log('beforeEach: parsed the type lattice');
        console.log(type_lattice.pretty_print());
        fs.readFile(lexicon_file, 'utf8', function (error, text) {
          if (error) {
            logger.debug(error);
          }
          // Parse the lexicon
          lexicon = lexiconParser.parse(text, {'type_lattice': type_lattice});
          console.log(lexicon.pretty_print());
          fs.readFile(grammar_file, 'utf8', function (error, text) {
            if (error) {
              logger.debug(error);
            }
            // Parse the grammar
            grammar = GrammarParser.parse(text, {type_lattice: type_lattice});
            logger.debug(grammar.pretty_print());
            // Create the parser
            parser = parserFactory.createParser({'type': parserType, 'grammar': grammar, 'type_lattice': type_lattice});
            //console.log('beforeEach: created the parser');
            // Read sentences from file
            fs.readFile(sentences_file, 'utf8', function (error, text) {
              if (error) {
                logger.debug(error);
              }
              // Parse sentences and compare with result
              sentences = text.split('\n');
              logger.debug('beforeEach: read ' + sentences.length + ' test sentences');
              fs.readFile(results_file, 'utf8', function (error, text) {
                if (error) {
                  logger.error(error);
                }
                results = lexiconParser.parse(text, {'type_lattice': type_lattice});
                logger.debug('beforeEach: read ' + results.length + ' results');
                done();
              });
            });
          });
        });
      });
    });

    it('should correctly parse a set of sentences using unification grammar', function() {
      sentences.forEach(function(sentence) {
        // Tokenize sentence
        var words = tokenizer.tokenize(sentence);
        // Tag sentence
        var tagged_sentence = lexicon.tag_sentence(words);
        logger.debug(tagged_sentence);
        // Parse sentence
        var parse_result = parser.parse(tagged_sentence);
        expected_fs = results.get_word(0)[0];
        parse_result.get_complete_items_from_to(0, 5).forEach(function(item, index, array) {
          logger.debug('Item ' + index + ' of ' + array.length);
          //expected_fs = results.get_word(index)[0];
          logger.debug(expected_fs.pretty_print());
          logger.debug(item.data.fs.pretty_print());
          expect(item.data.fs.is_equal_to(expected_fs, type_lattice)).toEqual(true);
        });
      });
    });
  });
});