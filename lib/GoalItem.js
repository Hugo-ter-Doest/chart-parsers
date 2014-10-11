/*
    GoalItem class
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

function GoalItem(i, j, nonterminal) {
  this.from = i;
  this.to = j;
  this.nonterminal = nonterminal;
}

GoalItem.prototype.combine_with_chart = function(chart, agenda, grammar) {
  this.hc(chart, agenda, grammar);
  this.hc_empty(chart, agenda, grammar);
  this.left_predict(chart, agenda, grammar);
  this.right_predict(chart, agenda, grammar);
  this.left_complete(chart, agenda, grammar);
  this.right_complete(chart, agenda, grammar);
};

// Adds double dotted items to the chart based on goal and completed items
GoalItem.prototype.hc_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  
  var items = chart.get_items_from_to(this.from, this.to);
  items.forEach(function(item) {
    if (item.is_complete()) {
      // Create head-corner items
      var rules = grammar.get_rules_with_head(that.nonterminal);
      rules.forEach(function(rule) {
        if (grammar_is_headcorner_of(rule.lhs, that.nonterminal)) {
          var new_item = new DoubleDottedItem(rule, rule.headcorner, rule.headcorner+1, that.from, that.to);
          nr_items_added += agenda.add_item(new_item);
        }
      });
    }
  });
  return(nr_items_added);
};

GoalItem.prototype.hc_predict_empty = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  

  if (this.i === this.j) {
    var rules = grammar.get_rules_with_head(goal.nonterminal);
    grammar.rules.forEach(function(rule) {
      if ((rule.rhs.length === 0) && grammar_is_headcorner_of(rule.lhs, that.nonterminal)) {
        var new_item = new DoubleDottedItem(rule, 0, 0, that.i, that.j);
          nr_items_added += agenda.add_item(new_item);
        }
    });
  }
  return(nr_items_added);
};

GoalItem.prototype.left_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  var items = chart.get_items_to(this.to);
  items.forEach(function(item) {
    if (grammar.is_headcorner_of(item.data.rule.lhs, that.nonterminal)) {
      for (var i = that.i; i <= that.to; i++) {
        for (var j = i; i < that.to; j++) {
          var new_goal = new GoalItem(i, j, item.data.rule.rhs[item.data.left_dot]);
          nr_items_added += agenda.add_item(new_goal);
        }
      }
    }
  });
  return(nr_items_added);
};

GoalItem.prototype.right_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  var items = chart.get_items_from(this.from);
  items.forEach(function(item) {
    if (grammar.is_headcorner_of(item.data.rule.lhs, that.nonterminal)) {
      for (var i = that.i; i <= that.to; i++) {
        for (var j = i; i < that.to; j++) {
          var new_goal = new GoalItem(i, j, item.data.rule.rhs[item.data.right_dot]);
          nr_items_added += agenda.add_item(new_goal);
        }
      }
    }
  });
  return(nr_items_added);
};

GoalItem.prototype.left_complete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  
  for (var j = this.from; j < this.to; i++) {
    var items1 = chart.get_items_from_to(this.from, j);
    var items2 = chart.get_items_from_to(j, this.to);
    items1.forEach(function(item1) {
      items2.forEach(function(item2) {
        if ((item1.is_complete()) && 
            (item2.data.rule.lhs[item2.data.left_dot] ===item1.data.rule.lhs) && 
            (grammar.is_headcorner_of(item2.data.lhs, goal.nonterminal))) {
              var new_item = new DoubleDottedItem(item2.data.rule, item2.data.left_dot-1, item2.data.right_dot, that.from, that.to);
              new_item.set_children(item2.children.slice());
              new_item.add_child(item1);
              nr_items_added += agenda.add_item(new_item);
        }
      });
    });
  }
  return(nr_items_added);
};

GoalItem.prototype.right_complete = function (chart, agenda, grammar) {
  var nr_items_added = 0;
  var that = this;
  
  for (var j = this.from; j < this.to; i++) {
    var items1 = chart.get_items_from_to(this.from, j);
    var items2 = chart.get_items_from_to(j, this.to);
    items1.forEach(function(item1) {
      items2.forEach(function(item2) {
        if ((item2.is_complete()) && 
            (item1.data.rule.lhs[item1.data.right_dot] === item2.data.rule.lhs) && 
            (grammar.is_headcorner_of(item1.data.lhs, goal.nonterminal))) {
              var new_item = new DoubleDottedItem(item1.data.rule, item1.data.left_dot, item2.data.right_dot+1, that.from, that.to);
              new_item.set_children(item1.children.slice());
              new_item.add_child(item2);
              nr_items_added += agenda.add_item(new_item);
        }
      });
    });
  }
  return(nr_items_added);
};

module.exports = GoalItem;