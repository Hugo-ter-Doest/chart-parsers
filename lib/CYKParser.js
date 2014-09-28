/*
    Cocke Younger Kasami (CYK) chart parser
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

var Item = require('./Item');
var Chart = require('./Chart');
var ChartParser = require('./ChartParser');

// Constructor for parser object
// grammar is an object as defined in CFG.js
function CYK_ChartParser(grammar) {
  this.grammar = grammar;
}

CYK_ChartParser.prototype = Object.create(ChartParser.prototype);

// This is the CYK chart parser
// sentence is a tagged sentence of the form [[word, category], [word, category], ...]
CYK_ChartParser.prototype.parse = function(tagged_sentence) {
  var N = tagged_sentence.length;
  var that = this;

  console.log('CYK_ChartParser.parse IN: ' + JSON.stringify(tagged_sentence, null, 2));
  this.tagged_sentence = tagged_sentence;
  this.chart = new Chart(N);
  var j;
  for (j = 0; j < N; ++j) {
    // Create a terminal item of the form Terminal -> *empty*
    var term_item = new Item({'lhs': tagged_sentence[j][0], 'rhs': []}, 1, j, j+1);
    // Create a tag item of the form Categorie -> Terminal
    var tag_item = new Item({'lhs': tagged_sentence[j][1], 'rhs': [tagged_sentence[j][0]]}, 1, j, j+1);
    tag_item.add_child(term_item);
    this.chart.add_item(tag_item);
  }
  
  var i, k;
  for (i = 2; i <= N; ++i) { // Length of span
    for (j = 0; j <= N - i; ++j) { // Start of span
      for (k = i - 1; k >= 0; --k) { // Partition of span
        var items1 = that.chart.get_items_from_to(j, j + k);
        var items2 = that.chart.get_items_from_to(j + k, j + i);
        items1.forEach(function(item1) {
          items2.forEach(function(item2) {
            var matching_rules = that.grammar.get_rules_with_rhs(item1.data.rule.lhs, item2.data.rule.lhs);
            matching_rules.forEach(function(rule) {
              var item = new Item(rule, 2, item1.data.from, item2.data.to);
              item.add_child(item1);
              item.add_child(item2);
              that.chart.add_item(item);
            });
          });
        });
      }
    }
  }
  console.log('CYK_ChartParser.parse OUT: ' + JSON.stringify(this.chart, null, 2));
  return this.chart;
};

module.exports = CYK_ChartParser;