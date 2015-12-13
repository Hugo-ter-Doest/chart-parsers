/*
    Lexicon class that maps words to feature structures
    Copyright (C) 2015 Hugo W.L. ter Doest

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

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('Lexicon');

// Constructor
function Lexicon(signature) {
  this.lexicon = {};
  // In the future we can load lexicons that only specify a category for a word.
  // For now this is always true
  this.hasFeatureStructures = true;
  this.signature = signature;
}

// Adds a word to the lexicon
// If the already exists the feature structure is added to the array
Lexicon.prototype.addWord = function(word, fs) {
  logger.debug('Lexicon.addWord: ' + word + '\n' + fs.prettyPrint());
  if (this.lexicon[word]) {
    this.lexicon[word].push(fs);
  }
  else {
    this.lexicon[word] = [fs];
  }
};

// Returns the size of the lexicon, i.e. the number of entries
Lexicon.prototype.size = function() {
  return(Object.keys(this.lexicon).length);
};

// Looks up the feature structures for word and returns it
// This is an array
Lexicon.prototype.getWord = function(word) {
  return(this.lexicon[word]);
};

// Tags a sentence with zero or more feature structures
// words is an array of strings
Lexicon.prototype.tagSentence= function(words) {
  var result = [];
  var that = this;
  words.forEach(function(word, index) {
    result[index] = [];
    result[index][0] = word;
    if (that.lexicon[word]) {
      that.lexicon[word].forEach(function(fs) {
        result[index].push(fs);
     });
   }
  });
  return(result);
};

Lexicon.prototype.prettyPrint = function() {
  var that = this;
  var result = '';
  Object.keys(this.lexicon).forEach(function(word) {
    that.lexicon[word].forEach(function(fs) {
      result += '[' + word + ']' + '->\n' + fs.prettyPrint() + '\n';
    });
  });
  return(result);
};

module.exports = Lexicon;