/**
 * File: ParserController.js
 * Last edit: 19-6-2014
 */

var formidable = require('formidable');

var Grammar = require('./ContextFreeGrammar');
var CYK = require('./CYK');
var EarleyChartParser = require('./EarleyChartParser');

// Page for loading a grammar
exports.choose_grammar_file = function(req, res) {
  res.render('load_grammar');
};

// Submit a grammar file
exports.submit_grammar = function(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    var grammar_file = files.grammar_file.path + files.grammar_file.name;
    Grammar.read_grammar_file(files.grammar_file.path, function(error) {
      res.redirect('/parse_sentence');
    });
  });
};

// Page for entering a sentence
exports.input_sentence = function(req, res) {
  res.render('parse_sentence');
};

// Page for presenting the result of parsing
exports.parse_sentence = function(req, res) {
  var chart_CYK, chart_Earley;
  var sentence;
  var start, end, accepted;
  var CYK_time, Earley_time;
  
  // CYK
  sentence = CYK.tokenize_sentence(req.param('input_sentence'));
  start = new Date();
  chart_CYK = CYK.CYK_Chart_Parser(sentence);
  end = new Date();
  CYK_time = end - start;
  console.log(chart_CYK);

  // Earley
  start = new Date();
  chart_Earley = EarleyChartParser.earley_parse(sentence);
  end = new Date();
  Earley_time = end - start;
  console.log(chart_Earley);
  
  accepted = chart_CYK[sentence.length - 1][0] ? (chart_CYK[sentence.length - 1][0].indexOf(Grammar.start_symbol()) !== -1) : false;
  res.render('parse_result', {chart: chart_CYK, N: sentence.length, sentence: sentence, parsing_time: CYK_time, in_language: accepted});
};