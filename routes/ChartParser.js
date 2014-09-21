/*
    Generic chart parser that can be used to create different types of chart parsers
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

ChartParser.prototype.initialise = function(N) {
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

// The next category to be recognised is a terminal
ChartParser.prototype.scanner = function(item) {
  var nr_items_added = 0;

  console.log('Scanner at position ' + item.data.to + ": " + item.id);
  if (item.data.to < this.tagged_sentence.length) {
    if (item.is_incomplete() && (this.grammar.is_terminal(item.data.rule.rhs[item.data.dot]))) {
      console.log('Scanner: compare lexical category: ' + this.tagged_sentence[item.data.to][1] + '===' + item.data.rule.rhs[item.data.dot]);
      if (this.tagged_sentence[item.data.to][1] === item.data.rule.rhs[item.data.dot]) {
        // Add terminal item
        var term_item = new Item({'lhs': this.tagged_sentence[item.data.to][0], 'rhs': ''}, 1, item.data.to, item.data.to+1);
        // Add lexical item
        var tag_item = new Item({'lhs': this.tagged_sentence[item.data.to][1], 'rhs': [this.tagged_sentence[item.data.to][0]]}, 1, item.data.to, item.data.to+1);
        tag_item.add_child(term_item);
        nr_items_added += this.chart.add_item(tag_item);
        // Create new item from input item with dot one to the right
        var newitem = new Item(item.data.rule, item.data.dot+1, item.data.from, item.data.to+1);
        // copy this children of item
        newitem.set_children(item.children.slice());
        newitem.add_child(tag_item);
        nr_items_added += this.chart.add_item(newitem);
      }
    }
  }
  console.log('Scanner: added ' + nr_items_added + ' items');
  return(nr_items_added);
};

// item is complete
// Shifts the dot to the right for items in chart[k]
ChartParser.prototype.completer = function(item) {
  var that = this;
  var nr_items_added = 0;

  console.log('Completer: ' + item.id)
  if (item.is_complete()) {
    var items = this.chart.get_items_to(item.data.from);
    items.forEach(function(item2) {
      if (item2.is_incomplete() && (item.data.rule.lhs === item2.data.rule.rhs[item2.data.dot])) {
        var new_item = new Item(item2.data.rule, item2.data.dot + 1, item2.data.from, item.data.to);
        // Make a copy of the children of item2, otherwise two items refer to the same set of children
        new_item.set_children(item2.children.slice());
        new_item.add_child(item);
        nr_items_added += that.chart.add_item(new_item);
        console.log('Completer: added item' + new_item.id);
      }
    });
  }
  console.log('Completer: added ' + nr_items_added + ' items');
  return(nr_items_added);
};

// The main algorithm of the chart parser. Sentence is an array of words
// Analyses the sentence from left to right
// If you need more methods to be called then override this method
ChartParser.prototype.parse = function(tagged_sentence) {
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
        items_added += that.predictor(item);
      });
    } while (items_added);
  }
  return this.chart;
};

function ChartParser() {}

module.exports = ChartParser;