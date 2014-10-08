/*
    Head-Corner Chart Parser
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

var DoubleDottedItem = require('./DoubleDottedItem');
var Chart = require('./Chart');

HeadCornerChartParser.prototype.initialise = function(N) {  var that = this;
  var new_item;
  var nr_items_added = 0;

  console.log('Initialise chart and agenda');
  this.agenda = new Agenda();
  // Initialise chart
  this.chart = new Chart(N);
  // Add items for rules that have the start symbol as left-hand-side
  var rules = this.grammar.rules_with_lhs(this.grammar.get_start_symbol());
  rules.forEach(function(rule) {
    new_item = new DoubleDottedItem(rule, 0, 0, 0, 0);
    nr_items_added += that.chart.add_item(new_item);
  });
  // Add items for the tagged sentence
  for (var i = 0; i < N; i++) {
    // Add terminal item
    var term_item = new DoubleDottedItem({'lhs': tagged_sentence[i][0], 'rhs': ''}, 0, 1, i, i + 1);
    // Add tag item
    var tag_item = new DoubleDottedtem({'lhs': this.tagged_sentence[i][1], 'rhs': [this.tagged_sentence[i][0]]}, 0, 1, i, i + 1);
    tag_item.add_child(term_item);
    nr_items_added += this.chart.add_item(tag_item);
  }
  console.log('Initialise chart added ' + nr_items_added + ' items');
  return(nr_items_added);
};

// Adds double dotted items to the chart based on goal and completed items
HeadCornerChartParser.prototype.hc_predict = function (goal) {
  var that = this;
  var nr_items_added = 0;
  
  var items = this.chart.get_items_from_to(goal.i, goal.j);
  items.forEach(function(item) {
    if (item.is_complete()) {
      // Create head-corner items
      var rules = that.grammar.get_rules_with_head(goal.nonterminal);
      rules.forEach(function(rule) {
        if (that.grammar_is_headcorner_of(rule.lhs, goal.nonterminal)) {
          var new_item = new DoubleDottedItem(rule, rule.headcorner, rule.headcorner+1, goal.i, goal.j);
          nr_items_added += that.chart.add_item(new_item);
        }
      });
    }
  });
  return(nr_items_added);
};

HeadCornerChartParser.prototype.hc_predict_empty = function (goal) {
  var that = this;
  var nr_items_added = 0;
  

  if (goal.i === goal.j) {
    var rules = that.grammar.get_rules_with_head(goal.nonterminal);
    this.grammar.rules.forEach(function(rule) {
      if ((rule.rhs.length === 0) && that.grammar_is_headcorner_of(rule.lhs, goal.nonterminal)) {
        var new_item = new DoubleDottedItem(rule, 0, 0, goal.i, goal.j);
          nr_items_added += that.chart.add_item(new_item);
        }
    });
  }
  return(nr_items_added);
};

HeadCornerChartParser.prototype.left_predict = function (goal) {
  var that = this;
  var nr_items_added = 0;

  var items = this.chart.get_items_to(goal.j);
  items.forEach(function(item) {
    if (this.grammar.is_headcorner_of(item.data.rule.lhs, goal.nonterminal)) {
      for (var i = goal.i; i <= goal.j; i++) {
        for (var j = i; i < goal.j; j++) {
          var new_goal = new Goal(i, j, item.data.rule.rhs[item.data.left_dot]);
          nr_items_added += that.agenda.add_item(new_goal);
        }
      }
    }
  });
  return(nr_items_added);
};

HeadCornerChartParser.prototype.right_predict = function (goal) {
  var that = this;
  var nr_items_added = 0;

  var items = this.chart.get_items_from(goal.i);
  items.forEach(function(item) {
    if (this.grammar.is_headcorner_of(item.data.rule.lhs, goal.nonterminal)) {
      for (var i = goal.i; i <= goal.j; i++) {
        for (var j = i; i < goal.j; j++) {
          var new_goal = new Goal(i, j, item.data.rule.rhs[item.data.right_dot]);
          nr_items_added += that.agenda.add_item(new_goal);
        }
      }
    }
  });
  return(nr_items_added);
};

HeadCornerChartParser.prototype.left_complete = function (goal) {
  var that = this;
  var nr_items_added = 0;
  
  for (var j = goal.i; j < goal.j; i++) {
    var items1 = this.chart.get_items_from_to(goal.i, j);
    var items2 = this.chart.get_items_from_to(j, goal.j);
    items1.forEach(function(item1) {
      items2.forEach(function(item2) {
        if ((item1.is_complete()) && 
            (item2.data.rule.lhs[item2.data.left_dot] ===item1.data.rule.lhs) && 
            (that.grammar.is_headcorner_of(item2.data.lhs, goal.nonterminal))) {
              var new_item = new DoubleDottedItem(item2.data.rule, item2.data.left_dot-1, item2.data.right_dot, goal.i, goal.j);
              nr_items_added += that.chart.add_item(new_item);
        }
      });
    });
  }
  return(nr_items_added);
};

HeadCornerChartParser.prototype.right_complete = function (item) {
 var that = this;
  var nr_items_added = 0;
  
  for (var j = goal.i; j < goal.j; i++) {
    var items1 = this.chart.get_items_from_to(goal.i, j);
    var items2 = this.chart.get_items_from_to(j, goal.j);
    items1.forEach(function(item1) {
      items2.forEach(function(item2) {
        if ((item2.is_complete()) && 
            (item1.data.rule.lhs[item1.data.right_dot] === item2.data.rule.lhs) && 
            (that.grammar.is_headcorner_of(item1.data.lhs, goal.nonterminal))) {
              var new_item = new DoubleDottedItem(item1.data.rule, item1.data.left_dot, item2.data.right_dot+1, goal.i, goal.j);
              nr_items_added += that.chart.add_item(new_item);
        }
      });
    });
  }
  return(nr_items_added);
};

HeadCornerChartParser.prototype.parse = function (item) {
  this.tagged_sentence = tagged_sentence;
  N = tagged_sentence.length;
  that = this;

  this.initialise(N);
  var items_added;
  do {
    items_added = 0;
    var goal = this.agenda.get_item();
    items_added += that.hc_predict(goal);
    items_added += that.hc_predict_empty(goal);
    items_added += that.left_predict(goal);
    items_added += that.right_predict(goal);
    items_added += that.left_complete(goal);
    items_added += that.right_complete(goal);
  } while (this.agenda.is_non_empty());
  return this.chart;
};

// Constructor for the left-corner parser
function HeadCornerChartParser(grammar) {
  this.grammar = grammar;
  this.grammar.compute_hc_relation();
}

module.exports = HeadCornerChartParser;