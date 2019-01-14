/*
    Head-Corner Chart Parser
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
var logger = log4js.getLogger('HeadCornerParser');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();
var Chart = require('./Chart');
var Agenda = require('./Agenda');

var TypedFeatureStructure = require('./TypedFeatureStructure');

HeadCornerChartParser.prototype.initialiseGoals = function(tagged_sentence) {
  var new_item;
  var nr_items_added = 0;
  var i,j;

  logger.debug("Enter HeadCornerChartParser.initialiseGoals");
  // Add goal items for the start symbol
  for (i = 0; i <= this.N; i++) {
    for (j = i; j <= this.N; j++) {
      new_item = itemFactory.createItem({
        'type': 'Goal',
        'nonterminal': this.grammar.getStartSymbol(),
        'from': i,
        'to': j
      });
      nr_items_added += this.agenda.addItem(new_item, this.chart, this.grammar.signature);
      logger.debug("HeadCornerChartParser.initialise: |- " + new_item.id);
    }
  }
  logger.debug("Enter HeadCornerChartParser.initialiseGoals: number of items added: " + nr_items_added);
  return(nr_items_added);
};

HeadCornerChartParser.prototype.initialiseSentenceCFG = function(tagged_sentence) {
  var nr_items_added = 0;

  logger.debug("Enter HeadCornerChartParser.initialise_cfg");
  // Add items for the tagged sentence
  for (var i = 0; i < this.N; i++) {
    // Add terminal item
    //var term_item = new CYK_Item({'lhs': this.tagged_sentence[i][0], 'rhs': ''}, i, i + 1);
    var term_item = itemFactory.createItem({
      'type': 'CYK', 
      'rule': {'lhs': this.tagged_sentence[i][0], 'rhs': ''}, 
      'from': i,
      'to': i + 1});
    // Add tag items
    for (var j = 1; j < tagged_sentence[i].length; j++) {
      if (global.config.LIST_OF_CATEGORIES) {
        var category;
        category = this.tagged_sentence[i][j];
      }
      else {
        category = this.tagged_sentence[i][j].features.category.type.name;
      }
      var tag_item = itemFactory.createItem({
        'type': 'CYK',
        'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]}, 
        'from': i, 
        'to': i + 1
      });
      tag_item.children.push(term_item);
      nr_items_added += this.chart.addItem(tag_item);
      logger.debug("HeadCornerChartParser.initialise: |- " + tag_item.id);
    }
  }
  logger.debug("Exit  HeadCornerChartParser.initialise: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// It is assumed that tagged_sentence holds feature structures, not categories.
HeadCornerChartParser.prototype.initialiseSentenceUG = function(tagged_sentence) {
  var nr_items_added = 0;

  logger.debug("Enter HeadCornerChartParser.initialise_ug");
  // Add items for the tagged sentence
  for (var i = 0; i < this.N; i++) {
    // Add terminal item
    //var term_item = new CYK_Item({'lhs': this.tagged_sentence[i][0], 'rhs': ''}, i, i + 1);
    var term_item = itemFactory.createItem({
      'type': 'CYK', 
      'rule': {'lhs': this.tagged_sentence[i][0], 'rhs': ''}, 
      'from': i,
      'to': i + 1});
    // Add tag items
    for (var j = 1; j < tagged_sentence[i].length; j++) {
      // Take the category from the feature structure
      var category = this.tagged_sentence[i][j].features.category.type.name;
      logger.debug('HeadCornerChartParser.initialiseSentenceUG: category ' + category);
      var new_fs = new TypedFeatureStructure({
        type: this.grammar.signature.typeLattice.constituent,
        signature: this.grammar.signature
      });
      new_fs.addFeature(category, tagged_sentence[i][j], this.grammar.signature);
      var tag_item = itemFactory.createItem({
        'type': 'CYK',
        'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]},
        'from': i,
        'to': i + 1,
        'fs': new_fs
      });
      tag_item.children.push(term_item);
      nr_items_added += this.chart.addItem(tag_item, this.grammar.signature);
      logger.debug("HeadCornerChartParser.initialise: |- " + tag_item.id);
    }
  }
  logger.debug("Exit HeadCornerChartParser.initialise_ug: number of items added: " + nr_items_added);
  return(nr_items_added);
};

HeadCornerChartParser.prototype.initialise = function(tagged_sentence) {
  var nr_items_added = 0;
  
  logger.debug('Enter ChartParser.initialise');
  this.tagged_sentence = tagged_sentence;
  this.N = this.tagged_sentence.length;
  // Initialise chart
  this.chart = new Chart(this.N);
  // Initialise agenda
  this.agenda = new Agenda();
  
  nr_items_added += this.initialiseGoals(tagged_sentence);
  if (global.config.UNIFICATION) {
    nr_items_added += this.initialiseSentenceUG(tagged_sentence);
  }
  else {
    nr_items_added += this.initialiseSentenceCFG(tagged_sentence);
  }
  logger.debug("Exit ChartParser.initialise; number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Pseudo code of a chart parser with agenda (based on Sikkel's parsing schemata):
//   create initial chart and agenda
//   while agenda is not empty
//     delete (arbitrarily chosen) item current from agenda
//     if current is not on the chart then
//       add current to chart
//       add all items that can be deduced by combining current with
//       the items already on the chart
//       to the agenda if it is not already on chart or agenda
HeadCornerChartParser.prototype.parse = function(tagged_sentence) {
  logger.debug("Enter HeadCornerChartParser.parse: sentence: " + tagged_sentence);
  this.initialise(tagged_sentence);
  var items_added = 0;
  var current;
  do {
    current = this.agenda.getItem();
    if (current) {
      if (this.chart.addItem(current, this.grammar.signature)) {
        items_added += current.combineWithChart(this.chart, this.agenda, this.grammar);
      }
    }
  } while (current);
  logger.debug("Exit HeadCornerChartParser.parse");
  return this.chart;
};

// Constructor for the left-corner parser
function HeadCornerChartParser(grammar) {
  this.grammar = grammar;
  this.grammar.computeHCRelation();
  logger.debug("HeadCornerChartParser: " + JSON.stringify(grammar.hc));
}

module.exports = HeadCornerChartParser;