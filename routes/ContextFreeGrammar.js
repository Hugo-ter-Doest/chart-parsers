/*
 * File: ContextFreeGrammar.js
 * Last edit: 21-6-2014
 */

var fs = require('fs');

// Production rules and start symbol are global
var _terminal_rules = [];
var _non_terminal_rules = [];
var _s = null;

// Checks if B is a nonterminal
exports.is_nonterminal = function(B) {
  var B_is_nonterminal = false;
  // some stops the loop if the callback returns true...
  _non_terminal_rules.some(function(rule) {
    if (rule.lhs === B) {
      B_is_nonterminal = true;
    }
    return(B_is_nonterminal);
  });
  return(B_is_nonterminal);
};

// Looks up all rules with lhs B
exports.rules_with_lhs = function(B) {
  var rules = [];
  
  _non_terminal_rules.forEach(function(rule) {
    if (rule.lhs === B) {
      rules.push(rule);
    }
  });
  return(rules);
};

// Returns the start production rule which is the first rule read from file
exports.start_rule = function() {
  return(_non_terminal_rules[0]);
};

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
 
  var re_rule = /^(\w+)\s*->\s*(.*)$/;
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

    new_rule.lhs = a[1];
    new_rule.rhs = a[2].split(/\s+/);

    // If this is a terminal rule
    if (new_rule.rhs.length === 1) {
      _terminal_rules.push(new_rule);
    }
    else { // Nonterminal rule
      _non_terminal_rules.push(new_rule);
      // We assume that the first nonterminal rule has the start symbol
      if (_s === null) {
        _s = a[1];
      }
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