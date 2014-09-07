/*
    Left-corner parser
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

var Chart = require('Chart');
var Item = require('Item');

LeftCornerParser.prototype.scanner = function() {
  
};

LeftCornerParser.prototype.completer = function() {
  
};

LeftCornerParser.prototype.lc_predictor = function() {
  
};

LeftCornerParser.prototype.initialise_chart = function() {
  var production_rules = this.grammar.rules_with_lhs(this.grammar.get_start_symbol());
  production_rules.forEach(function(rule) {
    var item = new Item(rule, 0, 0);
    this.chart.add_item(0, 0, item);
  });
};

// Constructor of the LC parser
function LeftCornerParser(grammar) {
  this.grammar = grammar;
  this.grammar.compute_lc_relation;
}

LeftCornerParser.prototype.parse = function(tagged_sentence) {
  var N = tagged_sentence.length;
  this.chart = new Chart(N);
  this.tagged_sentence = tagged_sentence;
  var nr_items_added;
  
  this.initialise_chart();
  do {
    nr_items_added = 0;
    nr_items_added += this.completer();
    nr_items_added += this.scanner();
    nr_items_added += this.lc_predictor();
  } while (nr_items_added > 0);
  return(this.chart)
};

module.exports = LeftCornerParser;