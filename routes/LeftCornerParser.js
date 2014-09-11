/*
    Left Corner Chart Parser that specialises Chart Parser
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

var Chart = require('./Chart');
var Item = require('Item');

// Constructur for the left-corner parser
function LeftCornerChartParser(grammar) {
  this.grammar = grammar;
}

LeftCornerChartParser.prototype.initialise = function(N) {
  // Initialise chart
  this.chart = new Chart(N);
  // Add items for rules that have the start symbol as left-hand-side
  
};

LeftCornerChartParser.prototype.completer = function() {
  
};

LeftCornerChartParser.prototype.scanner = function() {
  
};

LeftCornerChartParser.prototype.lc_predictor = function() {
  
};

LeftCornerChartParser.prototype.lc_predictor_scanner = function() {
  
};

LeftCornerChartParser.prototype.parse = function(tagged_sentence) {
  
  N = tagged_sentence.length;
  this.initialise(n);
  
  var i;
  for (i = 0; i <= N; i++) {
    var items_added = 0;
    do {
      items_added += scanner(i);
      items_added += completer(i);
      items_added += lc_predictor(i);
      items_added += lc_predictor_scanner(i);
    } while (items_added);
  }
  return this.chart;
};

module.exports = LeftCornerChartParser;