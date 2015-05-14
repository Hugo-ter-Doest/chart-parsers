/*
    Example of a chain of tokenizer, wordnet tagger and parser
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
var logger = log4js.getLogger('ExampleWithWordnet');
// Log level is  set in ../config/log4js.json

var fs = require('fs');
var natural = require('natural');
var Tagger = require('simple-pos-tagger');

var ChartParsers = require('../index');
var parserFactory = new ChartParsers.ParserFactory();
var GrammarParser = ChartParsers.GrammarParser;

var path = '/home/hugo/Workspace/chart-parsers/';
var sentences_file =      path + 'data/Example with Wordnet/sentences.txt';
var tagger_config_file =  path + 'node_modules/simple-pos-tagger/data/English/lexicon_files.json';
var grammar_file =        path + 'data/Example with Wordnet/English grammar using Wordnet tags.txt';

tokenizer = new natural.TreebankWordTokenizer();
var wordnet = new natural.WordNet();
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
      var parser = parserFactory.createParser({type: 'Earley', grammar: grammar, unification: false});
      new Tagger(tagger_config_file, function(tagger) {
        logger.debug("POS tagger and parser are ready");
        callback(tagger, parser);
      });
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
  logger.info("stem_sentence: " + sentence);
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
function tag_sentence_wordnet(tagged_sentence, callback) {
  var wordnet_results = {};
  var nr_tokens = tagged_sentence.length;

  tagged_sentence.forEach(function(tagged_word) {
    logger.debug("tag_sentence: processing " + tagged_word);
    wordnet.lookup(tagged_word[0], function(results) {
      results.forEach(function(result) {
        if (tagged_word.lastIndexOf(result.pos) <= 0) {
          tagged_word.push(result.pos);
          logger.debug("Lexical category of " + tagged_word[0] + " is: " + result.pos);
        }
      });

      nr_tokens--;
      if (nr_tokens === 0) {
        logger.info("Exit tag_sentence_wordnet: " + JSON.stringify(tagged_sentence));
        callback(tagged_sentence);
      }
    });
  });
}

function tag_sentence_function_words(fw_tagger, tokenized_sentence) {
  var tagged_sentence = [];
  
  logger.debug("Enter tag_sentence_function_words( " + fw_tagger + ", " + tokenized_sentence + ")");
  tokenized_sentence.forEach(function(token) {
    var tagged_word = [token];
    var fw_tags = fw_tagger.tag_word(token);
    logger.debug("tag_sentence_function_words: function word tags: " + fw_tags);
    if (fw_tags) {
      tagged_word = tagged_word.concat(fw_tags);
    }
    tagged_sentence.push(tagged_word);
  });
  logger.info("Exit tag_sentence_function_words: " + JSON.stringify(tagged_sentence));
  return(tagged_sentence);
}

(function main() {
  initialise(function(fw_tagger, parser) {
    sentences.forEach(function(sentence) {
      var tokenized_sentence = tokenize_sentence(sentence);
      var tagged_sentence = tag_sentence_function_words(fw_tagger, tokenized_sentence);
      tag_sentence_wordnet(tagged_sentence, function(tagged_sentence) {
        var chart = parser.parse(tagged_sentence);
        logger.info("main: parse trees of \"" + sentence + "\":\n" + 
          // Head-Corner or CYK parser: pass cyk_item
          // Earley parser or Left-Corner parser: pass earleyitem
          chart.parse_trees(parser.grammar.get_start_symbol(), "earleyitem"));
      });
    });
  });
})();
