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

// Initialises the chart
function allocate_chart(N) {
  var c = new Array(N + 1);
  c[0] = new Array(N);
  for (var i = 1; i < N; ++i) {
    c[i] = new Array(N - (i - 1));
  }
  return c;
}

// This is the CYK chart parser
// sentence is a tagged sentence of the form [[word, category], [word, category], ...]
// grammar is an object as defined in CFG.js
exports.CYK_Chart_Parser = function(tagged_sentence, grammar) {
  var N = tagged_sentence.length;
  var C = allocate_chart(N);
  var i, j, k;
  var item;
  var matching_rules;
  
  console.log('IN: ' + JSON.stringify(tagged_sentence, null, 2));
  for (j = 0; j < N; ++j) {
    // The categories are used to fill the first row of the chart
    C[0][j] = {};
    item = new Item({'lhs': tagged_sentence[j][1], 'rhs': [tagged_sentence[j][0]]}, 1, j);
    C[0][j][item.id] = item;
  }
  
  for (i = 1; i < N; ++i) {
    for (j = 0; j < N - i; ++j) {
      for (k = i - 1; k >= 0; --k) {
        var items1 = (C[k][j]) ? Object.keys(C[k][j]) : [];
        var items2 = (C[i - k - 1][j + k + 1]) ? Object.keys(C[i - k - 1][j + k + 1]): [];
          items1.forEach(function(key_item1) {
            items2.forEach(function(key_item2) {
              matching_rules = grammar.get_rules_with_rhs(C[k][j][key_item1].data.rule.lhs, C[i - k - 1][j + k + 1][key_item2].data.rule.lhs);
              matching_rules.forEach(function(rule) {
                item = new Item(rule, 2, C[k][j][key_item1].data.from);
                if (!C[i][j]) {
                  C[i][j] = {};
                }
                C[i][j][item.id] = item;
              });
            });
          });
        }
      }
    }
  console.log('OUT: ' + JSON.stringify(C, null, 2));
  return C;
};