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


describe('GrammarParser', function() {
  var grammar_text;
  
//S ->
  it('should read a text file', function(done) {
    fs.readFile('data/minimal_grammar.txt', 'utf8', function (error, text) {
      expect(text).toBeDefined();
      grammar_text = text;
      done();
    });
  });
  it('should correctly parse a minial grammar consisting of the rule S -> (empty)', function () {
    var expected = {};
    expected.production_rules = [{'lhs': 'S', 'rhs': [], 'constraints': []}];
    expected.nonterminals = {'S': true};
    expected.start_symbol = 'S';
    expected.is_CNF = false;
    var grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqual(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);
  });  

//S -> NP VP
//NP -> DT NN
//PP -> IN NP
//VP -> VBP NP
//VP -> work
  it('should read another text file', function(done) {
    fs.readFile('data/test_grammar_for_CFG.txt', 'utf8', function (error, text) {
      expect(text).toBeDefined();
      grammar_text = text;
      done();
    });
  });
  it('should correctly parse a grammar in CNF', function () {
    var expected = {};
    expected.production_rules = [{'lhs': 'S', 'rhs': ['NP', 'VP'], 'constraints': []}, 
                                 {'lhs': 'NP', 'rhs': ['DT', 'NN'], 'constraints': []}, 
                                 {'lhs': 'PP', 'rhs': ['IN', 'NP'], 'constraints': []}, 
                                 {'lhs': 'VP', 'rhs': ['VBP', 'NP'], 'constraints': []}, 
                                 {'lhs': 'VP', 'rhs': ['work'], 'constraints': []}];
    expected.nonterminals = {'S': true, 'NP': true, 'PP': true, 'VP': true};
    expected.start_symbol = 'S';
    expected.is_CNF = true;
    var grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqual(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);

    grammar.compute_lc_relation();
    var expected_lc = {'S': {'S': true, 'NP': true},
                       'NP': {'NP': true},
                       'PP': {'PP': true},
                       'VP': {'VP': true}
                      };
    expect(grammar.lc).toEqual(expected_lc);
  });

//E -> E plus E
//E -> E minus E
//E -> E divide E
//E -> E multiply E
//E -> number
  it('should read another text file', function(done) {
    fs.readFile('data/math_expressions.txt', 'utf8', function (error, text) {
              console.log("right before");
      expect(text).toBeDefined();
      grammar_text = text;
      done();
    });
  });
  
  it('should correctly parse a context-free grammar (that is not in CNF)', function () {
    var expected = {};
    expected.production_rules = [{'lhs': 'E', 'rhs': ['E', 'plus', 'E'], 'constraints': []}, 
                                 {'lhs': 'E', 'rhs': ['E', 'minus', 'E'], 'constraints': []}, 
                                 {'lhs': 'E', 'rhs': ['E', 'divide', 'E'], 'constraints': []}, 
                                 {'lhs': 'E', 'rhs': ['E', 'multiply', 'E'], 'constraints': []}, 
                                 {'lhs': 'E', 'rhs': ['number'], 'constraints': []}];
    expected.nonterminals = {'E': true};
    expected.start_symbol = 'E';
    expected.is_CNF = false;
    var grammar = GrammarParser.parse(grammar_text);
    expect(grammar.production_rules).toEqual(expected.production_rules);
    expect(grammar.nonterminals).toEqual(expected.nonterminals);
    expect(grammar.is_CNF).toEqual(expected.is_CNF);
    expect(grammar.start_symbol).toEqual(expected.start_symbol);

    grammar.compute_lc_relation();
    // left corner of E is E
    expect(grammar.lc).toEqual({'E': {'E': true}});
  });
});
