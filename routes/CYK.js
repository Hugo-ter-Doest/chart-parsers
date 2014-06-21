/**
 * File: CYK.js
 * Last edit: 19-6-2014
 */

var Grammar = require('./Grammar');

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
exports.CYK_Chart_Parser = function(sentence) {
  var N = sentence.length;
  var C = allocate_chart(N);
  var i, j, k;
  
  for (j = 0; j < N; ++j) {
    C[0][j] = Grammar.left_hand_sides(sentence[j]);
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
              var rhss = Grammar.left_hand_sides2(nt1, nt2);
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