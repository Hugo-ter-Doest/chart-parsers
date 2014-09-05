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
  
  this.states = new Array(N+1);
  for (i = 0; i <= N+1; i++) {
    this.states[i] = {};
  }
}

// Method for adding an item to state i
Chart.prototype.add_item = function (i, item) {
  this.states[i][item.id] = item; 
};

// Method that returns the number of items in state i
Chart.prototype.nr_of_items_in_state = function(i) {
  return(Object.keys(this.states[i]).length);
};

// Method returns the i-th state of the chart
Chart.prototype.get_state = function(i) {
  return(this.states[i]);
};

// Method that returns the keys of the item in a state
Chart.prototype.get_keys_of_state = function (state) {
  return(Object.keys(this.states[state]));
};

// Method for retrieving a specific item by its key
Chart.prototype.get_item = function (state, key) {
  return(this.states[state][key]);
};

// The earley parser. Sentence is an array of words
exports.earley_parse = function(tagged_sentence, grammar) {
  var N = tagged_sentence.length;
  var chart = new Chart(N);
  var start_item;
  var i;
  var items_were_added = false;

  // Introduces new items for the next nonterminal to be recognised
  function predictor(item, j) {
    console.log("Predictor: " + item.id + j);
    // remember the size of the set at position j 
    var nr_items = chart.nr_of_items_in_state(j);
    console.log("Nummber of items before: " + nr_items);
    // B is the nonterminal that should be predicted
    var B = item.data.rule.rhs[item.data.dot];
    // Get all rules with lhs B
    var rules_with_lhs_B = grammar.rules_with_lhs(B);
    // for each rule with LHS B create an item
    rules_with_lhs_B.forEach(function(rule) {
        var newitem = new Item(rule, 0, j);
        chart.add_item(j, newitem);
        console.log("Predictor: added item " + newitem.id  + " to state " + j);
    });
    console.log("Nummber of items after: " + chart.nr_of_items_in_state(j));
    // Return number of items added
    return(chart.nr_of_items_in_state(j) - nr_items);
  }

  // The next category to be recognised is a terminal
  function scanner(item, j) {
    console.log("Scanner: " + item.id + j);
    // remember the size of the set at position j + 1 
    var nr_items = chart.nr_of_items_in_state(j+1);
    // Place the dot one to the right if the word matches
    if (tagged_sentence[j][1] === item.data.rule.rhs[item.data.dot]) {
      console.log("Scanning word: (" + tagged_sentence[j][0] + ", " + tagged_sentence[j][1] + ")");
      var newitem = new Item(item.data.rule, item.data.dot+1, item.data.from);
      newitem.children.push(tagged_sentence[j]);
      chart.add_item(j+1, newitem);
      console.log("Scanner: added item " + newitem.id + " to state " + j+1);
    }
    // Return number of items added
    return(chart.nr_of_items_in_state(j+1) - nr_items);
  }

  // Shifts the dot to the right for items in chart[k]
  function completer(item, k) {
    console.log("Completer: " + item.id + k);
    // remember the size of the set at position k 
    var nr_items = chart.nr_of_items_in_state(k);
    var B = item.data.rule.lhs;
    var keys = chart.get_keys_of_state(item.data.from);
    keys.forEach(function(key) {
      var item_for_comp = chart.get_item(item.data.from, key);
      if (item_for_comp.data.rule.rhs[item_for_comp.data.dot] === B) {
        var newitem = new Item(item_for_comp.data.rule, item_for_comp.data.dot+1, item_for_comp.data.from);
        newitem.children = item_for_comp.children.slice();
        newitem.children.push(item);
        chart.add_item(k, newitem);
        console.log("Completer: added item " + newitem.id + " to state " + k);
      }
    });
    // Return number of items added
    return(chart.nr_of_items_in_state(k) - nr_items);
  }

  // Seed the parser with the start rule;
  start_item = new Item(grammar.start_rule(), 0, 0, []);
  chart.add_item(0, start_item);
  console.log("Added start production to the start: " + start_item.id);
  // Start parsing
  for (i = 0; i <= N; i++) {
      console.log("Parse iteration: " + i);
      do {
        items_were_added = false;
        var keys = chart.get_keys_of_state(i);
        keys.forEach(function(key) {
          var item = chart.get_item(i,key);
          console.log("Parser: checking item " + item.id);
          // apply predictor, scanner and completer until no more items can be added
          if (item.is_incomplete()) {
            if (grammar.is_nonterminal(item.data.rule.rhs[item.data.dot])) {
              console.log("Next symbol is a nonterminal: " + item.data.rule.rhs[item.data.dot]);
              if (predictor(item, i) > 0) {
                items_were_added = true;
              }
            }
            else {
              console.log("Next symbol is a terminal: " + item.data.rule.rhs[item.data.dot]);
              if (i < N) {
                if (scanner(item, i) > 0) {
                  items_were_added = true;
                }
              }
            }
          }
          else {
            if (completer(item, i) > 0) {
              items_were_added = true;
            }
          }
          console.log("Items were added:" + items_were_added);
        });
     } while (items_were_added);
  }
  return chart;
};

exports.Chart;