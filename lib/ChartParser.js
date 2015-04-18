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

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('ERROR');

var UNIFICATION = true;

var Chart = require('./Chart');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

var fs_base = '/home/hugo/Workspace/feature-structures/lib/';
var FeatureStructureFactory = require(fs_base + 'FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();

// Adds items to the chart for each word in the tagged sentence
ChartParser.prototype.initialise_sentence = function(tagged_sentence, func) {
  var nr_items_added = 0;
  
  logger.debug('Enter ChartParser.initialise_sentence');
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
      if (UNIFICATION) {
        var fs = featureStructureFactory.createFeatureStructure();
        fs.add_feature(this.tagged_sentence[i][j].category, this.tagged_sentence[i][j]);
        fs.add_feature('gloss', this.tagged_sentence[i][0]);
      }
      var tag_item = itemFactory.createItem({
        'type': 'Earley',
        'rule': {'lhs': this.tagged_sentence[i][j], 'rhs': [this.tagged_sentence[i][0]]},
        'dot': 1,
        'from': i,
        'to': i + 1,
        'fs': UNIFICATION ? fs : null
      });
      tag_item.append_child(term_item);
      nr_items_added += this.chart.add_item(tag_item);
      logger.debug('ChartParser.initialise_sentence: |- ' + tag_item.id);
    }
  }
  return(nr_items_added);
};

// Add items for rules that have the start symbol as left-hand-side
ChartParser.prototype.initialise_goals = function(tagged_sentence, func) {
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
      'fs': rule.fs
    });
    nr_items_added += that.chart.add_item(new_item);
  });
  return(nr_items_added);
};

// Initialises the chart with goal items and with lexical items
// tagged_sentence is an array of array of feature structures
ChartParser.prototype.initialise = function(tagged_sentence, func) {
  var that = this;
  var nr_items_added = 0;
  
  logger.debug('Enter ChartParser.initialise');
  this.tagged_sentence = tagged_sentence;
  this.N = this.tagged_sentence.length;
  // Initialise chart
  this.chart = new Chart(this.N, func);
  nr_items_added += this.initialise_goals(tagged_sentence, func);
  nr_items_added += this.initialise_sentence(tagged_sentence, func);
  logger.debug("Exit ChartParser.initialise; number of items added: " + nr_items_added);
  return(nr_items_added);
};

function ChartParser() {}

module.exports = ChartParser;