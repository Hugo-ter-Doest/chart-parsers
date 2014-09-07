/*
    Earley chart parser 
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

// Constructor for the chart
function Chart(N) {
  var i;
  
  this.state_sets = new Array(N+1);
  for (i = 0; i <= N+1; i++) {
    this.state_sets[i] = {};
  }
}

// Method for adding an item to state i
Chart.prototype.add_item = function (i, item) {
  
  // Construct an identifier that is unique for if the combination of the current item plus the children items is unique
  var id = item.id + '(';
  item.children.forEach(function(child_item) {
    id += child_item.id;
  });
  id += ')';
  item.id = id;
  this.state_sets[i][id] = item;
};

// Method that returns the number of items in state i
Chart.prototype.nr_of_items_in_state_set = function(i) {
  return(Object.keys(this.state_sets[i]).length);
};

// Method that returns the keys of the item in a state
Chart.prototype.get_keys_of_state_set = function (pos) {
  return(Object.keys(this.state_sets[pos]));
};

// Method for retrieving a specific item by its key
Chart.prototype.get_item = function (pos, key) {
  return(this.state_sets[pos][key]);
};

// The next category to be recognised is a terminal
EarleyChartParser.prototype.scanner = function(item, j) {
  console.log("Scanner: " + item.id + j);
  // remember the size of the set at position j + 1 
  var nr_items = this.chart.nr_of_items_in_state_set(j+1);
  // Place the dot one to the right if the word matches
  if (this.tagged_sentence[j][1] === item.data.rule.rhs[item.data.dot]) {
    console.log("Scanning word: (" + this.tagged_sentence[j][0] + ", " + this.tagged_sentence[j][1] + ")");
    var newitem = new Item(item.data.rule, item.data.dot+1, item.data.from);
    // create an item from tagged word
    var tag_item = new Item({'lhs': this.tagged_sentence[j][1], 'rhs': [this.tagged_sentence[j][0]]}, 1, j);
    this.chart.add_item(j+1, tag_item);
    newitem.children.push(tag_item);
    this.chart.add_item(j+1, newitem);
    console.log("Scanner: added item " + newitem.id + " to state " + j+1);
  }
  // Return number of items added
  return(this.chart.nr_of_items_in_state_set(j+1) - nr_items);
};

// Introduces new items for the next nonterminal to be recognised
EarleyChartParser.prototype.predictor = function(item, j) {
  console.log("Predictor: " + item.id + j);
  // remember the size of the set at position j 
  var nr_items = this.chart.nr_of_items_in_state_set(j);
  console.log("Nummber of items before: " + nr_items);
  // B is the nonterminal that should be predicted
  var B = item.data.rule.rhs[item.data.dot];
  // Get all rules with lhs B
  var rules_with_lhs_B = this.grammar.rules_with_lhs(B);
  // for each rule with LHS B create an item
  var that = this;
  rules_with_lhs_B.forEach(function(rule) {
      var newitem = new Item(rule, 0, j);
      that.chart.add_item(j, newitem);
      console.log("Predictor: added item " + newitem.id  + " to state " + j);
  });
  console.log("Nummber of items after: " + this.chart.nr_of_items_in_state_set(j));
  // Return number of items added
  return(this.chart.nr_of_items_in_state_set(j) - nr_items);
};

// Shifts the dot to the right for items in chart[k]
EarleyChartParser.prototype.completer = function(item, k) {
  console.log("Completer: " + item.id + k);
  // remember the size of the set at position k 
  var nr_items = this.chart.nr_of_items_in_state_set(k);
  var B = item.data.rule.lhs;
  var keys = this.chart.get_keys_of_state_set(item.data.from);
  var that = this;
  keys.forEach(function(key) {
    var item_for_comp = that.chart.get_item(item.data.from, key);
    if (item_for_comp.data.rule.rhs[item_for_comp.data.dot] === B) {
      var newitem = item_for_comp.copy();
      newitem.data.dot++;
      newitem.children.push(item);
      that.chart.add_item(k, newitem);
      console.log("Completer: added item " + newitem.id + " to state " + k);
    }
  });
  // Return number of items added
  return(this.chart.nr_of_items_in_state_set(k) - nr_items);
};
  
// The earley parser. Sentence is an array of words
EarleyChartParser.prototype.parse = function(tagged_sentence) {
  var N = tagged_sentence.length;
  this.chart = new Chart(N);
  this.tagged_sentence = tagged_sentence;
  var start_item;
  var i;
  var items_were_added = false;
  var grammar = this.grammar;

  // Seed the parser with the start rule;
  start_item = new Item(grammar.start_rule(), 0, 0, []);
  this.chart.add_item(0, start_item);
  console.log("Added start production to the start: " + start_item.id);
  // Start parsing
  for (i = 0; i <= N; i++) {
      console.log("Parse iteration: " + i);
      do {
        items_were_added = false;
        var keys = this.chart.get_keys_of_state_set(i);
        var that=this;
        keys.forEach(function(key) {
          var item = that.chart.get_item(i,key);
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

function EarleyChartParser(grammar) {
  this.grammar = grammar; 
}

module.exports = EarleyChartParser;