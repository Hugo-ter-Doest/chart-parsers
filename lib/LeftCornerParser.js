/*
    Left Corner Chart Parser
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

// Algorithm based on the improved left-corner algorithm in 
// Improved Left-Corner Chart Parsing for Large Context-Free Grammars, Robert C. Moore
// IWPT2000

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('LeftCornerParser');

var EarleyChartParser = require('./EarleyParser');
var util = require('util');

// Constructor for the left-corner parser
function LeftCornerChartParser(grammar) {
  this.grammar = grammar;
  this.grammar.computeLCRelation();
}

util.inherits(LeftCornerChartParser, EarleyChartParser);

LeftCornerChartParser.prototype.parse = function(taggedSentence) {
  var that = this;

  this.initialise(taggedSentence);
  for (var i = 0; i <= this.N; i++) {
    var items_added;
    do {
      items_added = 0;
      var items = this.chart.getItemsTo(i);
      items.forEach(function(item) {
        items_added += item.completer(that.chart, that.grammar);
        items_added += item.LCPredictor(that.chart, that.grammar);
      });
    } while (items_added);
  }
  return this.chart;
};

module.exports = LeftCornerChartParser;