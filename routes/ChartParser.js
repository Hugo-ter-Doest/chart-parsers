/*
    Chart parser that must be specialised with a predictor
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

// The next category to be recognised is a terminal
ChartParser.prototype.scanner = function(item, j) {
  console.log("Scanner: " + item.id + j);
  // remember the size of the set at position j + 1 
  var nr_items = this.chart.nr_items_to(j+1);
  // Place the dot one to the right if the word matches
  if (this.tagged_sentence[j][1] === item.data.rule.rhs[item.data.dot]) {
    console.log("Scanning word: (" + this.tagged_sentence[j][0] + ", " + this.tagged_sentence[j][1] + ")");
    var newitem = new Item(item.data.rule, item.data.dot+1, item.data.from);
    // create an item from tagged word
    var tag_item = new Item({'lhs': this.tagged_sentence[j][1], 'rhs': [this.tagged_sentence[j][0]]}, 1, j);
    this.chart.add_item(j, j+1, tag_item);
    newitem.children.push(tag_item);
    this.chart.add_item(item.data.from, j+1, newitem);
    console.log("Scanner: added item " + newitem.id + " to state " + j+1);
  }
  // Return number of items added
  return(this.chart.nr_items_to(j+1) - nr_items);
};

// item is complete
// Shifts the dot to the right for items in chart[k]
ChartParser.prototype.completer = function(item, k) {
  var that = this;
  console.log("Completer: " + item.id + k);
  // remember the size of the set at position k 
  var nr_items = this.chart.nr_items_to(k);
  var B = item.data.rule.lhs;
  var items = this.chart.get_items_to(item.data.from);
  items.forEach(function(item_for_comp) {
    if (item_for_comp.data.rule.rhs[item_for_comp.data.dot] === B) {
      var newitem = new Item(item_for_comp.data.rule, item_for_comp.data.dot+1, item_for_comp.data.from);
      newitem.children.push(item);
      that.chart.add_item(newitem.data.from, k, newitem);
      console.log("Completer: added item " + newitem.id + " to state " + k);
    }
  });
  // Return number of items added
  return(this.chart.nr_items_to(k) - nr_items);
};
  
// The Earley parser. Sentence is an array of words
ChartParser.prototype.parse = function(tagged_sentence) {
  var N = tagged_sentence.length;
  this.chart = new Chart(N);
  this.tagged_sentence = tagged_sentence;
  var start_item;
  var i;
  var items_were_added = false;
  var grammar = this.grammar;

  // Seed the parser with the start rule;
  start_item = new Item(grammar.start_rule(), 0, 0, []);
  this.chart.add_item(0, 0, start_item);
  console.log("Added start production to the start: " + start_item.id);
  // Start parsing
  for (i = 0; i <= N; i++) {
      console.log("Parse iteration: " + i);
      do {
        items_were_added = false;
        var items = this.chart.get_items_to(i);
        var that = this;
        items.forEach(function(item) {
          console.log("Parser: checking item " + item.id);
          // Apply predictor, scanner and completer until no more items can be added
          if (item.is_incomplete()) {
            if (grammar.is_nonterminal(item.data.rule.rhs[item.data.dot])) {
              console.log("Next symbol is a nonterminal: " + item.data.rule.rhs[item.data.dot]);
              if (that.predictor(item, i) > 0) {
                items_were_added = true;
              }
            }
            else {
              console.log("Next symbol is a terminal: " + item.data.rule.rhs[item.data.dot]);
              if (i < N) {
                if (that.scanner(item, i) > 0) {
                  items_were_added = true;
                }
              }
            }
          }
          else {
            if (that.completer(item, i) > 0) {
              items_were_added = true;
            }
          }
          console.log("Items were added:" + items_were_added);
        });
     } while (items_were_added);
  }
  return this.chart;
};

function ChartParser(grammar) {
  this.grammar = grammar;
}

module.exports = ChartParser;