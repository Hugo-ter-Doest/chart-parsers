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

function initialise_chart(N) {
  var chart = new Array(N+1);
  var i;
  
  for (i = 0; i <= N+1; i++) {
    chart[i] = {};
  }
  
  return chart;
}

// Creates an item; dot is an index in the RHS of the rule, 
// from is the starting point in the sentence
function new_item(rule, dot, from) {
  var item = {};
  
  item.rule = rule;
  item.dot = dot;
  item.from = from;
  item.children = [];
  return item;
}

// Checks if an item is recognised
function is_incomplete(item) {
  console.log("Item is incomplete?: " + JSON.stringify(item) + (item.dot < item.rule.rhs.length));
  return(item.dot < item.rule.rhs.length);
}

// The earley parser. Sentence is an array of words
exports.earley_parse = function(tagged_sentence, grammar) {
  var N = tagged_sentence.length;
  var chart = initialise_chart(N);
  var start_item;
  var i;
  var items_were_added = false;

  // Introduces new items for the next nonterminal to be recognised
  function predictor(item, j) {
    console.log("Predictor: " + JSON.stringify(item) + j);
    // remember the size of the set at position j 
    var nr_items = Object.keys(chart[j]).length;
    console.log("Nummber of items before: " + nr_items);
    // B is the nonterminal that should be predicted
    var B = item.rule.rhs[item.dot];
    // Get all rules with lhs B
    var rules_with_lhs_B = grammar.rules_with_lhs(B);
    // for each rule with LHS B create an item
    rules_with_lhs_B.forEach(function(rule) {
        var newitem = new_item(rule, 0, j);
        chart[j][JSON.stringify(newitem)] = newitem;
        console.log("Predictor: added item " + JSON.stringify(newitem)  + " to state " + j);
    });
    console.log("Nummber of items after: " + Object.keys(chart[j]).length);
    // Return number of items added
    return(Object.keys(chart[j]).length - nr_items);
  }

  // The next category to be recognised is a terminal
  function scanner(item, j) {
    console.log("Scanner: " + JSON.stringify(item) + j);
    // remember the size of the set at position j + 1 
    var nr_items = Object.keys(chart[j+1]).length;
    // Place the dot one to the right if the word matches
    if (tagged_sentence[j][1] === item.rule.rhs[item.dot]) {
      console.log("Scanning word: (" + tagged_sentence[j][0] + ", " + tagged_sentence[j][1] + ")");
      var newitem = new_item(item.rule, item.dot+1, item.from);
      newitem.children.push(tagged_sentence[j]);
      chart[j+1][JSON.stringify(newitem)] = newitem;
      console.log("Scanner: added item " + JSON.stringify(newitem) + " to state " + j+1);
    }
    // Return number of items added
    return(Object.keys(chart[j+1]).length - nr_items);
  }

  // Shifts the dot to the right for items in chart[k]
  function completer(item, k) {
    console.log("Completer: " + JSON.stringify(item) + k);
    // remember the size of the set at position k 
    var nr_items = Object.keys(chart[k]).length;
    var B = item.rule.lhs;
    var keys = Object.keys(chart[item.from]);
    keys.forEach(function(key) {
      var item_for_comp = chart[item.from][key];
      if (item_for_comp.rule.rhs[item_for_comp.dot] === B) {
        var newitem = new_item(item_for_comp.rule, item_for_comp.dot+1, item_for_comp.from);
        newitem.children = item_for_comp.children.slice();
        newitem.children.push(item);
        chart[k][JSON.stringify(newitem)] = newitem;
        console.log("Completer: added item " + JSON.stringify(newitem) + " to state " + k);
      }
    });
    // Return number of items added
    return(Object.keys(chart[k]).length - nr_items);
  }

  // Seed the parser with the start rule;
  start_item = new_item(grammar.start_rule(), 0, 0, []);
  chart[0][JSON.stringify(start_item)] = start_item;
  console.log("Added start production to the start: " + JSON.stringify(start_item));
  // Start parsing
  for (i = 0; i <= N; i++) {
      console.log("Parse iteration: " + i);
      do {
        items_were_added = false;
        var keys = Object.keys(chart[i]);
        keys.forEach(function(key) {
          var item = chart[i][key];
          console.log("Parser: checking item " + JSON.stringify(item));
          // apply predictor, scanner and completer until no more items can be added
          if (is_incomplete(item)) {
            if (grammar.is_nonterminal(item.rule.rhs[item.dot])) {
              console.log("Next symbol is a nonterminal: " + item.rule.rhs[item.dot]);
              if (predictor(item, i) > 0) {
                items_were_added = true;
              }
            }
            else {
              console.log("Next symbol is a terminal: " + item.rule.rhs[item.dot]);
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