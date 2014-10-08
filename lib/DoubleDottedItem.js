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

var Item = require('./Item');

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
Item.prototype.copy = function() {
  var new_item = new Item(this.data.rule, this.data.left_dot, this.data.right_dot, this.data.from, this.data.to);
  new_item.children = this.children.slice();
  return(new_item);
}

// Checks if an item is incomplete
Item.prototype.is_incomplete = function () {
  return(!this.is_complete());
};

// Checks if an item is complete
Item.prototype.is_complete = function () {
  return((this.data.left_dot === 0) && (this.data.right_dot === this.data.rule.rhs.length));
};

module.exports = Item;
