/*
    CYK item class for CYK and Head-Corner Parsing
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

// NB: CYK items are completely recognised items of the form [X, i, j] meaning ai...aj can be generated from X

var typeOf = require('typeof');
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('ERROR');

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

function CYK_Item(parameters) {
  logger.debug("CYK_Item: " + parameters.rule + ", " + parameters.from + ", " + parameters.to);
  this.id = "CYK(" + parameters.rule.lhs + ", " + parameters.from + ", " + parameters.to + ")";
  this.name = parameters.rule.lhs;
  this.children = [];
  this.data = {};
  this.data.from = parameters.from;
  this.data.to = parameters.to;
  this.data.rule = parameters.rule;
}

CYK_Item.prototype.add_child = function(child) {
  logger.debug("CYK_Item.add_child: " + child.id);
  this.children.push(child);
};

CYK_Item.prototype.is_complete = function() {
  logger.debug("CYK_Item.is_complete: CYK items always are complete!");
  return(true);
};

CYK_Item.prototype.combine_with_chart = function(chart, agenda, grammar) {
  var nr_items_added = 0;
  
  logger.debug("Enter CYK_Item.combine_with_chart:" + this.id);
  nr_items_added += this.hc_predict(chart, agenda, grammar);
  nr_items_added += this.left_complete(chart, agenda, grammar);
  nr_items_added += this.right_complete(chart, agenda, grammar);
  logger.debug("Exit CYK_Item.combine_with_chart: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Adds double dotted items to the chart based on goal and CYK items
CYK_Item.prototype.hc_predict = function(chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;
  
  logger.debug("Enter CYK_Item.hc_predict: " + this.id);
  var items = chart.get_items_from_to(this.data.from, this.data.to);
  items.forEach(function(item) {
    if (typeOf(item) === "goalitem") {
      // Create head-corner items
      var rules = grammar.get_rules_with_head(that.data.rule.lhs);
      rules.forEach(function(rule) {
        if (grammar.is_headcorner_of(rule.lhs, item.data.nonterminal)) {
          //var new_item = new DoubleDottedItem(rule, rule.head, rule.head+1, that.data.from, that.data.to);
          var new_item = itemFactory.createItem({
            'type': 'DoubleDotted',
            'rule': rule, 
            'left_dot': rule.head, 
            'right_dot': rule.head+1, 
            'from': that.data.from, 
            'to': that.data.to
          });
          new_item.children.push(that);
          nr_items_added += agenda.add_item(new_item, chart);
          logger.debug("CYK_Item.hc_predict: " + item.id +", " + that.id + " |- " + new_item.id);
        }
      });
    }
  });
  logger.debug("Exit CYK_Item.hc_predict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.left_complete = function (chart, agenda, grammar) {
  var nr_items_added = 0;
  var that = this;
  
  logger.debug("Enter CYK_Item.left_complete: " + this.id);
  var goals = chart.get_items_from(this.data.from);
  var doubledotteditems = chart.get_items_from(this.data.to);
  doubledotteditems.forEach(function(doubledotteditem) {
    if ((typeOf(doubledotteditem) === "doubledotteditem") && (doubledotteditem.data.left_dot > 0)) {
      goals.forEach(function(goal) {
        if (typeOf(goal) === "goalitem") {
          logger.debug("CYK_Item.left_complete: trying" + goal.id + ", " + that.id + ", " + doubledotteditem);
          if ((doubledotteditem.data.rule.rhs[doubledotteditem.data.left_dot-1] === that.data.rule.lhs) &&
              grammar.is_headcorner_of(doubledotteditem.data.rule.lhs, goal.data.nonterminal) ) {
            new_item = doubledotteditem.copy();
            new_item.recognise_left(that);
            nr_items_added += agenda.add_item(new_item, chart);
            logger.debug("CYK_Item.left_complete: " + goal.id + ", " + that.id + ", " + doubledotteditem + " |- " + new_item.id);
          }
        }
      });
    }
  });
  logger.debug("Exit CYK_Item.left_complete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.right_complete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("Enter CYK_Item.right_complete: " + this.id);
  var goals = chart.get_items_to(this.data.to);
  var doubledotteditems = chart.get_items_to(this.data.from);
  doubledotteditems.forEach(function(doubledotteditem) {
    if (typeOf(doubledotteditem) === "doubledotteditem") {
      goals.forEach(function(goal) {
        if (typeOf(goal) === "goalitem") {
          logger.debug("CYK_Item.right_complete: trying: " + goal.id + ", " + doubledotteditem + ", " + that.id);
          if ((doubledotteditem.data.rule.rhs[doubledotteditem.data.right_dot] === that.data.rule.lhs) &&
              grammar.is_headcorner_of(doubledotteditem.data.rule.lhs, goal.data.nonterminal) ) {
            new_item = doubledotteditem.copy();
            new_item.recognise_right(that);
            nr_items_added += agenda.add_item(new_item, chart);
            logger.debug("CYK_Item.right_complete: " + goal.id + ", " + doubledotteditem + ", " + that.id + " |- " + new_item.id);
          }
        }
      });
    }
  });
  logger.debug("Exit CYK_Item.right_complete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

CYK_Item.prototype.create_parse_tree = function() {
  logger.debug("Enter CYK_Item.create_parse_tree: " + this.id);
  var subtree = this.data.rule.lhs;
  if (this.children.length === 0) {
    subtree += "(" + this.data.rule.rhs + ")";
  }
  else {
    subtree += "(";
    var i;
    for (i = 0; i < this.children.length; i++) {
      subtree +=  this.children[i].create_parse_tree() + (i < this.children.length - 1 ? "," : "");
    }
    subtree += ")";
  }
  logger.debug("Exit CYK_Item.create_parse_tree: " + subtree);
  return(subtree);
};

module.exports = CYK_Item;
