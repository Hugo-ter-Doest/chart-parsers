/*
    Generic chart parser that can be used to create different types of chart parsers
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

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('ChartParser');

var Chart = require('./Chart');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

var FeatureStructureFactory = require('./FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();

// Adds items to the chart for each word in the tagged sentence
// tagged_sentence[i] is an array of lexical categories
ChartParser.prototype.initialise_sentence_cfg = function(tagged_sentence) {
  var nr_items_added = 0;
  
  logger.debug('Enter ChartParser.initialise_sentence_cfg');
  for (var i = 0; i < this.N; i++) {
    // Create terminal item
    var term_item = itemFactory.createItem({
      'type': 'Earley',
      'rule': {'lhs': this.tagged_sentence[i][0], 'rhs': ''},
      'dot': 1,
      'from': i,
      'to': i + 1
    });
    // Add tag items
    for (var j = 1; j < tagged_sentence[i].length; j++) {
      var category;
      if (GLOBAL.config.LIST_OF_CATEGORIES) {
        category = this.tagged_sentence[i][j];
      }
      else {
        category = this.tagged_sentence[i][j].features.category.type.name;
      }
      var tag_item = itemFactory.createItem({
        'type': 'Earley',
        'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]},
        'dot': 1,
        'from': i,
        'to': i + 1
      });
      tag_item.append_child(term_item);
      nr_items_added += this.chart.add_item(tag_item);
      logger.debug('ChartParser.initialise_sentence_cfg: |- ' + tag_item.id);
    }
  }
  return(nr_items_added);
};

// Adds items to the chart for each word in the tagged sentence.
// It is assumed that tagged_sentence[i] is an array of feature structures
ChartParser.prototype.initialise_sentence_ug = function(tagged_sentence) {
  var nr_items_added = 0;
  
  logger.debug('Enter ChartParser.initialise_sentence_ug');
  for (var i = 0; i < this.N; i++) {
    // Create terminal item
    var term_item = itemFactory.createItem({
      'type': 'Earley',
      'rule': {'lhs': this.tagged_sentence[i][0], 'rhs': ''},
      'dot': 1,
      'from': i,
      'to': i + 1
    });
    // Add tag items
    for (var j = 1; j < tagged_sentence[i].length; j++) {
      // Take the category from the feature structure
      var category = this.tagged_sentence[i][j].features.category.type.name;
      logger.debug('ChartParser.initialise_sentence_ug: category ' + category);
      var new_fs = featureStructureFactory.createFeatureStructure({'type_lattice': this.type_lattice});
      new_fs.add_feature(category, tagged_sentence[i][j], this.type_lattice);
      var tag_item = itemFactory.createItem({
        'type': 'Earley',
        'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]},
        'dot': 1,
        'from': i,
        'to': i + 1,
        'fs': new_fs
      });
      tag_item.append_child(term_item);
      nr_items_added += this.chart.add_item(tag_item);
      logger.debug('ChartParser.initialise_sentence_ug: |- ' + tag_item.id);
    }
  }
  return(nr_items_added);
};

// Add items for rules that have the start symbol as left-hand-side
ChartParser.prototype.initialise_goals = function(tagged_sentence) {
  var nr_items_added = 0;

  var rules = this.grammar.rules_with_lhs(this.grammar.get_start_symbol());
  var that = this;
  rules.forEach(function(rule) {
    var new_item = itemFactory.createItem({
      'type': 'Earley',
      'rule': rule,
      'dot': 0,
      'from': 0,
      'to': 0,
      'fs': GLOBAL.config.UNIFICATION 
        ? rule.fs.copy(that.type_lattice) 
        : null
    });
    nr_items_added += that.chart.add_item(new_item);
  });
  return(nr_items_added);
};

// Initialises the chart with goal items and with lexical items
// tagged_sentence is an array of array of feature structures
ChartParser.prototype.initialise = function(tagged_sentence) {
  var that = this;
  var nr_items_added = 0;
  
  logger.debug('Enter ChartParser.initialise');
  this.tagged_sentence = tagged_sentence;
  this.N = this.tagged_sentence.length;
  // Initialise chart
  this.chart = new Chart(this.N);
  nr_items_added += this.initialise_goals(tagged_sentence);
  if (GLOBAL.config.UNIFICATION) {
    nr_items_added += this.initialise_sentence_ug(tagged_sentence);
  }
  else {
    nr_items_added += this.initialise_sentence_cfg(tagged_sentence);
  }
  logger.debug("Exit ChartParser.initialise; number of items added: " + nr_items_added);
  return(nr_items_added);
};

function ChartParser() {
  
}

module.exports = ChartParser;