/*
    Earley Chart parser
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

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('EarleyParser');

var Chart = require('./Chart');
var ItemFactory = require('./ItemFactory');
var itemFactory = new ItemFactory();
var TypedFeatureStructure = require('./TypedFeatureStructure');


function EarleyChartParser(grammar) {
  logger.debug("EarleyChartParser");
  this.grammar = grammar;
}

// Adds items to the chart for each word in the tagged sentence
// tagged_sentence[i] is an array of lexical categories
EarleyChartParser.prototype.initialiseSentenceCFG = function(tagged_sentence) {
  var nr_items_added = 0;

  logger.debug('Enter ChartParser.initialiseSentenceCFG');
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
      nr_items_added += this.chart.addItem(tag_item, this.signature);
      logger.debug('ChartParser.initialise_sentence_cfg: |- ' + tag_item.id);
    }
  }
  return(nr_items_added);
};

// Adds items to the chart for each word in the tagged sentence.
// It is assumed that tagged_sentence[i] is an array of feature structures
EarleyChartParser.prototype.initialiseSentenceUG = function(tagged_sentence) {
  var nr_items_added = 0;

  logger.debug('Enter ChartParser.initialiseSentenceUG');
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
      //var category = this.tagged_sentence[i][j].features.category.type.name;
      var category = this.tagged_sentence[i][j].getLexicalCategory();
      logger.debug('ChartParser.initialise_sentence_ug: category ' + category);
      var new_fs = new TypedFeatureStructure({
        type: this.grammar.signature.typeLattice.constituent,
        signature: this.grammar.signature
      });
      new_fs.addFeature(category, tagged_sentence[i][j], this.grammar.signature);
      var tag_item = itemFactory.createItem({
        'type': 'Earley',
        'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]},
        'dot': 1,
        'from': i,
        'to': i + 1,
        'fs': new_fs
      });
      tag_item.append_child(term_item);
      nr_items_added += this.chart.addItem(tag_item, this.signature);
      logger.debug('ChartParser.initialise_sentence_ug: |- ' + tag_item.id);
    }
  }
  return(nr_items_added);
};

// Add items for rules that have the start symbol as left-hand-side
EarleyChartParser.prototype.initialiseGoals = function(tagged_sentence) {
  var nr_items_added = 0;

  var rules = this.grammar.rulesWithLHS(this.grammar.getStartSymbol());
  var that = this;
  rules.forEach(function(rule) {
    var new_item = itemFactory.createItem({
      'type': 'Earley',
      'rule': rule,
      'dot': 0,
      'from': 0,
      'to': 0,
      'fs': GLOBAL.config.UNIFICATION
        ? rule.fs.copy(that.grammar.signature)
        : null
    });
    nr_items_added += that.chart.addItem(new_item, this.signature);
  });
  return(nr_items_added);
};

// Initialises the chart with goal items and with lexical items
// tagged_sentence is an array of array of feature structures
EarleyChartParser.prototype.initialise = function(tagged_sentence) {
  var nr_items_added = 0;

  logger.debug('Enter ChartParser.initialise');
  this.tagged_sentence = tagged_sentence;
  this.N = this.tagged_sentence.length;
  // Initialise chart
  this.chart = new Chart(this.N);
  nr_items_added += this.initialiseGoals(tagged_sentence);
  if (GLOBAL.config.UNIFICATION) {
    nr_items_added += this.initialiseSentenceUG(tagged_sentence);
  }
  else {
    nr_items_added += this.initialiseSentenceCFG(tagged_sentence);
  }
  logger.debug("Exit ChartParser.initialise; number of items added: " + nr_items_added);
  return(nr_items_added);
};

// The main algorithm of the chart parser. Sentence is an array of words
// Analyses the sentence from left to right
// If you need more methods to be called then override this method
EarleyChartParser.prototype.parse = function(tagged_sentence) {
  var that = this;

  logger.debug("Enter EarleyChartParser.parse" + tagged_sentence);
  this.initialise(tagged_sentence);
  var i;
  for (i = 0; i <= tagged_sentence.length; i++) {
    var items_added;
    do {
      items_added = 0;
      var items = this.chart.getItemsTo(i);
      items.forEach(function(item) {
        logger.debug("EarleyChartParser.parse: nr of items added: " + items_added);
        items_added += item.completer(that.chart, that.grammar);
        logger.debug("EarleyChartParser.parse: nr of items added: " + items_added);
        items_added += item.predictor(that.chart, that.grammar);
        logger.debug("EarleyChartParser.parse: nr of items added: " + items_added);
      });
      logger.debug("EarleyChartParser.parse: nr of items added: " + items_added);
    } while (items_added);
  }
  logger.debug("Exit EarleyChartParser.parse" + this.chart);
  return this.chart;
};

module.exports = EarleyChartParser;