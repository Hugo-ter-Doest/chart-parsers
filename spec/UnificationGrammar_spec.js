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

var fs = require('fs');

var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

var fs_base = '/home/hugo/Workspace/feature_structures/lib';
var typeLatticeParser = require(fs_base + 'TypeLatticeParser');
var lexiconParser = require(fs_base + 'LexiconParser');

var ParserFactory = require('../lib/parserFactory');
var parserFactory = new ParserFactory();

var base = '/home/hugo/Workspace/chart_parser/data/UG/';

var lexicon_file = base + 'UG_lexicon.txt';
var type_lattice_file = base + 'UG_lattice.txt';
var grammar_file = base + 'UG_grammar.txt';
var sentences_file = base + 'UG_sentences.txt';

describe('Unification grammar chain', function() {

  var type_lattice;
  var lexicon;
  var parser;
  var sentences;
  
  it('should correctly read a type lattice', function() {
    fs.readFile(type_lattice_file, 'utf8', function (error, text) {
      // Parse the type lattice
      type_lattice = typeLatticeParser.parse(text);
    });
  });
  
  it('should correctly read a lexicon', function() {
    fs.readFile(lexicon_file, 'utf8', function (error, text) {
      // Parse the lexicon
      lexicon = lexiconParser.parse(text, {type_lattice: type_lattice});
    });
  });
  
  it('should correctly create a unification-based parser', function() {
      fs.readFile(grammar_file, 'utf8', function (error, text) {
        // Set and parse the grammar
        parserFactory.setGrammar(text);
        parser = parserFactory.createParser({'type': parserType});
      });
  });
  
  it('should correctly parse a set of sentences using unification grammar', function() {
    // Read sentences from file
      fs.readFile(sentences_file, 'utf8', function (error, text) {
        // Parse sentences and compare with result
        var sentences = text.split('\n');
        sentences.forEach(function(sentence) {
          // Tokenize sentence
          var words = tokenizer.tokenize(sentence);
          // Tag sentence
          var tagged_sentence = lexicon.tag_sentence(words);
          // Parse sentence
          parse_result = parser.parse(tagged_sentence);
        });
      });
  });
});
  