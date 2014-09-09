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

//Constructor for the grammar object
function Grammar(grammar_file, callback) {
  var grammar = this;

  fs.readFile(grammar_file, 'utf8', function (error, grammar_text) {
    if (error) {
      console.log(error);
    }
    grammar.production_rules = [];
    grammar.nonterminals = {};
    grammar.start_symbol = null;
    grammar.is_CNF = true;

    var new_rule;
   
    var re_rule = /^(\w+)\s*->\s*(.*)$/;
    grammar_text = grammar_text.split(/\r?\n/);
    
    //Parse the grammar text
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
      if (new_rule.rhs.length > 2) {
        grammar.is_CNF = false;
      }
      console.log(new_rule);
      grammar.production_rules.push(new_rule);
      grammar.nonterminals[new_rule.lhs] = true;
      if (grammar.start_symbol === null) {
        grammar.start_symbol = a[1];
      }
    }
    console.log(JSON.stringify(grammar));
    callback(grammar);
  });
}

//Checks if B is a nonterminal
Grammar.prototype.is_nonterminal = function(B) {
  console.log("Checking if " + B + " is a nonterminal: " + this.nonterminals[B]);
  return (this.nonterminals[B]);
};

// Looks up all rules with lhs B
Grammar.prototype.rules_with_lhs = function(B) {
  var rules = [];
  
  this.production_rules.forEach(function(rule) {
    if (rule.lhs === B) {
      rules.push(rule);
    }
  });
  return(rules);
};

// Returns the start production rule which is the first rule read from file
Grammar.prototype.start_rule = function() {
  return(this.production_rules[0]);
};

// Returns the start symbol
Grammar.prototype.get_start_symbol = function() {
  return(this.start_symbol);
};

// Returns all rules that match right hand side nonterminals s and t
Grammar.prototype.get_rules_with_rhs = function(s, t) {
  var res = [];
  
  this.production_rules.forEach(function(rule) {
    if ((rule.rhs.length === 2) && (rule.rhs[0] === s) && (rule.rhs[1] === t)) {
      res.push(rule);
    }
  });
  return res;
};

// Based on: http://folk.uio.no/plison/pdfs/lectures/compling2010/pdfs/compling2010-parsingcfg-solutions.pdf
Grammar.prototype.compute_lc_relation = function() {
  that = this;
  // Compute the first order lc relation
  this.lc = {};
  this.production_rules.forEach(function(rule) {
    if (!that.lc[rule.lhs]) {
      that.lc[rule.lhs] = {};
    }
    if (that.is_nonterminal(rule.rhs[0])) {
      that.lc[rule.lhs][rule.rhs[0]] = true;
    }
  });
  // Reflexive closure
  Object.keys(this.nonterminals).forEach(function(A){
    if (!that.lc[A]) {
      that.lc[A] = {};
    }
    that.lc[A][A] = true;
  });
  // Transitive closure
  var changed;
  do {
    changed = false;
    Object.keys(this.nonterminals).forEach(function(A) {
      Object.keys(that.lc[A]).forEach(function(B) {
        Object.keys(that.lc[B]).forEach(function(C) {
          if (!that.lc[A][C]) {
            // add all left corners of C to A
            Object.keys(that.lc[C]).forEach(function(D){
              that.lc[A][D] = true;
              changed = true;
            });
          }
        });
      });
    });
  } while (changed);
  console.log(this.lc);
};

Grammar.prototype.rules_with_lc = function (B) {
  rules = [];
  that = this;

  Object.keys(this.lc[B]).forEach(function(A) {
    that.production_rules.forEach(function(rule) {
      if (rule.rhs[0] === A) {
        rules.push(rule);
      }
    });
  });
  return(rules);
};

// Export the Grammar object
module.exports = Grammar;