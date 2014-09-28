/*
    Some logic for loading grammar and parsing sentences
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

var formidable = require('formidable');
var fs = require('fs');

var GrammarParser = require('../lib/GrammarParser');
var CYK_ChartParser = require('../lib/CYKParser');
var EarleyChartParser = require('../lib/EarleyParser');
var LeftCornerChartParser = require('../lib/LeftCornerParser');
var pos = require('pos');
var grammar;

// Page for loading a grammar
exports.choose_grammar_file = function(req, res) {
  res.render('load_grammar');
};

// Submit a grammar file
exports.submit_grammar = function(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    fs.readFile(files.grammar_file.path, 'utf8', function (error, grammar_text) {
      if (error) {
        console.log(error);
      }
      grammar = GrammarParser.parse(grammar_text);
      res.redirect('/input_sentence');
    });
  });
};

// Page for entering a sentence
exports.input_sentence = function(req, res) {
  res.render('parse_sentence');
};

// Parse a sentence
exports.parse_sentence = function(req, res) {
  var sentence = req.param('input_sentence');
  var words = new pos.Lexer().lex(sentence);
  var taggedWords = new pos.Tagger().tag(words);
  var N = taggedWords.length;
  console.log('Tagged sentence: ' + taggedWords);

  var parser;
  if (req.param("op_CYK")) {
    parser = new CYK_ChartParser(grammar);
  }
  else {
    if (req.param("op_Earley")) {
      parser = new EarleyChartParser(grammar);
    }
    else {
      parser = new LeftCornerChartParser(grammar);
    }
  }

  var start = new Date().getTime();
  var chart = parser.parse(taggedWords);
  var end = new Date().getTime();
  
  console.log(chart);
  
  var full_parse_items = chart.full_parse_items(grammar.get_start_symbol());
  
  res.render('parse_result', {type_of_parser: typeof parser,
                              N: N,
                              tagged_sentence: taggedWords,
                              chart: chart,
                              parsing_time: end - start,
                              in_language: full_parse_items.length > 0,
                              parses: full_parse_items,
                              nr_items_created: chart.nr_of_items()});
};