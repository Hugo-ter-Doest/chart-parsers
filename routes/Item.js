/*
    Item class
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

// Creates an item; dot is an index in the RHS of the rule, 
// from is the starting point in the sentence
// Data structure is prepared for InfoVis
function Item(rule, dot, from) {
  var item = {};
  
  // A unique identifier is constructed from rule, dot and from
  this.id = "(" + rule.lhs + "->" + rule.rhs + ", " + dot + ", " + from + ")";
  this.name = rule.lhs;
  this.children = [];
  
  this.data = {};
  this.data.rule = rule;
  this.data.dot = dot;
  this.data.from = from;
}

// Checks if an item is incomplete
Item.prototype.is_incomplete = function () {
  console.log("Item is incomplete?: " + this.id + (this.data.dot < this.data.rule.rhs.length));
  return(this.data.dot < this.data.rule.rhs.length);
};

// Checks if an item is complete
Item.prototype.is_complete = function () {
  console.log("Item is incomplete?: " + this.id + (this.data.dot < this.data.rule.rhs.length));
  return(this.data.dot === this.data.rule.rhs.length);
};

module.exports = Item;
