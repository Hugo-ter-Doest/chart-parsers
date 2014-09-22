/*
    Unit test for LeftCornerParser.js
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

var Grammar = require('../routes/CFG');
var LeftCornerParser = require('../routes/LeftCornerParser');
var EarleyParser = require('../routes/EarleyParser');
var Item = require('../routes/Item');

// E -> E plus E
// E -> E minus E
// E -> E divide E
// E -> E multiply E
// E -> number
var dummy = new Grammar('../data/math_expressions.txt', function(grammar) {
  var parser = new LeftCornerParser(grammar);

  // 2 + 3
  var tagged_sentence = [['2', 'number'],
                         ['+', 'plus'],
                         ['3', 'number']];
  var chart = parser.parse(tagged_sentence);
  var parses = chart.full_parse_items(grammar.get_start_symbol());
  assert.equal(parses.length, 1, "Number of parses found should be one.");
  var expected_item = new Item({'lhs': 'E', 'rhs': ['E', 'plus', 'E']}, 3, 0, 3);
  assert.equal(parses[0].id, expected_item.id, "Full parse items does not match (E -> E + E, 3, 0, 3)");

  // 2 + 3 * 4
  tagged_sentence = [['2', 'number'],
                     ['+', 'plus'],
                     ['3', 'number'],
                     ['*', 'multiply'],
                     ['4', 'number']];
  chart = parser.parse(tagged_sentence);
  parses = chart.full_parse_items(grammar.get_start_symbol());
  assert.equal(parses.length, 2, "Number of parses found should be two.");
});

// Grammar (in ../data/test_grammar_for_CYK.txt)
//S  -> NP VP
//NP -> DET N
//NP -> NP PP
//PP -> P NP
//VP -> V NP
//VP -> VP PP

// Lexicon
//DET -> the
//NP -> I
//N -> man
//N -> telescope
//P -> with
//V -> saw
//N -> cat
//N -> dog
//N -> pig
//N -> hill
//N -> park
//N -> roof
//P -> from
//P -> on
//P -> in

var dummy = new Grammar('../data/test_grammar_for_CYK.txt', function(grammar) {
  var parser = new LeftCornerParser(grammar);

  var tagged_sentence = [['I', 'NP'],
                         ['saw', 'V'],
                         ['the', 'DET'],
                         ['man', 'N'],
                         ['with', 'P'],
                         ['the', 'DET'],
                         ['telescope', 'N']];
  var chart = parser.parse(tagged_sentence);
  var parses = chart.full_parse_items(grammar.get_start_symbol());
  
  assert.equal(parses.length, 2, "Number of parses found should be two.");
  var expected_item = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 0, 7);
  assert.equal(parses[0].id, expected_item.id, "Item should equal (S -> NP VP, 2, 0, 7)");
  assert.equal(parses[1].id, expected_item.id, "Item should equal (S -> NP VP, 2, 0, 7)");
});