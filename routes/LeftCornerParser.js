/*
    Left Corner Chart Parser
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

var Chart = require('./Chart');
var Item = require('Item');

// Constructur for the left-corner parser
function LeftCornerChartParser(grammar) {
  this.grammar = grammar;
}

LeftCornerChartParser.prototype.initialise = function(N) {
  var that = this;
  var new_item;
  
  // Initialise chart
  this.chart = new Chart(N);
  // Add items for rules that have the start symbol as left-hand-side
  var rules = this.grammar.rules_with_lhs(this.grammar.start_symbol());
  rules.forEach(function(rule) {
    new_item = new Item(rule, 0, 0);
    that.chart.add_item(new_item, 0, 0);
  });
};

LeftCornerChartParser.prototype.completer = function(item) {
  var that = this;

  if (item.is_incomplete() && (this.grammar.is_nonterminal(item.data.rule.rhs[item.data.dot]))) {
    var items = this.chart.get_items_from(item.data.to);
    items.forEach(function(item2) {
      if (item2.is_complete() && (item2.data.rule.lhs === item[data.rule.rhs[item.data.dot]])) {
        var new_item = new Item(item1.data.rule, item1.data.dot + 1, item1.data.from);
        that.chart.add_item(new_item, item1.data.from, item1.data.to);
      }
    });
  }
};

LeftCornerChartParser.prototype.scanner = function(item) {
  var that = this;

  if (item.is_incomplete() && (this.grammar.is_terminal(item.data.rule.rhs[item.data.dot]))) {
    if (this.tagged_sentence[item.data.to][1] === item.data.rule.rhs[item.data.dot]) {
      // Add lexical item
      
      // Create new item from input item with dot one to the right
    }
  }
};

LeftCornerChartParser.prototype.lc_predictor = function(item) {
  
};

LeftCornerChartParser.prototype.lc_predictor_scanner = function(item) {
  
};

LeftCornerChartParser.prototype.parse = function(tagged_sentence) {
  this.tagged_sentence = tagged_sentence;
  N = tagged_sentence.length;
  this.initialise(n);
  
  var i;
  for (i = 0; i <= N; i++) {
    var items_added = 0;
    do {
      var items = this.chart.get_items_to(i);
      items.forEach(function(item) {
        items_added += scanner(item);
        items_added += completer(item);
        items_added += lc_predictor(item);
        items_added += lc_predictor_scanner(item);
      });
    } while (items_added);
  }
  return this.chart;
};

module.exports = LeftCornerChartParser;