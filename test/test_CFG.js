/*
    Unit test for CFG.js
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

var assert = require('assert');

var Grammar = require('../lib/GrammarParser');

// Load a test grammar and compare to expected structure
//S -> NP VP
//NP -> DT NN
//PP -> IN NP
//VP -> VBP NP
//VP -> work
var dummy = new Grammar('../data/test_grammar_for_CFG.txt', function(actual) {
  var expected = {};
  expected.production_rules = [{'lhs': 'S', 'rhs': ['NP', 'VP']}, 
                               {'lhs': 'NP', 'rhs': ['DT', 'NN']}, 
                               {'lhs': 'PP', 'rhs': ['IN', 'NP']}, 
                               {'lhs': 'VP', 'rhs': ['VBP', 'NP']}, 
                               {'lhs': 'VP', 'rhs': ['work']}];
  expected.nonterminals = {'S': true, 'NP': true, 'PP': true, 'VP': true};
  expected.start_symbol = 'S';
  expected.is_CNF = true;
  assert.deepEqual(actual.is_CNF, expected.is_CNF, 'Grammar has unexpected structure: is_CNF');
  assert.deepEqual(actual.start_symbol, expected.start_symbol, 'Grammar has unexpected structure: start_symbol');
  assert.deepEqual(actual.nonterminals, expected.nonterminals, 'Grammar has unexpected structure: nonterminals');
  assert.deepEqual(actual.production_rules, expected.production_rules, 'Grammar has unexpected structure: production_rules');
  
  assert.deepEqual(actual, expected, 'Grammar has unexpected structure: production_rules');
  
  // Test a nonterminal
  assert.equal(actual.is_nonterminal(actual.get_start_symbol()), true, 'Start symbol is not considered a nonterminal');
  // Test a terminal
  assert.equal(actual.is_nonterminal('work'), undefined, 'Terminal "work" is not considered a nonterminal');
  // Get rules with LHS VP
  assert.deepEqual(actual.rules_with_lhs('VP'), [{'lhs': 'VP', 'rhs': ['VBP', 'NP']}, 
                                                 {'lhs': 'VP', 'rhs': ['work']}], 'Rules with LHS VP are not correctly returned');
  // Get the start rule of the grammar
  assert.deepEqual(actual.start_rule(), {'lhs': 'S', 'rhs': ['NP', 'VP']}, 'Start rule not correctly found');
  // Get left-hand side nonterminals of rules with one matching RHS
  assert.deepEqual(actual.left_hand_sides('work'), ['VP'], 'Left-hand side nonterminals of rules with RHS work not correctly found');
  // Get left-hand side nonterminals of rules with two matchine RHS nonterminals
  assert.deepEqual(actual.left_hand_sides2('DT', 'NN'), ['NP'], 'Left-hand side nonterminals of rules with RHS DT and NN not correctly found');
});
