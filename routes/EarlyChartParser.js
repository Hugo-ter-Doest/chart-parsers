/**
 * File: EarleyChartParser.js
 * Last edit: 21-6-2014
 */

var CFG = require('ContextFreeGrammar');
var sets = require('simplesets');

function initialise_chart(sentence) {
  var N = sentence.length;
  var chart = new Array(N);
  var i;
  
  for (i = 0; i < N; i++) {
    chart[i] = new sets.Set();
  }
  
  return chart;
}

// Creates an item; dot is an index in the RHS of the rule, 
// from is the starting point in the sentence
function new_item(rule, dot, from) {
  var item;
  
  item.rule = rule;
  item.dot = dot;
  item.from = from;
}

// Checks if an item is recognised
function is_incomplete(item) {
  return(item.dot < item.rule.rhs.length);
}

// Checks if the next category after the dot is a nonterminal
function next_cat_is_nonterminal(item) {
  return(CFG.is_nonterminal(item.rule.rhs[item.dot]));
}

// The earley parser. Sentence is an array of words
exports.earley_parse = function(sentence) {
  var chart = initialise_chart();
  var N = sentence.length;
  var start_item;
  var i;
  var items_were_added = false;

  // Introduces new items for the next nonterminal to be recognised
  function predictor(item, j) {
    // remember the size of the set at position j 
    var nr_items = chart[j].size;
    // B is the nonterminal that should be predicted
    var B = item.rule.rhs[item.dot];
    // Get all rules with lhs B
    var rules_with_lhs_B = CFG.rules_with_lhs(B);
    
    rules_with_lhs_B.foreach(function(rule) {
        chart[j].add(new_item(rule, 0, j));
    });
    // return true if items were added
    return(nr_items !== chart[j].size);
  }

  // The next category to be recognised is a terminal
  function scanner(item, j) {
    // remember the size of the set at position j + 1 
    var nr_items = chart[j+1].size;
    
    // Place the dot one to the right if the word matches
    if (sentence[j] === item.rule.rhs[item.dot]) {
      item.dot++;
      chart[j+1].add(item);
    }
    // return true if items were added
    return(nr_items !== chart[j+1].size);
  }

  // Shifts the dot to the right for items in chart[k]
  function completer(item, k) {
    // remember the size of the set at position k 
    var nr_items = chart[k].size;
    var B = item.lhs;
    chart[item.from].foreach(function(item_for_comp) {
      if (item_for_comp.rhs[item_for_comp.dot] === B) {
        chart[k].add(new_item(item_for_comp.rule, item_for_comp.dot+1, item_for_comp.from));
      }
    });
    // return true if items were added
    return(nr_items !== chart[k].size);
  }

  // Seed the parser with the start rule;
  start_item = new_item(CFG.start_rule(), 1, 0);
  chart[0].add(start_item);
  // Start parsing
  for (i = 0; i <= N; i++) {
    chart[i].forEach(function(item) {
      items_were_added = false;
      do {
        if (is_incomplete(item)) {
          if (next_cat_is_nonterminal(item)) {
            // non-terminal
            if (predictor(item, i)) {
              items_were_added = true;
            }
          }
          else {
            // terminal
            if (scanner(item, i)) {
              items_were_added = true;
            }
          }
        }
        else {
          if (completer(item, i)) {
            items_were_added = true;
          }
        }
      } while (items_were_added);
    });
  }
  return chart;
};