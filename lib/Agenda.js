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
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('DEBUG');

// Constructor
function Agenda() {
  this.agenda = [];
}

// Adds an item to the agenda
Agenda.prototype.add_item = function(item) {
  var item_found = false;
  var nr_items = 0;
  
  logger.debug("Enter Agenda.add_item( "+ item.id + ")" + "; size of the agenda: " + this.agenda.length);
  this.agenda.some(function(item2) {
    if (_.isEqual(item, item2)) {
      item_found = true;
      return(true);
    }
  });
  
  if (!item_found) {
    this.agenda.push(item);
    nr_items = 1;
  }

  logger.debug("Exit Agenda.add_item; size of the agenda: " + this.agenda.length);
  return(nr_items);
};

// Removes an item from the agenda and returns it
Agenda.prototype.get_item = function() {
  var item = this.agenda.pop();
  logger.debug("Agenda.get_item: " + (item ? item.id : "agenda is empty"));
  return(item);
};

// Checks if the agenda is empty
Agenda.prototype.is_non_empty = function() {
  return(this.agenda !== []);
};

module.exports = Agenda;