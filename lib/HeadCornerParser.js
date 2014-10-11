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

var DoubleDottedItem = require('./DoubleDottedItem');
var Chart = require('./Chart');

HeadCornerChartParser.prototype.initialise = function(N) {  var that = this;
  var new_item;
  var nr_items_added = 0;

  console.log('Initialise chart and agenda');
  this.agenda = new Agenda();
  // Initialise chart
  this.chart = new Chart(N);
  // Add items for rules that have the start symbol as left-hand-side
  var rules = this.grammar.rules_with_lhs(this.grammar.get_start_symbol());
  rules.forEach(function(rule) {
    new_item = new DoubleDottedItem(rule, 0, 0, 0, 0);
    nr_items_added += that.chart.add_item(new_item);
  });
  // Add items for the tagged sentence
  for (var i = 0; i < N; i++) {
    // Add terminal item
    var term_item = new DoubleDottedItem({'lhs': tagged_sentence[i][0], 'rhs': ''}, 0, 1, i, i + 1);
    // Add tag item
    var tag_item = new DoubleDottedtem({'lhs': this.tagged_sentence[i][1], 'rhs': [this.tagged_sentence[i][0]]}, 0, 1, i, i + 1);
    tag_item.add_child(term_item);
    nr_items_added += this.chart.add_item(tag_item);
  }
  console.log('Initialise chart added ' + nr_items_added + ' items');
  return(nr_items_added);
};

// Pseudo code from http://doc.utwente.nl/77457/1/Verlinden93head.pdf :
// create initial chart and agenda
// while agenda is not empty
//   delete (arbitrarily chosen) item current from agenda
//   if current is not on the chart then
//     add current to chart
//     add all items that can be deduced by combining current with
//     the items already on the chart
HeadCornerChartParser.prototype.parse = function (tagged_sentence) {
  this.tagged_sentence = tagged_sentence;
  N = tagged_sentence.length;
  that = this;

  this.initialise(N);
  var items_added;
  while (this.agenda.is_non_empty()) {
    items_added = 0;
    var item = this.agenda.get_item();
    if (this.chart.add_item(item)) {
      items_added += item.combine_with_chart(this.chart, this.grammar);
    }
  }
  return this.chart;
};

// Constructor for the left-corner parser
function HeadCornerChartParser(grammar) {
  this.grammar = grammar;
  this.grammar.compute_hc_relation();
}

module.exports = HeadCornerChartParser;