/*
    CYK item class for CYK and Head-Corner Parsing
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

// NB: CYK items are completely recognised items of the form [X, i, j] meaning ai...aj can be generated from X

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('CYK_Item');

var _ = require('underscore');
var typeOf = require('typeof');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

var TypedFeatureStructure = require('./TypedFeatureStructure');

function CYK_Item(parameters) {
  logger.debug("CYK_Item: " + parameters.rule + ", " + parameters.from + ", " + parameters.to);
  this.id = "CYK(" + parameters.rule.lhs + ", " + parameters.from + ", " + parameters.to + ")";
  this.name = parameters.rule.lhs;
  this.children = [];
  this.data = {};
  this.data.from = parameters.from;
  this.data.to = parameters.to;
  this.data.rule = parameters.rule;
  if (GLOBAL.config.UNIFICATION) {
    this.data.fs = parameters.fs;
  }
}

// Compares two CYK items and returns true if they are equal, false otherwise
CYK_Item.prototype.isEqualTo = function(item) {
  var equal = (this.name === item.name) &&
    _.isEqual(this.children, item.children) &&
    _.isEqual(this.data.rule, item.data.rule) &&
    (this.data.from === item.data.from) &&
    (this.data.to === item.data.to);
  if (GLOBAL.config.UNIFICATION) {
    equal = equal && this.data.fs.isEqualTo(item.data.fs);
  }
  return(equal);
};

CYK_Item.prototype.addChild = function(child) {
  logger.debug("CYK_Item.addChild: " + child.id);
  this.children.push(child);
};

CYK_Item.prototype.isComplete = function() {
  logger.debug("CYK_Item.isComplete: CYK items always are complete!");
  return(true);
};

CYK_Item.prototype.combineWithChart = function(chart, agenda, grammar) {
  var nr_items_added = 0;
  
  logger.debug("Enter CYK_Item.combineWithChart:" + this.id);
  nr_items_added += this.HCPredict(chart, agenda, grammar);
  nr_items_added += this.leftComplete(chart, agenda, grammar);
  nr_items_added += this.rightComplete(chart, agenda, grammar);
  logger.debug("Exit CYK_Item.combineWithChart: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.createHCItem = function(rule, goal_item, grammar) {
  var new_item = null;
  var new_fs = null;
  var X = rule.rhs[rule.head];
  
  if (grammar.isHeadcornerOf(rule.lhs, goal_item.data.nonterminal)) {
    if (GLOBAL.config.UNIFICATION) {
      // Create a feature structure from the CYK item with only the
      // substructure that matches the head of the rule
      new_fs = rule.fs.copy(grammar.signature);
      if (rule.fs.features[X]) {
        if (this.data.fs.features[X]) {
          var fs_with_feature_X = new TypedFeatureStructure({
            type: grammar.signature.typeLattice.constituent,
            signature: grammar.signature
          });
          fs_with_feature_X.addFeature(X, this.data.fs.features[X],
            grammar.signature);
          new_fs = new_fs.unify(fs_with_feature_X, grammar.signature);
        }
      }
      else {
        if (this.data.fs.features[X]) {
          new_fs.addFeature(X, this.data.fs.features[X], grammar.signature);
        }
      }
    }
    new_item = itemFactory.createItem({
      'type': 'DoubleDotted',
      'rule': rule, 
      'left_dot': rule.head, 
      'right_dot': rule.head+1, 
      'from': this.data.from, 
      'to': this.data.to,
      'fs': new_fs
    });
    new_item.children.push(this);
  }
  return(new_item);
};

// Adds double dotted items to the chart based on goal and CYK items
CYK_Item.prototype.HCPredict = function(chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  
  logger.debug("Enter CYK_Item.HCPredict: " + this.id);
  var items = chart.getItemsFromTo(this.data.from, this.data.to);
  items.forEach(function(item) {
    if (typeOf(item) === "goalitem") {
      // Create head-corner items
      var rules = grammar.getRulesWithHead(that.data.rule.lhs);
      rules.forEach(function(rule) {
        var new_item = that.createHCItem(rule, item, grammar);
        if (new_item) {
          nr_items_added += agenda.addItem(new_item, chart);
          logger.debug("CYK_Item.HCPredict: " + item.id +", " + that.id + " |- " + new_item.id);
        }
      });
    }
  });
  logger.debug("Exit CYK_Item.HCPredict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.leftComplete = function (chart, agenda, grammar) {
  var nr_items_added = 0;
  var that = this;
  
  logger.debug("Enter CYK_Item.leftComplete: " + this.id);
  var goals = chart.getItemsFrom(this.data.from);
  var doubledotteditems = chart.getItemsFrom(this.data.to);
  doubledotteditems.forEach(function(doubledotteditem) {
    if ((typeOf(doubledotteditem) === "doubledotteditem") && (doubledotteditem.data.left_dot > 0)) {
      goals.forEach(function(goal) {
        if (typeOf(goal) === "goalitem") {
          logger.debug("CYK_Item.leftComplete: trying" + goal.id + ", " + that.id + ", " + doubledotteditem);
          if ((doubledotteditem.data.rule.rhs[doubledotteditem.data.left_dot-1] === that.data.rule.lhs) &&
              grammar.isHeadcornerOf(doubledotteditem.data.rule.lhs, goal.data.nonterminal) ) {
            var new_item = doubledotteditem.copy(grammar);
            new_item.recogniseLeft(that, grammar);
            if (!GLOBAL.config.UNIFICATION || (new_item.data.fs != grammar.signature.typeLattice.top)) {
              nr_items_added += agenda.addItem(new_item, chart);
              logger.debug("CYK_Item.leftComplete: " + goal.id + ", " + that.id + ", " + doubledotteditem + " |- " + new_item.id);
            }
            else {
              logger.debug("CYK_Item.leftComplete: unification failed: " + goal.id + ", " + that.id + ", " + doubledotteditem);
            }
          }
        }
      });
    }
  });
  logger.debug("Exit CYK_Item.leftComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.rightComplete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter CYK_Item.rightComplete: " + this.id);
  var goals = chart.getItemsTo(this.data.to);
  var doubledotteditems = chart.getItemsTo(this.data.from);
  doubledotteditems.forEach(function(doubledotteditem) {
    if (typeOf(doubledotteditem) === "doubledotteditem") {
      goals.forEach(function(goal) {
        if (typeOf(goal) === "goalitem") {
          logger.debug("CYK_Item.rightComplete: trying: " + goal.id + ", " + doubledotteditem + ", " + that.id);
          if ((doubledotteditem.data.rule.rhs[doubledotteditem.data.right_dot] === that.data.rule.lhs) &&
              grammar.isHeadcornerOf(doubledotteditem.data.rule.lhs, goal.data.nonterminal) ) {
            var new_item = doubledotteditem.copy(grammar);
            new_item.recogniseRight(that, grammar);
            if (!GLOBAL.config.UNIFICATION || (new_item.data.fs !== grammar.signature.typeLattice.top)) {
              nr_items_added += agenda.addItem(new_item, chart);
              logger.debug("CYK_Item.rightComplete: " + goal.id + ", " + doubledotteditem + ", " + that.id + " |- " + new_item.id);
            }
            else {
              logger.debug("CYK_Item.rightComplete: unification failed: " + goal.id + ", " + doubledotteditem + ", " + that.id);
            }
          }
        }
      });
    }
  });
  logger.debug("Exit CYK_Item.rightComplete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.createParseTree = function() {
  logger.debug("Enter CYK_Item.createParseTree: " + this.id);
  var subtree = this.data.rule.lhs;
  if (this.children.length === 0) {
    subtree += "(" + this.data.rule.rhs + ")";
  }
  else {
    subtree += "(";
    var i;
    for (i = 0; i < this.children.length; i++) {
      subtree +=  this.children[i].createParseTree() + (i < this.children.length - 1 ? "," : "");
    }
    subtree += ")";
  }
  logger.debug("Exit CYK_Item.createParseTree: " + subtree);
  return(subtree);
};

module.exports = CYK_Item;
