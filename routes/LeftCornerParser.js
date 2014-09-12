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

// Algorithm based on the improved left-corner algorithm in 
// Improved Left-Corner Chart Parsing for Large Context-Free Grammars, Robert C. Moore
// IWPT2000

var Chart = require('./Chart');
var Item = require('./Item');

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
  var rules = this.grammar.rules_with_lhs(this.grammar.get_start_symbol());
  rules.forEach(function(rule) {
    new_item = new Item(rule, 0, 0);
    that.chart.add_item(0, 0, new_item);
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
      var tag_item = new Item({'lhs': this.tagged_sentence[j][1], 'rhs': [this.tagged_sentence[j][0]]}, 1, j);
      this.chart.add_item(item.data.to, item.data.to+1, tag_item);
      // Create new item from input item with dot one to the right
      var newitem = new Item(item.data.rule, item.data.dot+1, item.data.from);
      newitem.children.push(tag_item);
      this.chart.add_item(item.data.from, item.data.to+1, newitem);
    }
  }
};

// Predictor based on rule 4a on page 5
LeftCornerChartParser.prototype.lc_predictor = function(item) {
  that = this;
  
  if (item.is_complete()) {
    this.grammar.rules_with_lc(item.data.rule.lhs).forEach(function(rule) {
      that.chart.get_items_to(item.data.from).forEach(function(item2) {
        if (item2.is_incomplete() && that.grammar.is_leftcorner_of(rule.lhs, item2.data.rule.rhs[item2.data.dot])) {
          var newitem = new Item(rule, 1, item.to);
          that.chart.add_item(item.from, item.to, newitem);
        }
      });
    });
  }
};

// Predictor based on rule 5a on page 5
LeftCornerChartParser.prototype.lc_predictor_scanner = function(j) {
  var that = this;
  
  this.grammar.rules_with_lc(this.tagged_sentence[j][1]).forEach(function(rule) {
    var items = that.chart.get_items_to(j);
    items.forEach(function(item) {
      if (item.is_incomplete() && that.grammar.is_leftcorner_of(rule.lhs, item.data.rule.rhs[item.data.dot])) {
        var new_item = new Item(rule, 1, j);
        that.chart.add_item(j, j+1, new_item);
      }
    });
  });
};

LeftCornerChartParser.prototype.parse = function(tagged_sentence) {
  this.tagged_sentence = tagged_sentence;
  N = tagged_sentence.length;
  that = this;

  this.initialise(N);
  var i;
  for (i = 0; i <= N; i++) {
    var items_added = 0;
    do {
      var items = this.chart.get_items_to(i);
      items.forEach(function(item) {
        items_added += that.scanner(item);
        items_added += that.completer(item);
        items_added += that.lc_predictor(item);
        items_added += that.lc_predictor_scanner(i);
      });
    } while (items_added);
  }
  return this.chart;
};

module.exports = LeftCornerChartParser;