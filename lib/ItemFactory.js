/*
    Item factory for creating different types of items
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

var log4js = require('log4js');
var logger = log4js.getLogger();

var settings = require('./Settings');

logger.setLevel(settings.loggingLevels.ItemFactory);

function ItemFactory() {}
module.exports = ItemFactory;

var CYK_Item = require('./CYK_Item');
var GoalItem = require('./GoalItem');
var EarleyItem = require('./EarleyItem');
var DoubleDottedItem = require('./DoubleDottedItem');

// Our default itemClass is CYK_Item
ItemFactory.prototype.itemClass = CYK_Item;

// Our Factory method for creating new item instances
ItemFactory.prototype.createItem = function(options) {

  switch (options.type) {
    case 'CYK': {
      this.itemClass = CYK_Item;
      break;
    }
    case 'Earley': {
      this.itemClass = EarleyItem;
      break;
    }
    case 'Goal': {
      this.itemClass = GoalItem;
      break;
    }
    case 'DoubleDotted': {
      this.itemClass = DoubleDottedItem;
      break;
    }
    // defaults to CYK_Item
  }
  // if an item is passed make a copy
  if (options.item) {
    // Set parameters
  }
  return new this.itemClass(options);
};