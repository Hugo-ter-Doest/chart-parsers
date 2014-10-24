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

var fs = require('fs');
var natural = require('natural');
var GrammarParser = require('../lib/GrammarParser');
var Parser = require('../lib/LeftCornerParser');

var sentences_file = '../data/sentences.txt';
var grammar_file = '../data/Grammar using Brills tags.txt';

tokenizer = new natural.TreebankWordTokenizer();
var wordnet = new natural.WordNet();
var parser;
var sentences;


function initialise(callback) {
  // read sentences from file
  fs.readFile(sentences_file, 'utf8', function (error, sentences_text) {
    if (error) {
      console.log(error);
    }
    sentences = sentences_text.split('\n');
    // read grammar from file
    fs.readFile(grammar_file, 'utf8', function (error, grammar_text) {
      if (error) {
        console.log(error);
      }
      // parse the grammar
      var grammar = GrammarParser.parse(grammar_text);
      // create parser
      parser = new Parser(grammar);
      callback();
    });
  });
}

function tokenize_sentence(sentence) {
  var tokenized = tokenizer.tokenize(sentence);
  console.log(tokenized);
  return(tokenized);
}

function stem_sentence(sentence) {
  for (var i = 0; i < sentence.length; i++) {
    sentence[i] = natural.PorterStemmer.stem(sentence[i]);
  }
  console.log("stem_sentence: " + sentence)
  return(sentence);
}

function tag_sentence(tokenized_sentence, callback) {
  var tagged_sentence = [];
  var nr_tokens = tokenized_sentence.length;

  tokenized_sentence.forEach(function(token) {
    console.log("tag_sentence: processing " + token);
    var tagged_word = [token];
    wordnet.lookup(token, function(results) {
      results.forEach(function(result) {
          if (tagged_word.lastIndexOf(result.pos) <= 0) {
            tagged_word.push(result.pos);
            console.log("Lexical category of " + token + " is: " + result.pos);
          }
      });
      tagged_sentence.push(tagged_word);
      nr_tokens--;
      if (nr_tokens === 0) {
        console.log(JSON.stringify(tagged_sentence));
        callback(tagged_sentence);
      }
    });
  });
}

function parse_sentence(tagged_sentence) {
  return(parser.parse(tagged_sentence));
}

(function main() {
  initialise(function() {
    sentences.forEach(function(sentence){
      tag_sentence(tokenize_sentence(sentence), function(tagged_sentence) {
        var chart = parse_sentence(tagged_sentence);
        console.log(chart.parse_trees());
      });
    });
  });
})();
