/*
    DoubleDottedItem class
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
var logger = log4js.getLogger('DoubleDottedItem');

var typeOf = require('typeof');
var _ = require('underscore');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

var TypedFeatureStructure = require('./TypedFeatureStructure');


// Creates a doubledotted item; 
// left_dot is an index in the RHS of the rule as well as right_dot
// from is the starting point in the sentence
// Data structure is prepared for use with InfoVis
function DoubleDottedItem(parameters) {
  // An identifier is constructed from rule, dots, from and to
  this.id = "DoubleDottedItem(" + parameters.rule.lhs + "->" + 
    parameters.rule.rhs + ", " + parameters.left_dot + ", " + 
    parameters.right_dot + ", " + parameters.from + ", " + parameters.to +")";
  logger.debug("Enter DoubleDottedItem: " + this.id);
  this.name = parameters.rule.lhs;
  this.children = [];

  this.data = {};
  this.data.rule = parameters.rule;
  this.data.left_dot = parameters.left_dot;
  this.data.right_dot = parameters.right_dot;
  this.data.from = parameters.from;
  this.data.to = parameters.to;
  this.data.fs = parameters.fs;
  logger.debug("Exit DoubleDottedItem: created item: " + this.id);
}

// Check whether this can be replaced by clone (i.e. shallow copy)
DoubleDottedItem.prototype.copy = function (grammar) {
  logger.debug("Enter DoubleDottedItem.copy(): " + this.id);
  //var new_item = new DoubleDottedItem(this.data.rule, this.data.left_dot, this.data.right_dot, this.data.from, this.data.to);
  var new_item = itemFactory.createItem({
    'type': 'DoubleDotted',
    'rule': this.data.rule, 
    'left_dot': this.data.left_dot,
    'right_dot': this.data.right_dot,
    'from': this.data.from,
    'to': this.data.to,
    'fs': GLOBAL.config.UNIFICATION ? this.data.fs.copy(grammar.signature) : null
  });
  new_item.children = this.children.slice();
  logger.debug("Exit DoubleDottedItem.copy: " + new_item.id);
  return(new_item);
};

DoubleDottedItem.prototype.isEqualTo = function(item) {
  var equal = (this.name === item.name) &&
    _.isEqual(this.children, item.children) &&
    _.isEqual(this.data.rule, item.data.rule) &&
    (this.data.left_dot === item.data.left_dot) &&
    (this.data.right_dot === item.data.right_dot) &&
    (this.data.from === item.data.from) &&
    (this.data.to === item.data.to);
  if (GLOBAL.config.UNIFICATION) {
    equal = equal && this.data.fs.isEqualTo(item.data.fs);
  }
  return(equal);
};

// Given a CYK item that matches the next nonterminal to be recognised at the 
// left dot, the dot is moved one position to the left.
DoubleDottedItem.prototype.recogniseLeft = function(cyk_item, grammar) {
  logger.debug("Enter " + this.id + ".recogniseLeft(" + cyk_item.id + ")");
  var B = this.data.rule.rhs[this.data.left_dot-1];
  this.data.left_dot--;
  this.data.from = cyk_item.data.from;
  this.children.unshift(cyk_item);
  if (GLOBAL.config.UNIFICATION) {
    if (this.data.fs.features[B]) {
      if (cyk_item.data.fs.features[B]) {
        // both feature structures have feature B: unify these
        var fs_with_feature_B = new TypedFeatureStructure({signature: grammar.signature});
        fs_with_feature_B.addFeature(B, cyk_item.data.fs.features[B], grammar.signature);
        this.data.fs = this.data.fs.unify(fs_with_feature_B, grammar.signature);
      }
    }
    else {
      if (cyk_item.data.fs.features[B]) {
        // only cyk_item has feature B
        this.data.fs.addFeature(B, cyk_item.data.fs.features[B], grammar.signature);
      }
    }
  }
  this.id = "DoubleDottedItem(" + this.data.rule.lhs + "->" + this.data.rule.rhs + ", " + 
            this.data.left_dot + ", " + this.data.right_dot + ", " + this.data.from + ", " + this.data.to +")";
  logger.debug("Exit DoubleDottedItem.recogniseLeft: " + this.id);
};

// Given a CYK item that matches the next nonterminal to be recognised at the 
// right dot, the dot is moved one position to the left.
DoubleDottedItem.prototype.recogniseRight = function(cyk_item, grammar) {
  logger.debug("Enter " + this.id + ".recogniseRight(" + cyk_item.id + ")");
  var B = this.data.rule.rhs[this.data.right_dot];
  this.data.right_dot++;
  this.data.to = cyk_item.data.to;
  this.children.push(cyk_item);
  if (GLOBAL.config.UNIFICATION) {
    if (this.data.fs.features[B]) {
      if (cyk_item.data.fs.features[B]) {
        // both feature structures have feature B: unify these
        var fs_with_feature_B = new TypedFeatureStructure({signature: grammar.signature});
        fs_with_feature_B.addFeature(B, cyk_item.data.fs.features[B], grammar.signature);
        this.data.fs = this.data.fs.unify(fs_with_feature_B, grammar.signature);
      }
    }
    else {
      if (cyk_item.data.fs.features[B]) {
      // only cyk_item has feature B
        this.data.fs.addFeature(B, cyk_item.data.fs.features[B], grammar.signature);
      }
    }
  }
  this.id = "DoubleDottedItem(" + this.data.rule.lhs + "->" + this.data.rule.rhs + ", " + 
            this.data.left_dot + ", " + this.data.right_dot + ", " + this.data.from + ", " + this.data.to +")";
  logger.debug("Exit DoubleDottedItem.recogniseRight: " + this.id);
};

// Checks if an item is incomplete
DoubleDottedItem.prototype.isIncomplete = function () {
  return(!this.isComplete());
};

// Checks if an item is complete
DoubleDottedItem.prototype.isComplete = function () {
  return((this.data.left_dot === 0) && (this.data.right_dot === this.data.rule.rhs.length));
};

DoubleDottedItem.prototype.combineWithChart = function(chart, agenda, grammar) {
  var nr_items_added = 0;
  
  logger.debug("Enter DoubleDottedItem.combineWithChart:" + this.id);
  nr_items_added += this.preComplete(chart, agenda, grammar);
  nr_items_added += this.leftPredict(chart, agenda, grammar);
  nr_items_added += this.rightPredict(chart, agenda, grammar);
  nr_items_added += this.leftComplete(chart, agenda, grammar);
  nr_items_added += this.rightComplete(chart, agenda, grammar);
  logger.debug("Exit DoubleDottedItem.combineWithChart: number of items added: " + nr_items_added);
};

// If the double dotted item is complete, create a CYK item
DoubleDottedItem.prototype.preComplete = function (chart, agenda, grammar) {
  var nr_items_added = 0;

  logger.debug("Enter DoubleDottedItem.preComplete:" + this.id);
  if (this.isComplete()) {
    var new_item = itemFactory.createItem({
      'type': 'CYK',
      'rule': this.data.rule, 
      'from': this.data.from, 
      'to': this.data.to,
      'fs': this.data.fs
    });
    new_item.children = this.children.slice();
    nr_items_added += agenda.addItem(new_item, chart);
    logger.debug("DoubleDottedItem.preComplete: " + this.id + " |- " + new_item.id);
  }
  logger.debug("Exit DoubleDottedItem.preComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Introduce goal items for recognition left to the left dot
DoubleDottedItem.prototype.leftPredict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter DoubleDottedItem.leftPredict:" + this.id);
  if (this.data.left_dot > 0) {
    // Get goal items that end at the "to" of the current item
    var items = chart.getItemsTo(this.data.to);
    items.forEach(function(item) {
      if (typeOf(item) === "goalitem") { // try to combine with the current item
        if (grammar.isHeadcornerOf(that.data.rule.lhs, item.nonterminal)) {
          for (var i = item.data.from; i <= that.data.from; i++) {
            for (var j = i; j <= that.data.from; j++) {
              var new_goal = itemFactory.createItem({
                'type': 'Goal',
                'nonterminal': that.data.rule.rhs[that.data.left_dot-1],
                'from': i,
                'to': j
              });
              nr_items_added += agenda.addItem(new_goal, chart);
              logger.debug("DoubleDottedItem.leftPredict: " + item.id + ", " +
                that.id + " |- " + new_goal.id);
            }
          }
        }
      }
    });
  }
  logger.debug("Exit DoubleDottedItem.leftPredict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Introduce goal items for recognition right to the right dot
DoubleDottedItem.prototype.rightPredict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter DoubleDottedItem.rightPredict:" + this.id);
  if (this.data.right_dot < this.data.rule.rhs.length) {
    // Get goal items that start at the "from" of the current item
    var items = chart.getItemsFrom(this.data.from);
    items.forEach(function(item) {
      if (typeOf(item) === "goalitem") { // try to combine with the current item
        if (grammar.isHeadcornerOf(that.data.rule.lhs, item.data.nonterminal)) {
          for (var j = that.data.to; j <= item.data.to; j++) {
            for (var k = j; k <= item.data.to; k++) {
              var new_goal = itemFactory.createItem({
                'type': 'Goal',
                'nonterminal': that.data.rule.rhs[that.data.right_dot],
                'from': j,
                'to': k
              });
              nr_items_added += agenda.addItem(new_goal, chart);
              logger.debug("DoubleDottedItem.rightPredict: " + item.id + ", " + that.id + " |- " + new_goal.id);
            }
          }
        }
      }
    });
  }
  logger.debug("Exit DoubleDottedItem.rightPredict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

DoubleDottedItem.prototype.leftComplete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter DoubleDottedItem.leftComplete:" + this.id);
  if  (this.data.left_dot > 0) {
    // Get goal items that end at the "to" of the current item
    var items1 = chart.getItemsTo(this.data.to);
    items1.forEach(function(item1) {
      if (typeOf(item1) === "goalitem") { 
        // find completed items to combine with
        var items2 = chart.getItemsFromTo(item1.data.from, that.data.from);
        items2.forEach(function(item2) {
          if ((typeOf(item2) === "cyk_item") &&
              (that.data.rule.rhs[that.data.left_dot-1] === item2.data.rule.lhs) &&
              grammar.isHeadcornerOf(that.data.rule.lhs, item1.data.nonterminal)) {
            var new_item = that.copy(grammar);
            new_item.recogniseLeft(item2, grammar);
            if (!GLOBAL.config.UNIFICATION || (new_item.data.fs !== grammar.signature.typeLattice.top)) {
              nr_items_added += agenda.addItem(new_item, chart);
              logger.debug("DoubleDottedItem.left_complete: " + item1.id +", " + item2.id + ", " + that.id + " |- " + new_item.id);
            }
            else {
              logger.debug("DoubleDottedItem.left_complete: unification failed: " + item1.id +", " + item2.id + ", " + that.id);
            }
          }
        });
      }
    });
  }
  logger.debug("Exit DoubleDottedItem.leftComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

DoubleDottedItem.prototype.rightComplete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter DoubleDottedItem.rightComplete:" + this.id);
  if (this.data.right_dot < this.data.rule.rhs.length) {
    // Get goal items that start at the "from" of the current item
    var items1 = chart.getItemsFrom(this.data.from);
    items1.forEach(function(item1) {
      if (typeOf(item1) === "goalitem") { 
        // find completed items to combine with
        var items2 = chart.getItemsFromTo(that.data.to, item1.data.to);
        items2.forEach(function(item2) {
          if (typeOf(item2) === "cyk_item") {
            if ((that.data.rule.rhs[that.data.right_dot] === item2.data.rule.lhs) &&
                grammar.isHeadcornerOf(that.data.rule.lhs, item1.data.nonterminal)) {
              var new_item = that.copy(grammar);
              new_item.recogniseRight(item2, grammar);
              if (!GLOBAL.config.UNIFICATION || (new_item.data.fs !== grammar.signature.typeLattice.top)) {
                nr_items_added += agenda.addItem(new_item, chart);
                logger.debug("DoubleDottedItem.right_complete: " + item1.id + 
                  ", " + that.id + ", " + item2.id + " |- " + new_item.id);
              }
              else {
                logger.debug("DoubleDottedItem.right_complete: unification failed" + 
                  item1.id +", " + that.id + ", " + item2.id);
              }
            }
          }
        });
      }
    });
  }
  logger.debug("Exit DoubleDottedItem.rightComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

module.exports = DoubleDottedItem;
