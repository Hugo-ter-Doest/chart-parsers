/*
    Module for loading context-free grammars
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

// Parse the grammar into production rules
function parseGrammar(grammar_text, grammar) {
  var new_rule;
 
  var re_rule = /^(\w+)\s*->\s*(.*)$/;
  grammar_text = grammar_text.split(/\r?\n/);
  
  for (var i = 0; i < grammar_text.length; ++i) {
    var r = grammar_text[i];
    
    if (r.length === 0) {
      continue;
    }
    
    if ((r[0] === '/') && (r[1] === '/')) {
      continue;
    }
    
    var a = re_rule.exec(r);
    if (a === null) {
      throw "bad rule syntax: " + r;
    }

    new_rule = {};
    new_rule.lhs = a[1];
    new_rule.rhs = a[2].split(/\s+/);

    grammar.ProductionRules.push(new_rule);
    grammar.Nonterminals[new_rule.lhs] = true;
    if (grammar.StartSymbol === null) {
      grammar.StartSymbol = a[1];
    }
  }
}

//Constructor for the grammar object
function Grammar(grammar_file, callback)  {
  fs.readFile(grammar_file, 'utf8', function (error, grammar_text) {
    if (error) {
      console.log(error);
    }
    this.ProductionRules = [];
    this.Nonterminals = {};
    this.StartSymbol = null;
    parseGrammar(grammar_text, this);
    console.log(this.ProductionRules);
    console.log(this.Nonterminals);
    console.log(this.StartSymbol);
    callback(error);
  });
}

//Checks if B is a nonterminal
Grammar.prototype.is_nonterminal = function(B) {
  console.log("Checking if " + B + " is a nonterminal: " + this.Nonterminals[B]);
  return (this.Nonterminals[B]);
};

// Looks up all rules with lhs B
Grammar.prototype.rules_with_lhs = function(B) {
  var rules = [];
  
  this.ProductionRules.forEach(function(rule) {
    if (rule.lhs === B) {
      rules.push(rule);
    }
  });
  return(rules);
};

// Returns the start production rule which is the first rule read from file
Grammar.prototype.start_rule = function() {
  return(this.ProductionRules[0]);
};

// Returns the start symbol
Grammar.prototype.start_symbol = function() {
  return this.StartSymbol;
};

// Returns all terminal rules that match right hand side terminal s
Grammar.prototype.left_hand_sides = function(s) {
  var res = [];

  this.ProductionsRules.forEach(function(rule) {
    if ((rule.rhs[0] === s) && (rule.rhs.length === 1)) {
      res.push(rule);
    }
  });
  return res;
};

// Returns all left hand sides that match right hand side nonterminals s and t
Grammar.prototype.left_hand_sides2 = function(s, t) {
  var res = [];
  
  this.ProductionsRules.forEach(function(rule) {
    if ((rule.rhs.length === 2) && (rule.rhs[1] === s) && (rule.rhs[2] === t)) {
      res.push(rule);
    }
  });
  return res;
};

// Export the Grammar object
module.exports = Grammar;