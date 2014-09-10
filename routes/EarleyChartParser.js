/*
    Earley Chart Parser that specialises Chart Parser
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

var ChartParser = require('./ChartParser');
var Item = require('./Item');

// inheritance according to http://book.mixu.net/node/ch6.html:
function EarleyChartParser(grammar) {
  ChartParser.apply(this, Array.prototype.slice.call(arguments));
}

EarleyChartParser.prototype = new ChartParser();

// Introduces new items for the next nonterminal to be recognised
EarleyChartParser.prototype.predictor = function(item, j) { 
  console.log("Predictor: " + item.id + j);
  // remember the size of the set at position j 
  var nr_items = this.chart.nr_items_to(j);
  console.log("Nummber of items before: " + nr_items);
  // B is the nonterminal that should be predicted
  var B = item.data.rule.rhs[item.data.dot];
  // Get all rules with lhs B
  var rules_with_lhs_B = this.grammar.rules_with_lhs(B);
  // for each rule with LHS B create an item
  var that = this;
  rules_with_lhs_B.forEach(function(rule) {
      var newitem = new Item(rule, 0, j);
      that.chart.add_item(j, j, newitem);
      console.log("Predictor: added item " + newitem.id  + " to state " + j);
  });
  console.log("Nummber of items after: " + this.chart.nr_items_to(j));
  // Return number of items added
  return(this.chart.nr_items_to(j) - nr_items);
};

module.exports = EarleyChartParser;