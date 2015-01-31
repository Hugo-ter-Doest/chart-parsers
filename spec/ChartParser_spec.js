/*
    Unit test for LeftCornerParser.js and EarleyParser.js
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

var fs = require('fs');

var GrammarParser = require('../lib/GrammarParser');
var LeftCornerParser = require('../lib/LeftCornerParser');
var HeadCornerParser = require('../lib/HeadCornerParser');
var EarleyParser = require('../lib/EarleyParser');

function event_func(event_name, item) {
  console.log(event_name + ': ' + item.id);
}

[LeftCornerParser, EarleyParser].forEach(function(ChartParser) {
//[HeadCornerParser].forEach(function(ChartParser) {
  describe(ChartParser === LeftCornerParser ? 'LeftCornerParser' : 'EarleyParser', function() {
    var grammar_text;
  
  // E -> E plus E
  // E -> E minus E
  // E -> E divide E
  // E -> E multiply E
  // E -> number  
    it('should read a text file', function(done) {
      fs.readFile('data/math_expressions.txt', 'utf8', function (error, text) {
        expect(text).toBeDefined();
        grammar_text = text;
        console.log(grammar_text+"!");
        done();
      });
    });
    
    var grammar;
    it('should parse the text file with the grammar', function() {
      grammar = GrammarParser.parse(grammar_text);
    });
    
    it('should parse a sentence', function() {
      var parser = new ChartParser(grammar);
    
      // 2 + 3
      var tagged_sentence = [['2', 'number'],
                             ['+', 'plus'],
                             ['3', 'number']];
      var chart = parser.parse(tagged_sentence, event_func);
      var parse_trees = chart.parse_trees(grammar.get_start_symbol(), "earleyitem");
      expect(parse_trees.length).toEqual(1);
      expect(parse_trees[0]).toEqual('E(E(number(2())),plus(+()),E(number(3())))');
  
      // 2 + 3 * 4
      tagged_sentence = [['2', 'number'],
                         ['+', 'plus'],
                         ['3', 'number'],
                         ['*', 'multiply'],
                         ['4', 'number']];
      chart = parser.parse(tagged_sentence, event_func);
      parse_trees = chart.parse_trees(grammar.get_start_symbol(), "earleyitem");
      expect(parse_trees.length).toEqual(2);
      expect(parse_trees[0]).toEqual('E(E(E(number(2())),plus(+()),E(number(3()))),multiply(*()),E(number(4())))');
      expect(parse_trees[1]).toEqual('E(E(number(2())),plus(+()),E(E(number(3())),multiply(*()),E(number(4()))))');
    });
  
  
  // Grammar (in ../data/test_grammar_for_CYK.txt)
  //S  -> NP VP
  //NP -> DET N
  //NP -> NP PP
  //PP -> P NP
  //VP -> V NP
  //VP -> VP PP
  
  // Lexicon
  //DET -> the
  //NP -> I
  //N -> man
  //N -> telescope
  //P -> with
  //V -> saw
  //N -> cat
  //N -> dog
  //N -> pig
  //N -> hill
  //N -> park
  //N -> roof
  //P -> from
  //P -> on
  //P -> in
    it('should read a text file', function(done) {
      fs.readFile('data/test_grammar_for_CYK.txt', 'utf8', function (error, text) {
        grammar_text = text;
        done();
      });
    });
    
    it('should parse the text file with the grammar', function() {
      grammar = GrammarParser.parse(grammar_text);
      parser = new ChartParser(grammar);
      tagged_sentence = [['I', 'NP'],
                         ['saw', 'V'],
                         ['the', 'DET'],
                         ['man', 'N'],
                         ['with', 'P'],
                         ['the', 'DET'],
                         ['telescope', 'N']];
      chart = parser.parse(tagged_sentence, event_func);
      parse_trees = chart.parse_trees(grammar.get_start_symbol(), "earleyitem");
      
      expect(parse_trees.length).toEqual(2);
      expect(parse_trees[0]).toEqual('S(NP(I()),VP(VP(V(saw()),NP(DET(the()),N(man()))),PP(P(with()),NP(DET(the()),N(telescope())))))');
      expect(parse_trees[1]).toEqual('S(NP(I()),VP(V(saw()),NP(NP(DET(the()),N(man())),PP(P(with()),NP(DET(the()),N(telescope()))))))');
    });
  
  });
});