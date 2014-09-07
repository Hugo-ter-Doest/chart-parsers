/*
    Cocke Younger Kasami (CYK) chart parser
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

// Constructur for the chart
function Chart(N) {
  this.cells = new Array(N + 1);
  this.cells[0] = new Array(N);
  for (var i = 1; i < N; ++i) {
  this.cells[i] = new Array(N - (i - 1));
  }
}

Chart.prototype.add_item = function(i, j, item) {
  if (!this.cells[i][j]) {
    this.cells[i][j] = {};
  }
  this.cells[i][j][item.id] = item;
};

Chart.prototype.get_keys = function(i,j) {
  return(this.cells[i][j] ? Object.keys(this.cells[i][j]) : []);
};

Chart.prototype.get_item = function(i, j, key) {
  return(this.cells[i][j][key]);
}

// Constructor for parser object
// grammar is an object as defined in CFG.js
function CYK_ChartParser(grammar) {
  this.grammar = grammar;
  console.log("Constructor CYK_ChartParser" + JSON.stringify(this.grammar, null, 2));
}

// This is the CYK chart parser
// sentence is a tagged sentence of the form [[word, category], [word, category], ...]
CYK_ChartParser.prototype.parse = function(tagged_sentence) {
  var N = tagged_sentence.length;
  var C = new Chart(N);
  var i, j, k;
  var item;
  var matching_rules;
  var grammar = this.grammar;
  
  console.log('CYK_ChartParser.parse IN: ' + JSON.stringify(tagged_sentence, null, 2));
  for (j = 0; j < N; ++j) {
    // The categories are used to fill the first row of the chart
    //C[0][j] = {};
    item = new Item({'lhs': tagged_sentence[j][1], 'rhs': [tagged_sentence[j][0]]}, 1, j);
    C.add_item(0, j, item);
  }
  
  for (i = 1; i < N; ++i) {
    for (j = 0; j < N - i; ++j) {
      for (k = i - 1; k >= 0; --k) {
        var items1 = C.get_keys(k, j);
        var items2 = C.get_keys(i - k - 1, j + k + 1);
          items1.forEach(function(key_item1) {
            items2.forEach(function(key_item2) {
              var item1 = C.get_item(k, j, key_item1);
              var item2 = C.get_item(i - k - 1, j + k + 1, key_item2);
              matching_rules = grammar.get_rules_with_rhs(item1.data.rule.lhs, item2.data.rule.lhs);
              matching_rules.forEach(function(rule) {
                item = new Item(rule, 2, item1.data.from);
                item.children = [item1, item2];
                item.id += '(' + item1.id + item2.id + ')';
                C.add_item(i, j, item);
              });
            });
          });
        }
      }
    }
  console.log('CYK_ChartParser.parse OUT: ' + JSON.stringify(C, null, 2));
  return C;
};

module.exports = CYK_ChartParser;