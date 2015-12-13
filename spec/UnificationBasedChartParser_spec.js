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

var signatureParser = require('../lib/SignatureParser');
var lexiconParser = require('../lib/LexiconParser');

var GrammarParser = require('../lib/GrammarParser');

var ParserFactory = require('../lib/ParserFactory');
var parserFactory = new ParserFactory();

var base = './spec/data/UnificationBasedChartParser/';

var signatureFile =     base + 'Signature.txt';
var lexicon_file =      base + 'UG_lexicon.txt';
var grammar_file =      base + 'UG_grammar.txt';
var sentences_file =    base + 'UG_sentences.txt';
var results_file =      base + 'UG_expected_results.txt';

var parserTypes = ['Earley', 'LeftCorner', 'HeadCorner', 'CYK'];
parserTypes.forEach(function(parserType) {
  describe('Unification grammar chain', function() {

    var signature;
    var lexicon;
    var grammar;
    var parser;
    var sentences;
    var results;

    beforeEach(function(done) {
      fs.readFile(signatureFile, 'utf8', function (error, text) {
        if (error) {
          logger.debug(error);
        }
        // Parse the type lattice
        signature = signatureParser.parse(text);
        console.log('beforeEach: parsed the type lattice');
        console.log(signature.typeLattice.printLUBMatrix());
        fs.readFile(lexicon_file, 'utf8', function (error, text) {
          if (error) {
            logger.error(error);
          }
          // Parse the lexicon
          lexicon = lexiconParser.parse(text, {signature: signature});
          logger.debug(lexicon.prettyPrint());
          fs.readFile(grammar_file, 'utf8', function (error, text) {
            if (error) {
              logger.error(error);
            }
            // Parse the grammar
            grammar = GrammarParser.parse(text, {signature: signature});
            logger.debug(grammar.prettyPrint());
            // Create the parser
            parser = parserFactory.createParser({
              type: parserType,
              grammar: grammar, 
              unification: true
            });
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
                results = lexiconParser.parse(text, {signature: signature});
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
        var words = sentence.trim().split(/\s+/);
        // Tag sentence
        var taggedSentence = lexicon.tagSentence(words);
        logger.debug(taggedSentence);
        // Parse sentence
        var parse_result = parser.parse(taggedSentence);
        expected_fs = results.getWord('0')[0];
        parse_result.getCompleteItemsFromTo(0, 5).forEach(function(item, index, array) {
          logger.debug('Item ' + index + ' of ' + array.length);
          logger.debug(expected_fs.prettyPrint());
          logger.debug('This is THE FS: ' + item.data.fs.prettyPrint());
          expect(item.data.fs.isEqualTo(expected_fs, signature)).toEqual(true);
        });
      });
    });
  });
});