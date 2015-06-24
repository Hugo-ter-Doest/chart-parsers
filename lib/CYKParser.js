/*
    Cocke Younger Kasami (CYK) chart parser
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
var logger = log4js.getLogger('CYKParser');

//var Item = require('./CYK_Item');
var ItemFactory = require('./ItemFactory');
var itemFactory = new ItemFactory();
var Chart = require('./Chart');

var FeatureStructureFactory = require('./FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();

// Constructor for parser object
// grammar is an object as defined in CFG.js
function CYK_ChartParser(grammar) {
  logger.debug("Enter CYK_ChartParser: " + JSON.stringify(grammar));
  this.grammar = grammar;
}

CYK_ChartParser.prototype.initialise = function(tagged_sentence) {
  logger.debug("Enter CYK_ChartParser.initialise");
  this.tagged_sentence = tagged_sentence;
  this.N = tagged_sentence.length;
  this.chart = new Chart(this.N);
  for (var i = 0; i < this.N; i++) {
    // Create a terminal item of the form Terminal -> *empty*
    //var term_item = new Item({'lhs': tagged_sentence[i][0], 'rhs': []}, i, i+1);
    var term_item = itemFactory.createItem({
      'type': 'CYK',
      'rule': {'lhs': tagged_sentence[i][0], 'rhs': []},
      'from': i, 'to': i+1});
    // Create a tag item of the form Categorie -> Terminal
    for (var j = 1; j < tagged_sentence[i].length; j++) {
      var tag_item = null;
      if (GLOBAL.config.LIST_OF_CATEGORIES) {
        category = this.tagged_sentence[i][j];
      }
      else {
        var category = this.tagged_sentence[i][j].features.category.type.name;
      }
      if (GLOBAL.config.UNIFICATION && !GLOBAL.config.LIST_OF_CATEGORIES) {
        // Take the category from the feature structure
        logger.debug('CYK_ChartParser.initialise_sentence: category ' + category);
        var new_fs = featureStructureFactory.createFeatureStructure({'type_lattice': this.grammar.type_lattice});
        new_fs.addFeature(category, tagged_sentence[i][j], this.grammar.type_lattice);
        tag_item = itemFactory.createItem({
         'type': 'CYK',
         'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]},
         'from': i,
         'to': i+1,
         'fs': new_fs
       });
      }
      else {
        tag_item = itemFactory.createItem({
          'type': 'CYK',
          'rule': {'lhs': category, 'rhs': [this.tagged_sentence[i][0]]},
          'from': i,
          'to': i+1
        });
      }
      tag_item.children.push(term_item);
      this.chart.addItem(tag_item);
      logger.debug("CYK_Parser.initialise: |- " + tag_item.id);
    }
  }
  logger.debug("Exit CYK_ChartParser.initialise");
};

// This is the CYK chart parser
// sentence is a tagged sentence of the form [[word, category], [word, category], ...]
CYK_ChartParser.prototype.parse = function(tagged_sentence) {
  var that = this;

  logger.debug("Enter CYK_ChartParser.parse: " + JSON.stringify(tagged_sentence, null, 2));
  this.initialise(tagged_sentence);
  for (var i = 2; i <= this.N; ++i) { // Length of span
    for (var j = 0; j <= this.N - i; ++j) { // Start of span
      for (var k = i - 1; k >= 0; --k) { // Partition of span
        var items1 = that.chart.getItemsFromTo(j, j + k);
        var items2 = that.chart.getItemsFromTo(j + k, j + i);
        items1.forEach(function(item1) {
          items2.forEach(function(item2) {
            var matching_rules = that.grammar.getRulesWithRHS(item1.data.rule.lhs, item2.data.rule.lhs);
            matching_rules.forEach(function(rule) {
              var new_fs = null;
              if (GLOBAL.config.UNIFICATION) {
                new_fs = rule.fs.copy(that.grammar.type_lattice);
                // Add fs for the first nonterminal
                if (item1.data.fs.features[rule.rhs[0]]) {
                  if (new_fs.features[rule.rhs[0]]) {
                    // Create an fs with only feature rule.rhs[0]
                    var fs_with_feature_rhs0 = featureStructureFactory.
                      createFeatureStructure({type_lattice: grammar.type_lattice});
                    fs_with_feature_rhs0.addFeature(rule.rhs[0],
                      item1.data.fs.features[rule.rhs[0]], grammar.type_lattice);
                    // Unify
                    new_fs = new_fs.unify(fs_with_feature_rhs0, that.grammar.type_lattice);
                  }
                  else {
                    // Add feature
                    new_fs.addFeature(rule.rhs[0], item1.data.fs.features[rule.rhs[0]], that.grammar.type_lattice);
                  }
                }
                // Add fs for the second nonterminal
                if (item2.data.fs.features[rule.rhs[1]]) {
                  if (new_fs.features[rule.rhs[1]]) {
                    // Create an fs with only feature rule.rhs[0]
                    var fs_with_feature_rhs1 = featureStructureFactory.
                      createFeatureStructure({type_lattice: grammar.type_lattice});
                    fs_with_feature_rhs1.addFeature(rule.rhs[1],
                      item2.data.fs.features[rule.rhs[1]], grammar.type_lattice);
                    // Unify
                    new_fs = new_fs.unify(fs_with_feature_rhs1, that.grammar.type_lattice);
                  }
                  else {
                    // Add feature
                    new_fs.addFeature(rule.rhs[1], item2.data.fs.features[rule.rhs[1]], that.grammar.type_lattice);
                  }
                }
                if (new_fs !== that.grammar.type_lattice.top) {
                  var item = itemFactory.createItem({
                    'type': 'CYK',
                    'rule': rule, 
                    'from': item1.data.from, 
                    'to': item2.data.to,
                    'fs': new_fs
                  });
                  item.addChild(item1);
                  item.addChild(item2);
                  that.chart.addItem(item);
                  logger.debug("CYK_ChartParser.parse: " + item1.id + ", " + item2.id + " |- " + item.id);
                }
                else {
                  logger.debug("CYK_ChartParser.parse: unification failed: " + item1.id + ", " + item2.id);
                }
              }
              else {
                var item = itemFactory.createItem({
                    'type': 'CYK',
                    'rule': rule, 
                    'from': item1.data.from, 
                    'to': item2.data.to,
                    'fs': new_fs
                  });
                  item.addChild(item1);
                  item.addChild(item2);
                  that.chart.addItem(item);
              }
            });
          });
        });
      }
    }
  }
  logger.debug("Exit CYK_ChartParser.parse: " + JSON.stringify(this.chart, null, 2));
  return this.chart;
};

module.exports = CYK_ChartParser;