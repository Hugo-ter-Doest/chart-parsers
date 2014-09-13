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
  var nr_items_added = 0;
  
  console.log('Initialise chart');
  // Initialise chart
  this.chart = new Chart(N);
  // Add items for rules that have the start symbol as left-hand-side
  var rules = this.grammar.rules_with_lhs(this.grammar.get_start_symbol());
  rules.forEach(function(rule) {
    new_item = new Item(rule, 0, 0, 0);
    nr_items_added += that.chart.add_item(new_item);
  });
  console.log('Initialise chart added ' + nr_items_added + ' items');
  return(nr_items_added);
};

LeftCornerChartParser.prototype.completer = function(item) {
  var that = this;
  var nr_items_added = 0;

  console.log('Completer: ' + item.id)
  if (item.is_complete()) {
    var items = this.chart.get_items_to(item.data.from);
    items.forEach(function(item2) {
      if (item2.is_incomplete() && (item.data.rule.lhs === item2.data.rule.rhs[item2.data.dot])) {
        var new_item = new Item(item2.data.rule, item2.data.dot + 1, item2.data.from, item.data.to);
        nr_items_added += that.chart.add_item(new_item);
        console.log('Completer: added item' + new_item.id);
      }
    });
  }
  console.log('Completer: added ' + nr_items_added + ' items');
  return(nr_items_added);
};

LeftCornerChartParser.prototype.scanner = function(item) {
  var nr_items_added = 0;

  console.log('Scanner at position ' + item.data.to + ": " + item.id);
  if (item.data.to < this.tagged_sentence.length) {
    if (item.is_incomplete() && (this.grammar.is_terminal(item.data.rule.rhs[item.data.dot]))) {
      console.log('Scanner: compare lexical category: ' + this.tagged_sentence[item.data.to][1] + '===' + item.data.rule.rhs[item.data.dot]);
      if (this.tagged_sentence[item.data.to][1] === item.data.rule.rhs[item.data.dot]) {
        // Add lexical item
        var tag_item = new Item({'lhs': this.tagged_sentence[item.data.to][1], 'rhs': [this.tagged_sentence[item.data.to][0]]}, 1, item.data.to, item.data.to+1);
        nr_items_added += this.chart.add_item(tag_item);
        // Create new item from input item with dot one to the right
        var newitem = new Item(item.data.rule, item.data.dot+1, item.data.from, item.data.to+1);
        newitem.children.push(tag_item);
        nr_items_added += this.chart.add_item(newitem);
      }
    }
  }
  console.log('Scanner: added ' + nr_items_added + ' items');
  return(nr_items_added);
};

// Predictor based on rule 4a on page 5
LeftCornerChartParser.prototype.lc_predictor = function(item) {
  that = this;
  var nr_items_added = 0;

  console.log('Predictor: ' + item.id)
  if (item.is_complete()) {
    // Get the productions rules that have the LHS of item as left-most daughter
    this.grammar.rules_with_leftmost_daughter(item.data.rule.lhs).forEach(function(rule) {
      // Get the items that end at the given item
      that.chart.get_items_to(item.data.from).forEach(function(item2) {
        if (item2.is_incomplete() && that.grammar.is_leftcorner_of(rule.lhs, item2.data.rule.rhs[item2.data.dot])) {
          var newitem = new Item(rule, 1, item.data.from, item.data.to);
          console.log('Predictor: added item ' + newitem.id);
          nr_items_added += that.chart.add_item(newitem);
        }
      });
    });
  }
  console.log('Predictor: added ' + nr_items_added + ' items');
  return(nr_items_added);
};

// Predictor based on rule 5a on page 5
LeftCornerChartParser.prototype.lc_predictor_scanner = function(j) {
  var that = this;
  var nr_items_added = 0;
  
  console.log('Predictor/scanner: ' + j);
  if (j < this.tagged_sentence.length) {
    this.grammar.rules_with_leftmost_daughter(this.tagged_sentence[j][1]).forEach(function(rule) {
      var items = that.chart.get_items_to(j);
      items.forEach(function(item) {
        if (item.is_incomplete() && that.grammar.is_leftcorner_of(rule.lhs, item.data.rule.rhs[item.data.dot])) {
          var new_item = new Item(rule, 1, j, j+1);
          nr_items_added += that.chart.add_item(new_item);
        }
      });
    });
  }
  console.log('Predictor/scanner: added ' + nr_items_added + ' items');
  return(nr_items_added);
};

LeftCornerChartParser.prototype.parse = function(tagged_sentence) {
  this.tagged_sentence = tagged_sentence;
  N = tagged_sentence.length;
  that = this;

  this.initialise(N);
  var i;
  for (i = 0; i <= N; i++) {
    var items_added;
    do {
      items_added = 0;
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