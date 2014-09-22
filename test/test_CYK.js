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
var CYK_ChartParser = require('../routes/CYKParser');
var Item = require('../routes/Item');

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
  var tagged_sentence = [['I', 'NP'],
                         ['saw', 'V'],
                         ['the', 'DET'],
                         ['man', 'N'],
                         ['with', 'P'],
                         ['the', 'DET'],
                         ['telescope', 'N']];
  var N = tagged_sentence.length;
  var parser = new CYK_ChartParser(grammar);
  var chart = parser.parse(tagged_sentence);
  
  var parses = chart.full_parse_items(grammar.get_start_symbol());
  
  assert.equal(parses.length, 2, "Number of parses found should be two.");
  var expected_item = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 0, 7);
  assert.equal(parses[0].id, expected_item.id, "Item should equal (S -> NP VP, 2, 0, 7)");
  assert.equal(parses[1].id, expected_item.id, "Item should equal (S -> NP VP, 2, 0, 7)");
});