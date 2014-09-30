/*
    Unit test for GrammarParser.js using Jasmin
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

// Load a test grammar and compare to expected structure
//S -> NP VP
//NP -> DT NN
//PP -> IN NP
//VP -> VBP NP
//VP -> work

describe('GrammarParser', function() {
  it('should read a text file', function() {
    fs.readFile('data/test_grammar_for_CFG.txt', 'utf8', function (error, grammar_text) {
      expect(grammar_text).toBeDefined();
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
        expect(GrammarParser.parse(grammar_text)).toEqual(expected);
      });
    });
  });
});