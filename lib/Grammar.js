/*
    Grammar class
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
var logger = log4js.getLogger('Grammar');


// Constructor
function Grammar() {
  this.production_rules = [];
  this.nonterminals = {};
  this.symbols = {};
  this.start_symbol = "";
  this.is_CNF = true;
  this.hasUnificationConstraints = false;
}

// Add a rule to the grammar
Grammar.prototype.add_rule = function(rule) {
  this.production_rules.push(rule);
  if (rule.fs) {
    this.hasUnificationConstraints = true;
  }
};

//Checks if B is a nonterminal
Grammar.prototype.is_nonterminal = function(B) {
  //console.log("Checking if " + B + " is a nonterminal: " + this.nonterminals[B]);
  return (this.nonterminals[B]);
};

//Checks if B is a (pre)terminal
Grammar.prototype.is_terminal = function(B) {
  //console.log("Checking if " + B + " is a (pre)terminal: " + !this.nonterminals[B]);
  return (!this.nonterminals[B]);
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
};

Grammar.prototype.rules_with_leftmost_daughter = function (B) {
  rules = [];

  this.production_rules.forEach(function(rule) {
    if (rule.rhs[0] === B) {
      rules.push(rule);
    }
  });
  return(rules);
};

Grammar.prototype.is_leftcorner_of = function(B, C) {
  if (this.lc[C]) {
    return(this.lc[C][B]);
  }
  else {
    return(false);
  }
};

// Check if nonterminal A is head-corner of nonterminal B
Grammar.prototype.is_headcorner_of = function(A, B) {
  if (this.hc[B]) {
    return(this.hc[B][A]);
  }
  else {
    return(false);
  }
}
 
// Get rules with nonterminal H as head
Grammar.prototype.get_rules_with_head = function(H) {
  var res = [];

  this.production_rules.forEach(function(rule) {
    if (rule.rhs[rule.head] === H) {
      res.push(rule);
    }
  });
  return(res);
};

// Computation of the head-corner relation follows the pattern of the 
// computation of the lef-corner relation
Grammar.prototype.compute_hc_relation = function() {
  that = this;
  // Compute the first order hc relation
  this.hc = {};
  this.production_rules.forEach(function(rule) {
    if (!that.hc[rule.lhs]) {
      that.hc[rule.lhs] = {};
    }
    that.hc[rule.lhs][rule.rhs[rule.head]] = true;
  });
  // Reflexive closure
  Object.keys(this.symbols).forEach(function(A){
    if (!that.hc[A]) {
      that.hc[A] = {};
    }
    that.hc[A][A] = true;
  });
  // Transitive closure
  var changed;
  do {
    changed = false;
    Object.keys(this.symbols).forEach(function(A) {
      Object.keys(that.hc[A]).forEach(function(B) {
        Object.keys(that.hc[B]).forEach(function(C) {
          if (!that.hc[A][C]) {
            // add all head corners of C to A
            Object.keys(that.hc[C]).forEach(function(D){
              that.hc[A][D] = true;
              changed = true;
            });
          }
        });
      });
    });
  } while (changed);
};

// Pretty prints the grammar to a string
Grammar.prototype.pretty_print = function() {
  var result = '';
  var newline = '\n';
  this.production_rules.forEach(function(rule) {
    result += rule.pretty_print() + newline;
  });
  return(result);
};

module.exports = Grammar;