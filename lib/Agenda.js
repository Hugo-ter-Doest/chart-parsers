/*
    Agenda class
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

// For deep comparing items including children
var _ = require('lodash');

// Constructor
function Agenda() {
  this.agenda = [];
}

// Adds an item to the agenda
Agenda.prototype.add_item = function(item) {
  var item_found = false;
  var nr_items = 0;
  
  this.agenda.some(function(item2) {
    if (_.isEqual(item, item2)) {
      item_found = true;
      return(true);
    }
  });
  
  if (!item_found) { // compare children
    this.agenda.push(item);
    nr_items = 1;
  }
  
  return(nr_items);
};

// Removes an item from the agenda and returns it
Agenda.prototype.get_item = function() {
  return(this.agenda.pop());
};

// Checks if the agenda is empty
Agenda.prototype.is_non_empty = function() {
  return(this.agenda !== []);
};