/*
    Unit test for GrammarParser.js using Jasmine
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
var GrammarParser = require('../lib/GrammarParser');

var path = '/home/hugo/Workspace/chart-parsers/data/CFG/';
var minimal_grammar_file = path + 'minimal_grammar.txt';
var grammar_for_CFG_file = path + 'test_grammar_for_CFG.txt';
var math_grammar_file = path + 'math_expressions.txt';

describe('GrammarParser', function() {
  var grammar_text;
  var grammar;
  
  beforeEach(function() {
      this.addMatchers({
        toEqualProductionRules: function(array) {
          this.message = function() {
            return "Expected " + this.actual + " to be array " + array + ".";
          };
          var arraysAreSame = function(x, y) {
            var arraysAreSame = (x.length === y.length);
            if (arraysAreSame) {
              for(var i; i < x.length; i++)
                 if(x[i] !== y[i])
                    arraysAreSame = false;
              return arraysAreSame;
            }
            else {
              return(false);
            }
          };
          return arraysAreSame(this.actual, array);
        }
      });
    });
    
//S ->
  it('should read a text file', function(done) {
    fs.readFile(minimal_grammar_file, 'utf8', function (error, text) {
      expect(text).toBeDefined();
      grammar_text = text;
      done();
    });
  });
  it('should correctly parse a minial grammar consisting of the rule S -> (empty)', function () {
    var expected = {};
    expected.production_rules = [ { 'lhs' : 'S', 'rhs' : [  ], 'head' : 0, 'fs' : null } ];
    expected.nonterminals = {'S': true};
    expected.start_symbol = 'S';
    expected.is_CNF = false;
    grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqualProductionRules(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);
  });

  it('should correctly compute the left-corner relation', function () {
    grammar.compute_lc_relation();
    var expected_lc = {'S': {'S': true}};
    expect(grammar.lc).toEqual(expected_lc);
  });
  
  it('should recognise nonterminals', function () {
    expect(grammar.is_nonterminal('S')).toEqual(true);
  });

  it('should recognise terminals', function () {
    expect(grammar.is_terminal('S')).toEqual(false);
  });
  
  it('should look up rules with left-hand-side S', function () {
    expect(grammar.rules_with_lhs('S')).toEqualProductionRules([ { lhs : 'S', rhs : [  ], head : 0, fs : null } ]);
  });
  
  it('should look up the start rule', function () {
    expect(grammar.start_rule()).toEqual({'lhs': 'S', 'rhs': [], 'constraints': [], 'head': 0});
  });

  it('should look up the start symbol', function () {
    expect(grammar.get_start_symbol()).toEqual('S');
  });
  
  it('should test left-corner relations', function () {
    expect(grammar.is_leftcorner_of('S', 'S')).toEqual(true);
  });
  
  
  
  
//S -> NP VP
//NP -> DT NN
//PP -> IN NP
//VP -> VBP NP
//VP -> work
  it('should read another text file', function(done) {
    fs.readFile(grammar_for_CFG_file, 'utf8', function (error, text) {
      expect(text).toBeDefined();
      grammar_text = text;
      done();
    });
  });
  it('should correctly parse a grammar in CNF', function () {
    var expected = {};
    expected.production_rules = [{'lhs': 'S', 'rhs': ['NP', 'VP'], 'constraints': [], 'head': 0}, 
                                 {'lhs': 'NP', 'rhs': ['DT', 'NN'], 'constraints': [], 'head': 0}, 
                                 {'lhs': 'PP', 'rhs': ['IN', 'NP'], 'constraints': [], 'head': 0}, 
                                 {'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'constraints': [], 'head': 0}, 
                                 {'lhs': 'VP', 'rhs': ['work'], 'constraints': [], 'head': 0}];
    expected.nonterminals = {'S': true, 'NP': true, 'PP': true, 'VP': true};
    expected.start_symbol = 'S';
    expected.is_CNF = true;
    grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqual(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);
  });

  it('should correctly compute the left-corner relation', function () {
    grammar.compute_lc_relation();
    var expected_lc = {'S': {'S': true, 'NP': true},
                       'NP': {'NP': true},
                       'PP': {'PP': true},
                       'VP': {'VP': true}
                      };
    expect(grammar.lc).toEqual(expected_lc);
  });
  
  it('should recognise nonterminals', function () {
    expect(grammar.is_nonterminal('S')).toEqual(true);
    expect(grammar.is_nonterminal('NP')).toEqual(true);
    expect(grammar.is_nonterminal('VP')).toEqual(true);
    expect(grammar.is_nonterminal('PP')).toEqual(true);
    expect(grammar.is_nonterminal('DT')).toBeFalsy();
    expect(grammar.is_nonterminal('IN')).toBeFalsy();
    expect(grammar.is_nonterminal('VBP')).toBeFalsy();
    expect(grammar.is_nonterminal('work')).toBeFalsy();
  });

  it('should recognise terminals', function () {
    expect(grammar.is_terminal('S')).toEqual(false);
    expect(grammar.is_terminal('NP')).toEqual(false);
    expect(grammar.is_terminal('VP')).toEqual(false);
    expect(grammar.is_terminal('PP')).toEqual(false);
    expect(grammar.is_terminal('DT')).toEqual(true);
    expect(grammar.is_terminal('IN')).toEqual(true);
    expect(grammar.is_terminal('VBP')).toEqual(true);
    expect(grammar.is_terminal('work')).toEqual(true);
  });
  
  it('should look up rules with left-hand-side S', function () {
    expect(grammar.rules_with_lhs('S')).toEqual([{'lhs': 'S', 'rhs': ['NP', 'VP'], 'constraints': [], 'head': 0}]);
  });

  it('should look up rules with left-hand-side NP', function () {
    expect(grammar.rules_with_lhs('NP')).toEqual([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'constraints': [], 'head': 0}]);
  });
  
  it('should look up rules with left-hand-side PP', function () {
    expect(grammar.rules_with_lhs('PP')).toEqual([{'lhs': 'PP', 'rhs': ['IN', 'NP'], 'constraints': [], 'head': 0}]);
  });
  
  it('should look up rules with left-hand-side VP', function () {
    expect(grammar.rules_with_lhs('VP')).toEqual([{'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'constraints': [], 'head': 0},
                                                  {'lhs': 'VP', 'rhs': ['work'], 'constraints': [], 'head': 0}]);
  });

  it('should look up the start rule', function () {
    expect(grammar.start_rule()).toEqual({'lhs': 'S', 'rhs': ['NP', 'VP'], 'constraints': [], 'head': 0});
  });
  
  it('should look up the start symbol', function () {
    expect(grammar.get_start_symbol()).toEqual('S');
  });

  it('should look up production rules based on right hand side symbols (for CYK)', function () {
    expect(grammar.get_rules_with_rhs('NP', 'VP')).toEqual([{'lhs': 'S', 'rhs': ['NP', 'VP'], 'constraints': [], 'head': 0}]);
    expect(grammar.get_rules_with_rhs('DT', 'NN')).toEqual([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'constraints': [], 'head': 0}]);
    expect(grammar.get_rules_with_rhs('IN', 'NP')).toEqual([{'lhs': 'PP', 'rhs': ['IN', 'NP'], 'constraints': [], 'head': 0}]);
    expect(grammar.get_rules_with_rhs('VBP', 'NP')).toEqual([{'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'constraints': [], 'head': 0}]);
    expect(grammar.get_rules_with_rhs('DT', 'NN')).toEqual([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'constraints': [], 'head': 0}]);
  });

  it('should look up production rules with a given left-most daughter', function () {
    expect(grammar.rules_with_leftmost_daughter('NP')).toEqual([{'lhs': 'S', 'rhs': ['NP', 'VP'], 'constraints': [], 'head': 0}]);
    expect(grammar.rules_with_leftmost_daughter('DT')).toEqual([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'constraints': [], 'head': 0}]);
    expect(grammar.rules_with_leftmost_daughter('IN')).toEqual([{'lhs': 'PP', 'rhs': ['IN', 'NP'], 'constraints': [], 'head': 0}]);
    expect(grammar.rules_with_leftmost_daughter('VBP')).toEqual([{'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'constraints': [], 'head': 0}]);
    expect(grammar.rules_with_leftmost_daughter('work')).toEqual([{'lhs': 'VP', 'rhs': ['work'], 'constraints': [], 'head': 0}]);
  });

  it('should test left-corner relations', function () {
    expect(grammar.is_leftcorner_of('S', 'S')).toEqual(true);
    expect(grammar.is_leftcorner_of('NP', 'NP')).toEqual(true);
    expect(grammar.is_leftcorner_of('VP', 'VP')).toEqual(true);
    expect(grammar.is_leftcorner_of('PP', 'PP')).toEqual(true);
    expect(grammar.is_leftcorner_of('DT', 'DT')).toEqual(false);
    expect(grammar.is_leftcorner_of('VBP', 'VBP')).toEqual(false);
    expect(grammar.is_leftcorner_of('IN', 'IN')).toEqual(false);
    expect(grammar.is_leftcorner_of('NP', 'S')).toEqual(true);
    expect(grammar.is_leftcorner_of('NP', 'PP')).toBeFalsy();
    expect(grammar.is_leftcorner_of('PP', 'NP')).toBeFalsy();
    expect(grammar.is_leftcorner_of('VP', 'NP')).toBeFalsy();
    expect(grammar.is_leftcorner_of('NP', 'VP')).toBeFalsy();
    expect(grammar.is_leftcorner_of('PP', 'VP')).toBeFalsy();
    expect(grammar.is_leftcorner_of('VP', 'PP')).toBeFalsy();
  });

//E -> E plus E
//E -> E minus E
//E -> E divide E
//E -> E multiply E
//E -> number
  it('should read another text file', function(done) {
    fs.readFile(math_grammar_file, 'utf8', function (error, text) {
      expect(text).toBeDefined();
      grammar_text = text;
      done();
    });
  });
  
  it('should correctly parse a context-free grammar (that is not in CNF)', function () {
    var expected = {};
    expected.production_rules = [{'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'constraints': [], 'head': 1}, 
                                 {'lhs': 'E', 'rhs': ['E', 'minus', 'E'], 'constraints': [], 'head': 1}, 
                                 {'lhs': 'E', 'rhs': ['E', 'divide', 'E'], 'constraints': [], 'head': 1}, 
                                 {'lhs': 'E', 'rhs': ['E', 'multiply', 'E'], 'constraints': [], 'head': 1}, 
                                 {'lhs': 'E', 'rhs': ['number'], 'constraints': [], 'head': 0}];
    expected.nonterminals = {'E': true};
    expected.start_symbol = 'E';
    expected.is_CNF = false;
    grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqual(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);
   });

  it('should correctly compute the left-corner relation', function () {
    grammar.compute_lc_relation();
    // left corner of E is E
    expect(grammar.lc).toEqual({'E': {'E': true}});
  });
  
  it('should recognise nonterminals', function () {
    expect(grammar.is_nonterminal('E')).toEqual(true);
  });

  it('should recognise terminals', function () {
    expect(grammar.is_terminal('E')).toEqual(false);
  });
  
  it('should look up the start rule', function () {
    expect(grammar.start_rule()).toEqual({'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'constraints': [], 'head': 1});
  });
  
  it('should look up the start rule', function () {
    expect(grammar.get_start_symbol()).toEqual('E');
  });
  
  it('should look up production rules with a given left-most daughter', function () {
    expect(grammar.rules_with_leftmost_daughter('E')).toEqual([{'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'constraints': [], 'head': 1},
                                                               {'lhs': 'E', 'rhs': ['E', 'minus', 'E'], 'constraints': [], 'head': 1},
                                                               {'lhs': 'E', 'rhs': ['E', 'divide', 'E'], 'constraints': [], 'head': 1},
                                                               {'lhs': 'E', 'rhs': ['E', 'multiply', 'E'], 'constraints': [], 'head': 1}]);
    expect(grammar.rules_with_leftmost_daughter('number')).toEqual([{'lhs': 'E', 'rhs': ['number'], 'constraints': [], 'head': 0}]);
  });
  
  it('should test left-corner relations', function () {
    expect(grammar.is_leftcorner_of('E', 'E')).toEqual(true);
    expect(grammar.is_leftcorner_of('number', 'E')).toBeFalsy();
  });
});