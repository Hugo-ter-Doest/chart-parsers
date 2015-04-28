/*
    PEG grammar unification grammars
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

{
  var settings = require('../config/Settings');

  var log4js = require('log4js');
  log4js.configure(settings.log4js_config);
  var logger = log4js.getLogger('GrammarParser');

  var Rule = require('./ProductionRule');
  var Constraint= require('./Constraint');
  var Grammar = require('./Grammar');

  // A type lattice must be passed in the options variable
  grammar = new Grammar();
  grammar.type_lattice = options.type_lattice;
}

grammar =
  rules: (S production_rule S) +
  {
    grammar.start_symbol = grammar.production_rules[0].lhs;
    return(grammar);
  }

production_rule =
  rule: rule cseq: constraint*
  {
    if (cseq.length) { // constraints specified
      rule.constraints = cseq;
      rule.process_constraints(cseq, grammar.type_lattice);
    }
    grammar.add_rule(rule);
  }

// A production rule must be specified on one line 
rule =
  lhs: nonterminal Arrow rhs_1: identifier_no_eol* head: (HeadIndicator identifier_no_eol HeadIndicator)? rhs_2: identifier_no_eol* (EOL / EOI)
  {
   var rhs = [];
   var head_pos = 0;

   rhs = rhs_1;
   if (head) {
     head_pos = rhs_1.length;
     rhs.push(head[1]);
   }
   rhs = rhs.concat(rhs_2);
   rhs.forEach(function(symbol) {
     grammar.symbols[symbol] = true;
   });
   var rule = new Rule(lhs, rhs, head_pos);
   grammar.nonterminals[lhs] = true;
   grammar.symbols[lhs] = true;
   if ((rule.rhs.length > 2) || (rule.rhs.length === 0)) {
     grammar.is_CNF = false;
   }
   logger.debug('GrammarParser: recognised rule: ' + JSON.stringify(rule));
   return(rule);
  }

nonterminal =
  nt:identifier S
  {
   return(nt);
  }

nonterminal_seq =
  identifier_seq

constraint =
  path: feature_path Equal atom: atom
  {
   var constraint = new Constraint(path, atom);
   return(constraint);
  }
  / path1: feature_path Equal path2: feature_path
  {
   var constraint = new Constraint(path1, path2);
   return(constraint);
  }

feature_path =
  PathOpen idseq:identifier_seq PathClose
  {
   return(idseq);
  }

atom =
  identifier

identifier_seq = 
  identifier*

identifier =
  characters: [a-zA-Z_0-9]+ S
  {
   var s = "";
   for (var i = 0; i < characters.length; i++) {
     s += characters[i];
   }
   return(s);
  }

identifier_no_eol =
  characters: [a-zA-Z_0-9$]+ S_no_eol
  {
   var s = "";
   for (var i = 0; i < characters.length; i++) {
     s += characters[i];
   }
   return(s);
  }

// Terminals
Arrow =
  "->" S_no_eol
PathOpen =
  "<" S
PathClose =
  ">" S
Equal = 
  "=" S
HeadIndicator = 
  "*" S_no_eol

// Blanks
EOL =
  '\r\n' / '\n' / '\r'
Comment =
  "\/\/" (!EOL .)* (EOL/EOI)
S =
  (' ' / '\t' / EOL / Comment)*
S_no_eol =
  (' ' / '\t' / Comment)*
EOI= 
  !.