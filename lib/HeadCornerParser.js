/*
    Head-Corner Chart Parser
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

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('DEBUG');

var DoubleDottedItem = require('./DoubleDottedItem');
var GoalItem = require('./GoalItem');
var CYK_Item = require('./CYK_Item');
var Chart = require('./Chart');
var Agenda = require('./Agenda');

HeadCornerChartParser.prototype.initialise = function() {
  var that = this;
  var new_item;
  var nr_items_added = 0;

  logger.debug("Enter HeadCornerChartParser.initialise");
  // Initialise agenda
  this.agenda = new Agenda();
  // Initialise chart
  this.chart = new Chart(this.N);

  // Add goal items for the start symbol
  for (var i = 0; i <= this.N; i++) {
    for (var j = i; j <= this.N; j++) {
      new_item = new GoalItem(i, j, this.grammar.get_start_symbol());
      nr_items_added += this.agenda.add_item(new_item);
    }
  }

  // Add items for the tagged sentence
  for (i = 0; i < this.N; i++) {
    // Add terminal item
    var term_item = new CYK_Item(this.tagged_sentence[i][0], i, i + 1);
    // Add tag item
    var tag_item = new CYK_Item(this.tagged_sentence[i][1], i, i + 1);
    tag_item.add_child(term_item);
    nr_items_added += this.chart.add_item(tag_item);
  }
  logger.debug("Exit  HeadCornerChartParser.initialise: number of items added: " + nr_items_added);
  return(nr_items_added);
};

// Pseudo code of a chart parser:
// create initial chart and agenda
// while agenda is not empty
//   delete (arbitrarily chosen) item current from agenda
//   if current is not on the chart then
//     add current to chart
//     add all items that can be deduced by combining current with
//     the items already on the chart
HeadCornerChartParser.prototype.parse = function (tagged_sentence) {
  this.tagged_sentence = tagged_sentence;
  this.N = tagged_sentence.length;

  this.initialise();
  var items_added = 0;
  do {
    var item = this.agenda.get_item();
    if (item) {
      if (this.chart.add_item(item)) {
        items_added += item.combine_with_chart(this.chart, this.agenda, this.grammar);
      }
    }
  } while (item);
  return this.chart;
};

// Constructor for the left-corner parser
function HeadCornerChartParser(grammar) {
  this.grammar = grammar;
  this.grammar.compute_hc_relation();
}

module.exports = HeadCornerChartParser;