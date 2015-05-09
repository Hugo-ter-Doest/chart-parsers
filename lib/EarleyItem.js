/*
    Single dotted items for Earley and Left-Corner parsing
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
var logger = log4js.getLogger('EarleyItem');

var _ = require('underscore');

var FeatureStructureFactory = require('./FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();

// Creates an item; dot is an index in the RHS of the rule, 
// from is the starting point in the sentence
// Data structure is prepared for InfoVis
function EarleyItem(parameters) {
  // A unique identifier is constructed from rule, dot and from
  this.id = "Earley(" + parameters.rule.lhs + "->" + parameters.rule.rhs + 
    ", " + parameters.dot + ", " + parameters.from + ", " + parameters.to +")";
  logger.debug("EarleyItem: " + this.id);
  this.name = parameters.rule.lhs;
  this.children = [];

  this.data = {};
  this.data.rule = parameters.rule;
  this.data.dot = parameters.dot;
  this.data.from = parameters.from;
  this.data.to = parameters.to;
  if (settings.UNIFICATION) {
    this.data.fs = parameters.fs;
  }
}

module.exports = EarleyItem;

var ItemFactoryClass = require('./ItemFactory');
var itemFactory = new ItemFactoryClass();

// Compares two items
EarleyItem.prototype.is_equal_to = function(item) {
  var equal = (this.name === item.name) &&
    _.isEqual(this.children, item.children) &&
    _.isEqual(this.data.rule, item.data.rule) &&
    (this.data.dot === item.data.dot) &&
    (this.data.from === item.data.from) &&
    (this.data.to === item.data.to);
  if (settings.UNIFICATION) {
    equal = equal && this.data.fs.is_equal_to(item.data.fs);
  }
  return(equal);
};

EarleyItem.prototype.set_children = function(children) {
  logger.debug("Enter EarleyItem.set_children: " + children);
  this.children = children;
  logger.debug("Exit EarleyItem.set_children");
};

EarleyItem.prototype.append_child = function(child) {
  logger.debug("Enter EarleyItem.append_child: " + child);
  this.children.push(child);
  logger.debug("Exit EarleyItem.append_child");
};

// Checks if an item is incomplete
EarleyItem.prototype.is_incomplete = function () {
  logger.debug("EarleyItem.is_incomplete: " + this.id + 
    (this.data.dot < this.data.rule.rhs.length));
  return(this.data.dot < this.data.rule.rhs.length);
};

// Checks if an item is complete
EarleyItem.prototype.is_complete = function () {
  logger.debug("EarleyItem.is complete: " + this.id + ' ' +
    (this.data.dot === this.data.rule.rhs.length));
  return(this.data.dot === this.data.rule.rhs.length);
};

// Introduces new items for the next nonterminal to be recognised
EarleyItem.prototype.predictor = function(chart, grammar) { 
  var that = this;
  var nr_items_added = 0;

  logger.debug("EarleyItem.predictor: " + that.id);
  var B = this.data.rule.rhs[this.data.dot];
  if (this.is_incomplete() && grammar.is_nonterminal(B)) {
    // Get all rules with lhs B
    var rules_with_lhs_B = grammar.rules_with_lhs(B);
    // for each rule with LHS B create an item
    rules_with_lhs_B.forEach(function(rule) {
      if (settings.UNIFICATION) {
        var new_fs = rule.fs.copy(grammar.type_lattice);
        if (new_fs.features[B]) {
          if (that.data.fs.features[B]) {
            // Create an fs with only feature B
            var fs_with_feature_B = featureStructureFactory.
              createFeatureStructure({type_lattice: grammar.type_lattice});
            fs_with_feature_B.add_feature(B, that.data.fs.features[B], grammar.type_lattice);
            logger.debug('EarleyItem.predictor: unifying: \n' + 
                new_fs.pretty_print() + '\nwith \n' + 
                fs_with_feature_B.pretty_print());
            new_fs = new_fs.
              unify(fs_with_feature_B, grammar.type_lattice);
          }
        }
        else {
          if (that.data.fs.features[B]) {
            new_fs.add_feature(B, that.data.fs.features[B], grammar.type_lattice);
          }
        }
        if (new_fs.features[B] === grammar.type_lattice.top) {
          logger.debug('EarleyItem.predictor: unification failed');
        }
        else {
          var newitem = itemFactory.createItem({
            'type': 'Earley',
            'rule': rule,
            'dot': 0,
            'from': that.data.to,
            'to': that.data.to,
            'fs': new_fs
          });
          nr_items_added += chart.add_item(newitem);
          logger.debug("EarleyItem.predictor: unification succeeded: (" + rule.lhs + ' -> ' + 
            rule.rhs.join(' ') + "), " + that.id + " |- " + newitem.id + '\n' + 
            newitem.data.fs.pretty_print());
        }
      }
      else { // no unification
        var newitem = itemFactory.createItem({
          'type': 'Earley',
          'rule': rule,
          'dot': 0,
          'from': that.data.to,
          'to': that.data.to
        });
        nr_items_added += chart.add_item(newitem);
        logger.debug("EarleyItem.predictor: (" + rule.lhs + ' -> ' + rule.rhs.join(' ') + "), " + that.id + " |- " + newitem.id);
      }
    });
  }
  logger.debug("EarleyItem.predictor: added " + nr_items_added + " items");
  // Return number of items added
  return(nr_items_added);
};

// LC method is based on the improved left-corner algorithm in 
// Improved Left-Corner Chart Parsing for Large Context-Free Grammars, Robert C. Moore
// IWPT2000
// Predictor based on rule 4a on page 5
EarleyItem.prototype.lc_predictor = function(chart, grammar) {
  that = this;
  var nr_items_added = 0;

  logger.debug("EarleyItem.lc_predictor: " + this.id);
  if (this.is_complete()) {
    // Get the productions rules that have the LHS of item as left-most daughter
    var B = this.data.rule.lhs;
    grammar.rules_with_leftmost_daughter(B).forEach(function(rule) {
      // Get the items that end at the given item
      chart.get_items_to(that.data.from).forEach(function(item2) {
        if (item2.is_incomplete() && 
            grammar.is_leftcorner_of(rule.lhs, item2.data.rule.rhs[item2.data.dot])) {
          if (settings.UNIFICATION) {
            var new_fs = rule.fs.copy(grammar.type_lattice);
            if (new_fs.features[B]) {
              if (that.data.fs.features[B]) {
                // Create an fs with only feature B
                var fs_with_feature_B = featureStructureFactory.
                  createFeatureStructure({type_lattice: grammar.type_lattice});
                fs_with_feature_B.add_feature(B, that.data.fs.features[B], grammar.type_lattice);
                new_fs = rule.fs.unify(fs_with_feature_B, grammar.type_lattice);
              }
            }
            else {
              if (that.data.fs.features[B]) {
                new_fs.add_feature(B, that.data.fs.features[B], grammar.type_lattice);
              }
            }
            var newitem = itemFactory.createItem({
              'type': 'Earley',
              'rule': rule,
              'dot': 1,
              'from': that.data.from,
              'to': that.data.to,
              'fs': new_fs
            });
          }
          else {
            var newitem = itemFactory.createItem({
              'type': 'Earley',
              'rule': rule,
              'dot': 1,
              'from': that.data.from,
              'to': that.data.to
            });
          }
          newitem.append_child(that);
          nr_items_added += chart.add_item(newitem);
          logger.debug("EarleyItem.lc_predictor: (" + rule.lhs + ' -> ' + 
            rule.rhs.join(' ') + "), " + that.id + ", " + item2.id + " |- " + newitem.id);
        }
      });
    });
  }
  logger.debug("EarleyItem.lc_predictor: added " + nr_items_added + " items");
  return(nr_items_added);
};

// item is complete
// Shifts the dot to the right for items in chart[k]
// If unification is applied unifies feature structures
EarleyItem.prototype.completer = function(chart, grammar) {
  var that = this;
  var nr_items_added = 0;

  logger.debug("EarleyItem.completer: " + this.id);
  if (this.is_complete()) {
    var items = chart.get_items_to(this.data.from);
    items.forEach(function(item2) {
      if (item2.is_incomplete() && 
          (that.data.rule.lhs === item2.data.rule.rhs[item2.data.dot])) {
        var B = that.data.rule.lhs;
        var new_item = null;
        if (settings.UNIFICATION) {
          // unify the feature structure of the next RHS symbol with the 
          // feature structure of the LHS symbol of the complete item
          var new_fs = item2.data.fs.copy(grammar.type_lattice);
          if (new_fs.features[B]) {
            if (that.data.fs.features[B]) {
              // Create an fs with only feature B
              var fs_with_feature_B = featureStructureFactory.
                createFeatureStructure({type_lattice: grammar.type_lattice});
              fs_with_feature_B.add_feature(B, that.data.fs.features[B], grammar.type_lattice);
              logger.debug('EarleyItem.completer: unifying: \n' + 
                new_fs.pretty_print() + '\nwith \n' + 
                fs_with_feature_B.pretty_print());
              new_fs = new_fs.unify(fs_with_feature_B, grammar.type_lattice);
            }
          }
          else {
            // No constraints for this RHS symbol -> 
            // The feature structure equals the feature structure of the 
            // recognised item
            if (that.data.fs.features[B]) {
              new_fs = new_fs.add_feature(B, that.data.fs.features[B], grammar.type_lattice);
            }
          }
          if (new_fs === grammar.type_lattice.top) {
            logger.debug('EarleyItem.completer: unification failed');
          }
          else {
            new_item = itemFactory.createItem({
              'type': 'Earley',
              'rule': item2.data.rule,
              'dot': item2.data.dot + 1,
              'from': item2.data.from,
              'to': that.data.to,
              'fs': new_fs
            });
            logger.debug("EarleyItem.completer: unification succeeded: " + that.id + ", " + item2.id + 
              " |- " + new_item.id + '\n' + new_fs.pretty_print());
          }
        }
        else {
          new_item = itemFactory.createItem({
            'type': 'Earley',
            'rule': item2.data.rule,
            'dot': item2.data.dot + 1,
            'from': item2.data.from,
            'to': that.data.to
          });
          logger.debug("EarleyItem.completer: " + that.id + ", " + item2.id + 
            " |- " + new_item.id);
        }
        if (new_item) {
          // Make a copy of the children of item2, otherwise two items refer to the same set of children
          new_item.children = item2.children.slice();
          new_item.append_child(that);
          nr_items_added += chart.add_item(new_item);
        }
      }
    });
  }
  logger.debug("EarleyItem.completer: added " + nr_items_added + " items");
  return(nr_items_added);
};

// Creates a textual nested representation of the parse tree using braces.
EarleyItem.prototype.create_parse_tree = function() {
  logger.debug("Enter EarleyItem.create_parse_tree: " + this.id);
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
  logger.debug("Exit EarleyItem.create_parse_tree: " + subtree);
  return(subtree);
};

EarleyItem.prototype.pretty_print = function() {
  var result = this.id + '\n';
  result += this.create_parse_tree() + '\n';
  result += this.data.fs.pretty_print();
  return(result);
};
