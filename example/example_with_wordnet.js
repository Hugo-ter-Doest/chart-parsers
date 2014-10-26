/*
    Example of a chain of tokenizer, wordnet tagger and parser
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

var fs = require('fs');
var natural = require('natural');
var GrammarParser = require('../lib/GrammarParser');

//var Parser = require('../lib/CYK_Parser');
//var Parser = require('../lib/EarleyParser');
var Parser = require('../lib/LeftCornerParser');
//var Parser = require('../lib/HeadCornerParser');

var sentences_file = '../data/sentences.txt';
var grammar_file = '../data/English grammar using Wordnet tags.txt';

logger.setLevel('INFO');
tokenizer = new natural.TreebankWordTokenizer();
var wordnet = new natural.WordNet();
//var parser;
var sentences;


function initialise(callback) {
  // read sentences from file
  fs.readFile(sentences_file, 'utf8', function (error, sentences_text) {
    if (error) {
      logger.error(error);
    }
    sentences = sentences_text.split('\n');
    // read grammar from file
    fs.readFile(grammar_file, 'utf8', function (error, grammar_text) {
      if (error) {
        logger.error(error);
      }
      // parse the grammar
      var grammar = GrammarParser.parse(grammar_text);
      // create parser
      var parser = new Parser(grammar);
      callback(parser);
    });
  });
}

// Split sentence in words and punctuation
function tokenize_sentence(sentence) {
  var tokenized = tokenizer.tokenize(sentence);
  logger.info("tokenize_sentence: " + tokenized);
  return(tokenized);
}

// Stem the words of the sentence
// Not used in the example, because Wordnet cannot recognise all stems
function stem_sentence(sentence) {
  for (var i = 0; i < sentence.length; i++) {
    sentence[i] = natural.PorterStemmer.stem(sentence[i]);
  }
  logger.info("stem_sentence: " + sentence)
  return(sentence);
}

// Tag the sentence using Wordnet
// Wordnet 'knows' only a limited set of lexical categories:
// n    NOUN
// v    VERB
// a    ADJECTIVE
// s    ADJECTIVE SATELLITE
// r    ADVERB 
// If a word is not found in wordnet POS 'unknown' is assigned
function tag_sentence(tokenized_sentence, callback) {
  var tagged_sentence = new Array(tokenized_sentence.length);
  var wordnet_results = {};
  var nr_tokens = tokenized_sentence.length;

  tokenized_sentence.forEach(function(token) {
    logger.debug("tag_sentence: processing " + token);
    var tagged_word = [token];
    wordnet.lookup(token, function(results) {
      results.forEach(function(result) {
          if (tagged_word.lastIndexOf(result.pos) <= 0) {
            tagged_word.push(result.pos);
            logger.debug("Lexical category of " + token + " is: " + result.pos);
          }
      });
      wordnet_results[token] = tagged_word;
      nr_tokens--;
      if (nr_tokens === 0) {
        for (var i = 0; i < tokenized_sentence.length; i++) {
          tagged_sentence[i] = wordnet_results[tokenized_sentence[i]];
          if (tagged_sentence[i].length === 1) {
            tagged_sentence[i].push('unknown');
          }
        }
        logger.info("tag_sentence: " + JSON.stringify(tagged_sentence));
        callback(tagged_sentence);
      }
    });
  });
}

(function main() {
  initialise(function(parser) {
    sentences.forEach(function(sentence) {
      tag_sentence(tokenize_sentence(sentence), function(tagged_sentence) {
        var chart = parser.parse(tagged_sentence);
        logger.info("main: parse trees of \"" + sentence + "\":\n" + 
                    // Head-Corner or CYK parser: pass cyk_item
                    // Earley parser or Left-Corner parser: pass earleyitem
                    chart.parse_trees(parser.grammar.get_start_symbol(), "earleyitem"));
      });
    });
  });
})();
