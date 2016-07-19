/*
    Unit test for GrammarParser.js using Jasmine
    Copyright (C) 2016 Hugo W.L. ter Doest

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
var logger = log4js.getLogger('GammarParser');

var fs = require('fs');
var GrammarParser = require('../lib/GrammarParser');
var SignatureParser = require('../lib/SignatureParser');

var path = './spec/data/CFGChartParser/';
var minimal_grammar_file = path + 'minimal_grammar.txt';
var grammar_for_CFG_file = path + 'test_grammar_for_CFG.txt';
var math_grammar_file = path + 'math_expressions.txt';

var UG_GrammarFile = './spec/data/GrammarParser/' + 'UG_Grammar.txt';
var UG_SignatureFile = './spec/data/GrammarParser/' + 'UG_Signature.txt';
var UG_ResultsFile = './spec/data/GrammarParser/' + 'UG_Results.txt';

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
                 if(!x[i].isEqualTo(y[i]))
                    arraysAreSame = false;
              return arraysAreSame;
            }
            else {
              return(false);
            }
          };
          return arraysAreSame(this.actual, array);
        },
        toEqualProductionRule: function(rule) {
          this.message = function() {
            return "Expected " + JSON.stringify(this.actual) + " to be production rule " + JSON.stringify(rule) + ".";
          };
          return (this.actual.isEqualTo(rule));
        }
      });
    });
    
//S -> (empty)
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
    grammar.computeLCRelation();
    var expected_lc = {'S': {'S': true}};
    expect(grammar.lc).toEqual(expected_lc);
  });
  
  it('should recognise nonterminals', function () {
    expect(grammar.isNonterminal('S')).toEqual(true);
  });

  it('should recognise terminals', function () {
    expect(grammar.isTerminal('S')).toEqual(false);
  });
  
  it('should look up rules with left-hand-side S', function () {
    expect(grammar.rulesWithLHS('S')).toEqualProductionRules([ { lhs : 'S', rhs : [  ], head : 0, fs : null } ]);
  });
  
  it('should look up the start rule', function () {
    expect(grammar.startRule()).toEqualProductionRule({ lhs : 'S', rhs : [  ], head : 0, fs : null });
  });

  it('should look up the start symbol', function () {
    expect(grammar.getStartSymbol()).toEqual('S');
  });
  
  it('should test left-corner relations', function () {
    expect(grammar.isLeftcornerOf('S', 'S')).toEqual(true);
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
    expected.production_rules = [ { lhs : 'S', rhs : [ 'NP', 'VP' ], head : 0, fs : null }, 
                                  { lhs : 'NP', rhs : [ 'DT', 'NN' ], head : 0, fs : null }, 
                                  { lhs : 'PP', rhs : [ 'IN', 'NP' ], head : 0, fs : null }, 
                                  { lhs : 'VP', rhs : [ 'VBP', 'NP' ], head : 0, fs : null }, 
                                  { lhs : 'VP', rhs : [ 'work' ], head : 0, fs : null } ];
    expected.nonterminals = {'S': true, 'NP': true, 'PP': true, 'VP': true};
    expected.start_symbol = 'S';
    expected.is_CNF = true;
    grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqualProductionRules(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);
  });

  it('should correctly compute the left-corner relation', function () {
    grammar.computeLCRelation();
    var expected_lc = {'S': {'S': true, 'NP': true},
                       'NP': {'NP': true},
                       'PP': {'PP': true},
                       'VP': {'VP': true}
                      };
    expect(grammar.lc).toEqual(expected_lc);
  });
  
  it('should recognise nonterminals', function () {
    expect(grammar.isNonterminal('S')).toEqual(true);
    expect(grammar.isNonterminal('NP')).toEqual(true);
    expect(grammar.isNonterminal('VP')).toEqual(true);
    expect(grammar.isNonterminal('PP')).toEqual(true);
    expect(grammar.isNonterminal('DT')).toBeFalsy();
    expect(grammar.isNonterminal('IN')).toBeFalsy();
    expect(grammar.isNonterminal('VBP')).toBeFalsy();
    expect(grammar.isNonterminal('work')).toBeFalsy();
  });

  it('should recognise terminals', function () {
    expect(grammar.isTerminal('S')).toEqual(false);
    expect(grammar.isTerminal('NP')).toEqual(false);
    expect(grammar.isTerminal('VP')).toEqual(false);
    expect(grammar.isTerminal('PP')).toEqual(false);
    expect(grammar.isTerminal('DT')).toEqual(true);
    expect(grammar.isTerminal('IN')).toEqual(true);
    expect(grammar.isTerminal('VBP')).toEqual(true);
    expect(grammar.isTerminal('work')).toEqual(true);
  });
  
  it('should look up rules with left-hand-side S', function () {
    expect(grammar.rulesWithLHS('S')).toEqualProductionRules([ { lhs : 'S', rhs : [ 'NP', 'VP' ], head : 0, fs : null } ]);
  });

  it('should look up rules with left-hand-side NP', function () {
    expect(grammar.rulesWithLHS('NP')).toEqualProductionRules([ { lhs : 'NP', rhs : [ 'DT', 'NN' ], head : 0, fs : null } ]);
  });
  
  it('should look up rules with left-hand-side PP', function () {
    expect(grammar.rulesWithLHS('PP')).toEqualProductionRules([{'lhs': 'PP', 'rhs': ['IN', 'NP'], 'head': 0, 'fs': null}]);
  });
  
  it('should look up rules with left-hand-side VP', function () {
    expect(grammar.rulesWithLHS('VP')).toEqualProductionRules([{'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'head': 0, 'fs': null},
                                                  {'lhs': 'VP', 'rhs': ['work'], 'head': 0, 'fs': null}]);
  });

  it('should look up the start rule', function () {
    expect(grammar.startRule()).toEqualProductionRules({'lhs': 'S', 'rhs': ['NP', 'VP'], 'head': 0, 'fs': null});
  });
  
  it('should look up the start symbol', function () {
    expect(grammar.getStartSymbol()).toEqual('S');
  });

  it('should look up production rules based on right hand side symbols (for CYK)', function () {
    expect(grammar.getRulesWithRHS('NP', 'VP')).toEqualProductionRules([{'lhs': 'S', 'rhs': ['NP', 'VP'], 'head': 0, fs: null}]);
    expect(grammar.getRulesWithRHS('DT', 'NN')).toEqualProductionRules([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'head': 0, fs: null}]);
    expect(grammar.getRulesWithRHS('IN', 'NP')).toEqualProductionRules([{'lhs': 'PP', 'rhs': ['IN', 'NP'], 'head': 0, fs: null}]);
    expect(grammar.getRulesWithRHS('VBP', 'NP')).toEqualProductionRules([{'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'head': 0, fs: null}]);
    expect(grammar.getRulesWithRHS('DT', 'NN')).toEqualProductionRules([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'head': 0, fs: null}]);
  });

  it('should look up production rules with a given left-most daughter', function () {
    expect(grammar.rulesWithLeftmostDaughter('NP')).toEqualProductionRules([{'lhs': 'S', 'rhs': ['NP', 'VP'], 'head': 0, fs: null}]);
    expect(grammar.rulesWithLeftmostDaughter('DT')).toEqualProductionRules([{'lhs': 'NP', 'rhs': ['DT', 'NN'], 'head': 0, fs: null}]);
    expect(grammar.rulesWithLeftmostDaughter('IN')).toEqualProductionRules([{'lhs': 'PP', 'rhs': ['IN', 'NP'], 'head': 0, fs: null}]);
    expect(grammar.rulesWithLeftmostDaughter('VBP')).toEqualProductionRules([{'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'head': 0, fs: null}]);
    expect(grammar.rulesWithLeftmostDaughter('work')).toEqualProductionRules([{'lhs': 'VP', 'rhs': ['work'], 'head': 0, fs: null}]);
  });

  it('should test left-corner relations', function () {
    expect(grammar.isLeftcornerOf('S', 'S')).toEqual(true);
    expect(grammar.isLeftcornerOf('NP', 'NP')).toEqual(true);
    expect(grammar.isLeftcornerOf('VP', 'VP')).toEqual(true);
    expect(grammar.isLeftcornerOf('PP', 'PP')).toEqual(true);
    expect(grammar.isLeftcornerOf('DT', 'DT')).toEqual(false);
    expect(grammar.isLeftcornerOf('VBP', 'VBP')).toEqual(false);
    expect(grammar.isLeftcornerOf('IN', 'IN')).toEqual(false);
    expect(grammar.isLeftcornerOf('NP', 'S')).toEqual(true);
    expect(grammar.isLeftcornerOf('NP', 'PP')).toBeFalsy();
    expect(grammar.isLeftcornerOf('PP', 'NP')).toBeFalsy();
    expect(grammar.isLeftcornerOf('VP', 'NP')).toBeFalsy();
    expect(grammar.isLeftcornerOf('NP', 'VP')).toBeFalsy();
    expect(grammar.isLeftcornerOf('PP', 'VP')).toBeFalsy();
    expect(grammar.isLeftcornerOf('VP', 'PP')).toBeFalsy();
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
    expected.production_rules = [{'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'head': 1, 'fs': null}, 
                                 {'lhs': 'E', 'rhs': ['E', 'minus', 'E'], 'head': 1, 'fs': null}, 
                                 {'lhs': 'E', 'rhs': ['E', 'divide', 'E'], 'head': 1, 'fs': null}, 
                                 {'lhs': 'E', 'rhs': ['E', 'multiply', 'E'], 'head': 1, 'fs': null}, 
                                 {'lhs': 'E', 'rhs': ['number'], 'head': 1, 'fs': null}];
    expected.nonterminals = {'E': true};
    expected.start_symbol = 'E';
    expected.is_CNF = false;
    grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqualProductionRules(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);
   });

  it('should correctly compute the left-corner relation', function () {
    grammar.computeLCRelation();
    // left corner of E is E
    expect(grammar.lc).toEqual({'E': {'E': true}});
  });
  
  it('should recognise nonterminals', function () {
    expect(grammar.isNonterminal('E')).toEqual(true);
  });

  it('should recognise terminals', function () {
    expect(grammar.isTerminal('E')).toEqual(false);
  });
  
  it('should look up the start rule', function () {
    expect(grammar.startRule()).toEqualProductionRule({'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'head': 1, 'fs': null});
  });
  
  it('should look up the start symbol', function () {
    expect(grammar.getStartSymbol()).toEqual('E');
  });
  
  it('should look up production rules with a given left-most daughter', function () {
    expect(grammar.rulesWithLeftmostDaughter('E')).toEqualProductionRules([{'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'head': 1, 'fs': null},
                                                               {'lhs': 'E', 'rhs': ['E', 'minus', 'E'], 'head': 1, 'fs': null},
                                                               {'lhs': 'E', 'rhs': ['E', 'divide', 'E'], 'head': 1, 'fs': null},
                                                               {'lhs': 'E', 'rhs': ['E', 'multiply', 'E'], 'head': 1, 'fs': null}]);
    expect(grammar.rulesWithLeftmostDaughter('number')).toEqualProductionRules([{'lhs': 'E', 'rhs': ['number'], 'head': 0, 'fs': null}]);
  });
  
  it('should test left-corner relations', function () {
    expect(grammar.isLeftcornerOf('E', 'E')).toEqual(true);
    expect(grammar.isLeftcornerOf('number', 'E')).toBeFalsy();
  });

  it('should read a unification grammar with list constraints', function () {
    var signature_text = fs.readFileSync(UG_SignatureFile, 'utf8');
    var signature = SignatureParser.parse(signature_text, {
      implicitTypes: false
    });
    grammar_text = fs.readFileSync(UG_GrammarFile, 'utf8');
    grammar = GrammarParser.parse(grammar_text, {signature: signature});
    logger.debug(grammar.prettyPrint());
  });

});