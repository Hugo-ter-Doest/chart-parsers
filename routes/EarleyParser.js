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

var Item = require('./Item');
var Chart = require('./Chart');
var ChartParser = require('./ChartParser');

function EarleyChartParser(grammar) {
  this.grammar = grammar;
}

EarleyChartParser.prototype = Object.create(ChartParser.prototype);

// Introduces new items for the next nonterminal to be recognised
EarleyChartParser.prototype.predictor = function(item) { 
  var that = this;
  var nr_items_added = 0;
  console.log("Predictor: " + item.id);

  if (item.is_incomplete() && this.grammar.is_nonterminal(item.data.rule.rhs[item.data.dot])) {
    // Get all rules with lhs B
    var rules_with_lhs_B = this.grammar.rules_with_lhs(item.data.rule.rhs[item.data.dot]);
    // for each rule with LHS B create an item
    rules_with_lhs_B.forEach(function(rule) {
      var newitem = new Item(rule, 0, item.data.to, item.data.to);
      nr_items_added += that.chart.add_item(newitem);
      console.log("Predictor: added item " + newitem.id);
    });
  }
  console.log('Predictor: added ' + nr_items_added + ' items');
  // Return number of items added
  return(nr_items_added);
};

module.exports = EarleyChartParser;