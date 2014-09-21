/*
    Unit test for CYK.js
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

//E -> E plus E
//E -> E minus E
//E -> E divide E
//E -> E multiply E
//E -> number
var dummy = new Grammar('../data/math_expressions.txt', function(grammar) {
  // 2 + 3 * 4
  var tagged_sentence = [['2', 'number'],
                         ['+', 'plus'],
                         ['3', 'number'],
                         ['*', 'multiply'],
                         ['4', 'number']];
  var N = tagged_sentence.length;
  var parser = new EarleyParser(grammar);
  var chart = parser.parse(tagged_sentence);

  var parses = chart.full_parse_items(grammar.get_start_symbol());
  console.log(parses.length);
  console.log(parses);
  console.log(chart.parse_trees(grammar.get_start_symbol()));
  
  // Top most cell should not be undefined
  //assert.notEqual(chart.cells[N - 1][0], undefined, 'chart[N - 1][0] is undefined');
  // Top most cell should contain an item for a rule with start symbol as LHS
  // Create the item we expect in chart[N - 1]
  //var expected_item = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 0);
  //assert.deepEqual(chart.cells[N - 1][0][expected_item.id], expected_item, 'chart[N - 1][0] does not contain full parse');
});