/*
    DoubleDottedItem class, inherits from Item
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

var typeOf = require('typeof');

var Item = require('./Item');
var GoalItem = require('./GoalItem');

// Creates an item; 
// left_dot is an index in the RHS of the rule as well as right_dot
// from is the starting point in the sentence
// Data structure is prepared for InfoVis
function DoubleDottedItem(rule, left_dot, right_dot, from, to) {
  // A unique identifier is constructed from rule, dot and from
  this.id = "(" + rule.lhs + "->" + rule.rhs + ", " + left_dot + ", " + right_dot + ", " + from + ", " + to +")";
  console.log('New item: ' + this.id);
  this.name = rule.lhs;
  this.children = [];

  this.data = {};
  this.data.rule = rule;
  this.data.left_dot = left_dot;
  this.data.right_dot = right_dot;
  this.data.from = from;
  this.data.to = to;
}

DoubleDottedItem.prototype = Object.create(Item.prototype);

// Create a copy of the item including the children
DoubleDottedItem.prototype.copy = function() {
  var new_item = new Item(this.data.rule, this.data.left_dot, this.data.right_dot, this.data.from, this.data.to);
  new_item.children = this.children.slice();
  return(new_item);
}

// Checks if an item is incomplete
DoubleDottedItem.prototype.is_incomplete = function () {
  return(!this.is_complete());
};

// Checks if an item is complete
DoubleDottedItem.prototype.is_complete = function () {
  return((this.data.left_dot === 0) && (this.data.right_dot === this.data.rule.rhs.length));
};

DoubleDottedItem.prototype.combine_with_chart = function(chart, agenda, grammar) {
  this.left_predict(chart, agenda, grammar);
  this.right_predict(chart, agenda, grammar);
  this.left_complete(chart, agenda, grammar);
  this.right_complete(chart, agenda, grammar);
};

DoubleDottedItem.prototype.left_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  // Get goal items that and at the "to" of the current item
  var items = chart.get_items_to(this.data.to);
  items.forEach(function(item) {
    if (typeof(item) === "GoalItem") { // try to combine with the current item
      if (grammar.is_headcorner_of(that.data.rule.lhs, item.nonterminal)) {
        for (var i = item.from; i <= that.data.from; i++) {
          for (var j = i; i < that.data.from; j++) {
            var new_goal = new GoalItem(i, j, that.data.rule.rhs[that.data.left_dot]);
            nr_items_added += agenda.add_item(new_goal);
          }
        }
      }
    }
  });
  return(nr_items_added);
};

DoubleDottedItem.prototype.right_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  var items = chart.get_items_from(this.i);
  items.forEach(function(item) {
    if (grammar.is_headcorner_of(item.data.rule.lhs, that.nonterminal)) {
      for (var i = that.i; i <= that.j; i++) {
        for (var j = i; i < goal.j; j++) {
          var new_goal = new GoalItem(i, j, item.data.rule.rhs[item.data.right_dot]);
          nr_items_added += agenda.add_item(new_goal);
        }
      }
    }
  });
  return(nr_items_added);
};


DoubleDottedItem.prototype.left_complete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  
  for (var j = this.i; j < this.j; i++) {
    var items1 = chart.get_items_from_to(this.i, j);
    var items2 = chart.get_items_from_to(j, this.j);
    items1.forEach(function(item1) {
      items2.forEach(function(item2) {
        if ((item1.is_complete()) && 
            (item2.data.rule.lhs[item2.data.left_dot] ===item1.data.rule.lhs) && 
            (grammar.is_headcorner_of(item2.data.lhs, goal.nonterminal))) {
              var new_item = new DoubleDottedItem(item2.data.rule, item2.data.left_dot-1, item2.data.right_dot, that.i, that.j);
              new_item.set_children(item2.children.slice());
              new_item.add_child(item1);
              nr_items_added += agenda.add_item(new_item);
        }
      });
    });
  }
  return(nr_items_added);
};

DoubleDottedItem.prototype.right_complete = function (chart, agenda, grammar) {
  var nr_items_added = 0;
  var that = this;
  
  for (var j = this.i; j < this.j; i++) {
    var items1 = chart.get_items_from_to(this.i, j);
    var items2 = chart.get_items_from_to(j, this.j);
    items1.forEach(function(item1) {
      items2.forEach(function(item2) {
        if ((item2.is_complete()) && 
            (item1.data.rule.lhs[item1.data.right_dot] === item2.data.rule.lhs) && 
            (grammar.is_headcorner_of(item1.data.lhs, goal.nonterminal))) {
              var new_item = new DoubleDottedItem(item1.data.rule, item1.data.left_dot, item2.data.right_dot+1, that.i, that.j);
              new_item.set_children(item1.children.slice());
              new_item.add_child(item2);
              nr_items_added += agenda.add_item(new_item);
        }
      });
    });
  }
  return(nr_items_added);
};

module.exports = DoubleDottedItem;
