/**
 * File: ParserController.js
 * Last edit: 19-6-2014
 */

var formidable = require('formidable');

var Grammar = require('./ContextFreeGrammar');
var CYK = require('./CYK');
var EarleyChartParser = require('./EarleyChartParser');
var pos = require('pos');

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
function parse_sentence_with_Earley(req, res) {
  var chart_Earley;
  var sentence;
  var start, end, accepted_Earley;
  var time_Earley;
  var complete_parse = {};

  sentence = req.param('input_sentence');
  var words = new pos.Lexer().lex(sentence);
  var taggedWords = new pos.Tagger().tag(words);
  var N = taggedWords.length;
  console.log(taggedWords);
  
  start = new Date().getTime();
  chart_Earley = EarleyChartParser.earley_parse(taggedWords);
  end = new Date().getTime();
  console.log(end);
  time_Earley = end - start;
  console.log(chart_Earley);
  
  accepted_Earley = false;
  var keys_of_final_state = Object.keys(chart_Earley[N]);
  keys_of_final_state.forEach(function(key) {
    var item = chart_Earley[N][key];
    if ((item.rule.lhs === Grammar.start_symbol()) && (item.rule.rhs.length === item.dot)) {
      accepted_Earley = true;
      complete_parse = item;
    }
  });
  
  var nr_items = 0;
  chart_Earley.forEach(function(state) {
    nr_items += Object.keys(state).length;
  });

  res.render('parse_result_Earley', {chart_Earley: chart_Earley,
                                     parsing_time_Earley: time_Earley,
                                     in_language_Earley: accepted_Earley,
                                     N: N,
                                     tagged_sentence: taggedWords,
                                     parse: complete_parse,
                                     nr_items_created: nr_items});
}

//Page for presenting the result of parsing with the CYK parser
function parse_sentence_with_CYK (req, res) {
  var chart_CYK;
  var sentence;
  var start, end, accepted_CYK;
  var time_CYK;

  sentence = req.param('input_sentence');
  var words = new pos.Lexer().lex(sentence);
  var taggedWords = new pos.Tagger().tag(words);
  var N = taggedWords.length;
  console.log(taggedWords);
  
  // CYK
  start = new Date().getTime();
  chart_CYK = CYK.CYK_Chart_Parser(sentence);
  end = new Date().getTime();
  time_CYK = end - start;
  console.log(chart_CYK);
  accepted_CYK = chart_CYK[N - 1][0] ? (chart_CYK[N - 1][0].indexOf(Grammar.start_symbol()) !== -1) : false;

  res.render('parse_result-CYK', {chart_CYK: chart_CYK,
                                  parsing_time_CYK: time_CYK,
                                  in_language_CYK: accepted_CYK,
                                  N: N,
                                  sentence: sentence });
}

//Generic handler for parsing a sentence
exports.parse_sentence = function(req, res) {
  if (req.param("op_CYK")) {
    parse_sentence_with_CYK(req, res);
  }
  else {
    if (req.param("op_Earley")) {
      parse_sentence_with_Earley(req, res);
    }
  }
};
