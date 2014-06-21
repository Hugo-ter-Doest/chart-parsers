/**
 * File: Grammar.js
 * Last edit: 19-6-2014
 */

var fs = require('fs');

// Production rules and start symbol are global
var _terminal_rules = [];
var _non_terminal_rules = [];
var _s = null;

// Returns the start symbol
exports.start_symbol = function() {
  return _s;
};

// Returns all terminal rules that match right hand side terminal s
exports.left_hand_sides = function(s) {
  var res = [];

  for (var i = 0; i < _terminal_rules.length; ++i) {
    var r = _terminal_rules[i];
    if (r[1] === s) {
      res.push(r[0]);
    }
  }
  return res;
};

// Returns all left hand sides that match right hand side nonterminals s and t
exports.left_hand_sides2 = function(s, t) {
  var res = [];
  
  for (var i = 0; i < _non_terminal_rules.length; ++i) {
    var r = _non_terminal_rules[i];
    if ((r[1] === s) && (r[2] === t)) {
      res.push(r[0]);
    }
  }
  return res;
};

// Parse the grammar into production rules
function parse_grammar(grammar_text) {
  var new_rule;
 
  var re_rule = /^(\w+)\s*->\s*(\w+)(?:\s+(\w+))?\s*\.?$/;
  grammar_text = grammar_text.split(/\r?\n/);
  
  for (var i = 0; i < grammar_text.length; ++i) {
    var r = grammar_text[i];
    
    if (r.length === 0) {
      continue;
    }
    var a = re_rule.exec(r);
    if (a === null) {
      throw "bad rule syntax: " + r;
    }
    if (a[3]) {
      new_rule = [a[1], a[2], a[3]];
      _non_terminal_rules.push(new_rule);
      if (_s === null) {
        _s = a[1];
      }
    }
    else {
      new_rule = [a[1], a[2]];
      _terminal_rules.push(new_rule);
    }
  }
}

// Reset production rules and start symbol
function initialise_grammar() {
  _terminal_rules = [];
  _non_terminal_rules = [];
  _s = null;
}

// Read grammar from file
exports.read_grammar_file = function(grammar_file, callback)  {
  initialise_grammar();
  fs.readFile(grammar_file, 'utf8', function (error, grammar_text) {
    if (error) {
      console.log(error);
    }
    parse_grammar(grammar_text);
    console.log(_terminal_rules);
    console.log(_non_terminal_rules);
    console.log(_s);
    callback(error);
  });
};