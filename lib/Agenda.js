/*
    Agenda class
    Copyright (C) 2015 Hugo W.L. ter Doest

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

var settings = require('../config/Settings');

// For deep comparing items including children
var _ = require('underscore');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('Agenda');

var util = require('util');
var EventEmitter = require("events").EventEmitter;

// Constructor
// Agenda is a stack
function Agenda() {
  logger.debug("Agenda");
  this.agenda = [];
  this.on('itemAddedToAgenda', settings.event_function);
}

// Make Chart an EventEmitter
util.inherits(Agenda, EventEmitter);

// Adds an item to the agenda if it is nog already on  chart or agenda
Agenda.prototype.addItem = function(item, chart) {
  var item_found = false;
  var nr_items = 0;
  
  logger.debug("Enter Agenda.addItem( "+ item.id + ")" +
    "; size of the agenda: " + this.agenda.length);
  // Linear search for the item to be added
  if (chart.is_not_on_chart(item)) {
    this.agenda.some(function(item2) {
      //if (_.isEqual(item, item2)) {
      if (item.isEqualTo(item2)) {
        item_found = true;
        return(true);
      }
    });
    
    if (!item_found) {
      this.agenda.push(item);
      logger.debug("Agenda.addItem; item added: " + item.id);
      nr_items = 1;
      // emit an event
      this.emit('itemAddedToAgenda', 'itemAddedToAgenda', item);
    }
  }
  logger.debug("Exit Agenda.addItem; size of the agenda: " + this.agenda.length);
  return(nr_items);
};

// Removes an item from the agenda and returns it
Agenda.prototype.getItem = function() {
  var item = this.agenda.pop();
  logger.debug("Agenda.getItem: " + (item ? item.id : "agenda is empty"));
  return(item);
};

// Checks if the agenda is empty
Agenda.prototype.isNonEmpty = function() {
  logger.debug("Agenda.isNonEmpty: " + (this.agenda !== []));
  return(this.agenda !== []);
};

module.exports = Agenda;