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

// Split the sentence by space
exports.tokenize_sentence = function(sentence) {
  var s = sentence.split(/\s+/);
  return s;
};

// Initialises the chart
function allocate_chart(N) {
  var c = new Array(N + 1);
  c[0] = new Array(N);
  for (var i = 1; i <= N; ++i) {
    c[i] = new Array(N - (i - 1));
  }
  return c;
}

// Checks to see if index contains the first occurrence of value, use for filtering
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

// This is the actual CYK chart parser
// sentence is a tagged sentence of the form [[word, category], [word, category], ...]
exports.CYK_Chart_Parser = function(tagged_sentence, grammar) {
  var N = tagged_sentence.length;
  var C = allocate_chart(N);
  var i, j, k;
  
  console.log("Sentence length" + N);
  for (j = 0; j < N; ++j) {
    // The categories are used to fill the first row of the chart
    C[0][j] = [];
    C[0][j].push(tagged_sentence[j][1]);
  }
  
  for (i = 1; i < N; ++i) {
    for (j = 0; j < N - i; ++j) {
      for (k = i - 1; k >= 0; --k) {
        var nts1 = C[k][j];
        var nts2 = C[i - k - 1][j + k + 1];
        if (nts1 && nts2) {
          for (var ii = 0; ii < nts1.length; ++ii) {
            var nt1 = nts1[ii];
            for (var jj = 0; jj < nts2.length; ++jj) {
              var nt2 = nts2[jj];
              console.log("nt1: " + nt1);
              console.log("nt2: " + nt2);
              var rhss = grammar.left_hand_sides2(nt1, nt2);
              console.log(rhss);
              if (!C[i][j]) {
                C[i][j] = [];
              }
              C[i][j] = C[i][j].concat(rhss).filter( onlyUnique );
            }
          }
        }
      }
    }
  }
  
  console.log(C);
  return C;
};