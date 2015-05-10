/*
    Unit test for Earley, LeftCorner and HeadCorner parser
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

var settings = require('../config/Settings');
settings.UNIFICATION  = false;

var fs = require('fs');

var GrammarParser = require('../lib/GrammarParser');
var ParserFactoryClass = require('../index');
var parserFactory = new ParserFactoryClass();

var path = '/home/hugo/Workspace/chart-parsers/data/CFG/';
var math_grammar_file = path + 'math_expressions.txt';
var CYK_grammar_file = path + 'test_grammar_for_CYK.txt';

['Earley', 'LeftCorner', 'HeadCorner'].forEach(function(parserType) {
  describe(parserType, function() {

    beforeEach(function() {
      this.addMatchers({
        toBeArray: function(array) {
          this.message = function() {
            return "Expected " + this.actual + " to be array " + array + ".";
          };
          var arraysAreSame = function(x, y) {
            var arraysAreSame = (x.length === y.length);
            if (arraysAreSame) {
              for(var i; i < x.length; i++)
                 if(x[i] !== y[i])
                    arraysAreSame = false;
              return arraysAreSame;
            }
            else {
              return(false);
            }
          };
          return arraysAreSame(this.actual, array);
        }
      });
    }); 
    
    var grammar_text;
  
    // E -> E plus E
    // E -> E minus E
    // E -> E divide E
    // E -> E multiply E
    // E -> number  
    it('should read a text file', function(done) {
      fs.readFile(math_grammar_file, 'utf8', function (error, text) {
        expect(text).toBeDefined();
        grammar_text = text;
        done();
      });
    });
    
    var grammar;
    it('should parse the text file with the grammar', function() {
      grammar = GrammarParser.parse(grammar_text);
    });
    
    it('should parse a sentence', function() {
      //var parser = new ChartParser(grammar);
      var parser = parserFactory.createParser({grammar: grammar, type: parserType});
    
      // 2 + 3
      var tagged_sentence = [['2', 'number'],
                             ['+', 'plus'],
                             ['3', 'number']];
      var chart = parser.parse(tagged_sentence);
      var parse_trees = chart.parse_trees(parser.grammar.get_start_symbol(), 
        (parserType === 'HeadCorner') ? "cyk_item" : "earleyitem");
      expect(parse_trees).toBeArray(['E(E(number(2())),plus(+()),E(number(3())))']);
  
      // 2 + 3 * 4
      tagged_sentence = [['2', 'number'],
                         ['+', 'plus'],
                         ['3', 'number'],
                         ['*', 'multiply'],
                         ['4', 'number']];
      chart = parser.parse(tagged_sentence);
      parse_trees = chart.parse_trees(parser.grammar.get_start_symbol(), 
        (parserType === 'HeadCorner') ? "cyk_item" : "earleyitem");
      parse_trees.sort();
      expected_parse_trees = [
        'E(E(E(number(2())),plus(+()),E(number(3()))),multiply(*()),E(number(4())))',
        'E(E(number(2())),plus(+()),E(E(number(3())),multiply(*()),E(number(4()))))'
      ].sort();
      expect(parse_trees).toBeArray(expected_parse_trees);
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
      fs.readFile(CYK_grammar_file, 'utf8', function (error, text) {
        grammar_text = text;
        done();
      });
    });
    
    it('should parse the text file with the grammar', function() {
      grammar = GrammarParser.parse(grammar_text);
    });
    it('should parse a sentence', function() {
      parser = parserFactory.createParser({grammar: grammar, type: parserType});
      tagged_sentence = [['I', 'NP'],
                         ['saw', 'V'],
                         ['the', 'DET'],
                         ['man', 'N'],
                         ['with', 'P'],
                         ['the', 'DET'],
                         ['telescope', 'N']];
      chart = parser.parse(tagged_sentence);
      parse_trees = chart.parse_trees(parser.grammar.get_start_symbol(), 
        (parserType === 'HeadCorner') ? "cyk_item" : "earleyitem");
      parse_trees.sort();
      //expect(parse_trees.length).toEqual(2);
      //expect(parse_trees[0]).toEqual('S(NP(I()),VP(VP(V(saw()),NP(DET(the()),N(man()))),PP(P(with()),NP(DET(the()),N(telescope())))))');
      //expect(parse_trees[1]).toEqual('S(NP(I()),VP(V(saw()),NP(NP(DET(the()),N(man())),PP(P(with()),NP(DET(the()),N(telescope()))))))');
      expected_parse_trees = [
        'S(NP(I()),VP(VP(V(saw()),NP(DET(the()),N(man()))),PP(P(with()),NP(DET(the()),N(telescope())))))',
        'S(NP(I()),VP(V(saw()),NP(NP(DET(the()),N(man())),PP(P(with()),NP(DET(the()),N(telescope()))))))'
      ].sort();
      expect(parse_trees).toBeArray(expected_parse_trees);
    });
  });
});

