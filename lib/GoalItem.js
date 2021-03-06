/*
  GoalItem class
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
var logger = log4js.getLogger('GoalItem');

var typeOf = require('typeof');
var _ = require('underscore');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

function GoalItem(parameters) {
  logger.debug("Enter GoalItem: " + parameters.from + ", " + parameters.to + ", " + 
    parameters.nonterminal);
  this.id = "Goal(" + parameters.from + ", " + parameters.to + ", " + 
          parameters.nonterminal + ")";
  this.name = parameters.nonterminal;
  this.children = [];
  this.data = {};
  this.data.from = parameters.from;
  this.data.to = parameters.to;
  this.data.nonterminal = parameters.nonterminal;
}

// Compares two goal items and returns true if they are equal, false otherwise
GoalItem.prototype.isEqualTo = function(item) {
  var equal = (this.name === item.name) &&
    _.isEqual(this.children, item.children) &&
    (this.data.nonterminal === item.data.nonterminal) &&
    (this.data.from === item.data.from) &&
    (this.data.to === item.data.to);
  return(equal);
};

// Returns false
GoalItem.prototype.isComplete = function() {
  logger.debug("Enter GoalItem.isComplete: a goal item always is incomplete!");
  return(false);
};

GoalItem.prototype.combineWithChart = function(chart, agenda, grammar) {
  var nr_items_added = 0;
  
  logger.debug("Enter GoalItem.combineWithChart:" + this.id);
  nr_items_added += this.HCPredict(chart, agenda, grammar);
  nr_items_added += this.HCPredictEmpty(chart, agenda, grammar);
  nr_items_added += this.leftPredict(chart, agenda, grammar);
  nr_items_added += this.rightPredict(chart, agenda, grammar);
  nr_items_added += this.leftComplete(chart, agenda, grammar);
  nr_items_added += this.rightComplete(chart, agenda, grammar);
  logger.debug("Exit GoalItem.combineWithChart: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Adds double dotted items to the chart based on goal and CYK items
GoalItem.prototype.HCPredict = function(chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  
  logger.debug("Enter GoalItem.HCPredict: " + this.id);
  var items = chart.getItemsFromTo(this.data.from, this.data.to);
  items.forEach(function(item) {
    if (typeOf(item) === "cyk_item") {
      // Create head-corner items
      var rules = grammar.getRulesWithHead(item.data.rule.lhs);
      rules.forEach(function(rule) {
        if (grammar.isHeadcornerOf(rule.lhs, that.data.nonterminal)) {
          var new_item = item.createHCItem(rule, that, grammar);
          if (new_item) {
            nr_items_added += agenda.addItem(new_item, chart);
            logger.debug("GoalItem.hc_predict: " + that.id +", " + item.id + " |- " + new_item.id);
          }
        }
      });
    }
  });
  logger.debug("Exit GoalItem.HCPredict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Add CYK items for epsilon rules with a left-hand-side that is head-corner of the goal
GoalItem.prototype.HCPredictEmpty = function(chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter GoalItem.HCPredictEmpty: " + this.id);
  if (this.data.from === this.data.to) {
    grammar.production_rules.forEach(function(rule) {
      if ((rule.rhs.length === 0) && grammar.isHeadcornerOf(rule.lhs, that.data.nonterminal)) {
        var new_item = itemFactory.createItem({
          'type': 'CYK',
          'rule': rule, 
          'from': that.data.from, 
          'to': that.data.to,
          'fs': global.config.UNIFICATION ? rule.fs.copy(grammar.signature) : null
          });
        nr_items_added += agenda.addItem(new_item, chart);
        logger.debug("GoalItem.HCPredictEmpty: " + that.id + " |- " + new_item.id);
      }
    });
  }
  logger.debug("Exit GoalItem.HCPredictEmpty: number of items added: " + nr_items_added);
  return(nr_items_added);
};

GoalItem.prototype.leftPredict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter GoalItem.leftPredict: " + this.id);
  var items = chart.getItemsTo(this.data.to);
  items.forEach(function(item) {
    if ((typeOf(item) === "doubledotteditem") && (item.data.left_dot > 0)){
      if (grammar.isHeadcornerOf(item.data.rule.lhs, that.data.nonterminal)) {
        for (var i = that.data.from; i <= item.data.from; i++) {
          for (var j = i; j <= item.data.from; j++) {
            var new_goal = itemFactory.createItem({
              'type': 'Goal',
              'nonterminal': item.data.rule.rhs[item.data.left_dot-1],
              'from': i,
              'to': j
            });
            nr_items_added += agenda.addItem(new_goal, chart);
            logger.debug("GoalItem.left_predict: " + that.id +", " + item.id + " |- " + new_goal.id);
          }
        }
      }
    }
  });
  logger.debug("Exit GoalItem.leftPredict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

GoalItem.prototype.rightPredict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter GoalItem.rightPredict: " + this.id);
  var items = chart.getItemsFrom(this.data.from);
  items.forEach(function(item) {
    if ((typeOf(item) === "doubledotteditem") && (item.data.right_dot < item.data.rule.rhs.length)){
      if (grammar.isHeadcornerOf(item.data.rule.lhs, that.data.nonterminal)) {
        for (var i = item.data.to; i <= that.data.to; i++) {
          for (var j = i; j <= that.data.to; j++) {
            var new_goal = itemFactory.createItem({
              'type': 'Goal',
              'nonterminal': item.data.rule.rhs[item.data.right_dot],
              'from': i,
              'to': j
            });
            nr_items_added += agenda.addItem(new_goal, chart);
            logger.debug("GoalItem.right_predict: " + that.id +", " + item.id + " |- " + new_goal.id);
          }
        }
      }
    }
  });
  logger.debug("Exit GoalItem.rightPredict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

GoalItem.prototype.leftComplete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter GoalItem.leftComplete: " + this.id);
  for (var j = this.data.from; j <= this.data.to; j++) {
    var items1 = chart.getItemsFromTo(this.data.from, j);
    var items2 = chart.getItemsFromTo(j, this.data.to);
    items1.forEach(function(item1) {
      if (typeOf(item1) === "cyk_item") {
        items2.forEach(function(item2) {
          if ((typeOf(item2) === "doubledotteditem") && (item2.data.left_dot > 0)) {
            logger.debug("GoalItem.left_complete: trying: " + that.id + ", " + item2.id  + ", " + item1.id);
            if ((item2.data.rule.rhs[item2.data.left_dot-1] === item1.data.rule.lhs) && 
                grammar.isHeadcornerOf(item2.data.rule.lhs, that.data.nonterminal)) {
              var new_item = item2.copy(grammar);
              new_item.recogniseLeft(item1, grammar);
              if (!global.config.UNIFICATION || (new_item.data.fs !== grammar.signature.typeLattice.top)) {
                nr_items_added += agenda.addItem(new_item, chart);
                logger.debug("GoalItem.left_complete: " + that.id +", " + 
                  item2.id + ", " + item1.id + " |- " + new_item.id);
              }
              else {
                logger.debug("GoalItem.left_complete: unification failed: " + 
                  that.id +", " + item2.id + ", " + item1.id + " |- " + new_item.id);
              }
            }
          }
        });
      }
    });
  }
  logger.debug("Exit GoalItem.leftComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

GoalItem.prototype.rightComplete = function (chart, agenda, grammar) {
  var nr_items_added = 0;
  var that = this;
  
  logger.debug("Enter GoalItem.rightComplete: " + this.id);
  for (var j = this.data.from; j <= this.data.to; j++) {
    var items1 = chart.getItemsFromTo(this.data.from, j);
    var items2 = chart.getItemsFromTo(j, this.data.to);
    items1.forEach(function(item1) {
      if (typeOf(item1) === "doubledotteditem") {
        items2.forEach(function(item2) {
          if (typeOf(item2) === "cyk_item") {
            logger.debug("GoalItem.right_complete: trying: " + that.id + ", " + item1.id  + ", " + item2.id);
            if ((item1.data.rule.rhs[item1.data.right_dot] === item2.data.rule.lhs) &&
                grammar.isHeadcornerOf(item1.data.rule.lhs, that.data.nonterminal)) {
              var new_item = item1.copy();
              new_item.recogniseRight(item2, grammar);
              if (!global.config.UNIFICATION || (new_item.data.fs !== grammar.signature.typeLattice.top)) {
                nr_items_added += agenda.addItem(new_item, chart);
                logger.debug("GoalItem.right_complete: " + that.id +", " + 
                  item1.id + ", " + item2.id + " |- " + new_item.id);
              }
              else {                
                logger.debug("GoalItem.right_complete: unification failed: " + 
                  that.id +", " + item1.id + ", " + item2.id);
              }
            }
          }
        });
      }
    });
  }
  logger.debug("Exit GoalItem.rightComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

module.exports = GoalItem;