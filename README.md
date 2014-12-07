

# Introduction
This is a library of chart parsers for natural language processing containing the following flavours of chart parsing:
* Cocke Younger Kasama (CYK) Parser: an efficient purely bottom up chart parser for parsing with grammars in Chomsky Normal Form (CNF)
* Earley Parser:  a basic chart parser based on Earley's algorithm for parsing with context-free grammars
* Left-Corner Parser: a chart parser for parsing with top-down predictions based on the left-corner of production rules.
* Head-Corner Parser: a chart parser for parsing with top-down predictions based on the head of production rules.

All four parsers are created and called in the same way and return the same type of result, that is a chart with recognised items. In the next section it will be explained how grammars and parsers are used in general. After that each parser will be discussed in more detail.
 
# Context-Free Grammars
The grammar module reads context-free grammars from file, and offers some methods that are practical for parsing.

The syntax of production rules is as follows (in EBNF):
```
grammar =         { comment | production_rule }
production_rule = nonterminal, [ white_space ], "->", [ white_space ], [nonterminal_seq] , ["*" nonterminal "*" nonterminal_seq ]
nonterminal_seq = nonterminal, { whitespace, nonterminal }
nonterminal =     non_whitespace_char, { non_whitespace_char }
comment =         "//", { any_character }
```
Note the possibility of identifying one nonterminal as the head of the production rule. This information is used by the head-corner parser for predicting new partial parses.
Terminals are not allowed in the grammar, because we assume these to be recognised by a lexer and tagged with (lexical) categories. In the grammar these lexical categories can be seen as preterminals.
The grammar parsers also allows adding constraints to the production rules. This has been added for future extension of the parsers to unification-based parsing. Contraints may have two possible forms:
```
<nonterminal1 feature1 feature2> = atom
<nonterminal2 feature3 feature3> = <nonterminal3 feature4>
```

#Usage
A new grammar object is created as follows. 
```
var Grammar = require('.lib/GrammarParser');
// Read a grammar from file
var grammar = new GrammarParser.parse(grammar_text);
```
Methods of a grammar object are:
* <code>is_nonterminal(nt)</code>: checks if symbol <code>nt</code> is a nonterminal
* <code>rules_with_lhs(nt)</code>: returns all rules that have <code>nt</code> as left-hand-side
* <code>start_rule()</code>: returns the first production rule of the grammar; this is used by the Earley parser
* <code>get_start_symbol()</code>: returns the start symbol of the grammar; this is the left-hand-side nonterminal of the first production rule.
* <code>get_rules_with_rhs(nt1, nt2)</code>: looks up all production rules of wich the right-hand-side consists of two nonterminals <code>nt1</code> and <code>nt2</code>; this is used by the CYK parser.
* <code>is_leftcorner_of(A, B)</code> where <code>A</code> and <code>B</code> are nonterminals: returns true if <code>A</code> is left-corner of <code>B</code>.
* <code>is_headcorner_of(A, B)</code> where <code>A</code> and <code>B</code> are nonterminals: returns true if <code>A</code> is head-corner of <code>B</code>.

# Creating a chart parser
If a grammar had been loaded a parser can be created:
```
var GrammarParser = require('.lib/GrammarParser');
var EarleyParser = require('./lib/EarleyParser');

var grammar = GrammarParser.parse(grammar_text);
var parser = new Parser(grammar);
var tagged_sentence = [['I', 'NP'],
                       ['saw', 'V'],
                       ['the', 'DET'],
                       ['man', 'N'],
                       ['with', 'P'],
                       ['the', 'DET'],
                       ['telescope', 'N']];
var chart = parser.parse(tagged_sentence);
```
The structure and methods of the returned chart will be explained later.

# CYK Chart Parser
The CYK algorithm works with context-free grammars in Chomsky Normal Form (CNF). Production rules are of the form:
```
A -> B C
A -> a
```
where A, B and C are nonterminals and a is a terminal.

The CYK algorithm is as follows:
```
let the input be a string S consisting of n characters: a1 ... an.
let the grammar contain r nonterminal symbols R1 ... Rr.
This grammar contains the subset Rs which is the set of start symbols.
let P[n,n,r] be an array of booleans. Initialize all elements of P to false.
for each i = 1 to n
  for each unit production Rj -> ai
    set P[i,1,j] = true
for each i = 2 to n -- Length of span
  for each j = 1 to n-i+1 -- Start of span
    for each k = 1 to i-1 -- Partition of span
      for each production RA -> RB RC
        if P[j,k,B] and P[j+k,i-k,C] then set P[j,i,A] = true
if any of P[1,n,x] is true (x is iterated over the set s, where s are all the indices for Rs) then
  S is member of language
else
  S is not member of language
```
(source: Wikipedia, http://en.wikipedia.org/wiki/CYK_algorithm)

Below is a simple toy grammar that is in CNF:
```
S -> NP VP
NP -> DET N
NP -> NP PP
PP -> P NP
VP -> V NP
VP -> VP PP
DET -> the
NP -> I
N -> man
N -> telescope
P -> with
V -> saw
N -> cat
N -> dog
N -> pig
N -> hill
N -> park
N -> roof
P -> from
P -> on
P -> in
```
The language generated by this grammar contains a.o. "I saw the man with the telescope". Clearly, this grammar contains the lexicon as well. In our parser the lexicon is separated from the grammar. The parser expects a tokenized and tagged sentence as input. In this way we feed the output of a tagger into the parser.

## Usage
```
var CYK = require('./CYK');
var Grammar = require('./CFG');

// Read a grammar from file
var grammar = new Grammar(grammar_file_path);

// Create a parser
var parser = new CYK(grammar);

// Declare a tagged sentence. Format is adopted from the Brill part-of-speech tagger at https://github.com/neopunisher/pos-js.
var tagged_sentence = [['I', 'NP'],
                       ['saw', 'V'],
                       ['the', 'DET'],
                       ['man', 'N'],
                       ['with', 'P'],
                       ['the', 'DET'],
                       ['telescope', 'N']];

// Parse a sentence
var chart = parser.parse(tagged_sentence);
```

## Developing
* Chomsky Normal Form allows rules of the form A -> *empty* as well. Such rules cannot be loaded and I don't know if the parser can handle these.

# Earley Chart Parser
The Earley Chart Parser can parse all context-free languages and uses arbitrary context-free grammars.

The algorithm in pseudo code:
```
function EARLEY-PARSE(words, grammar)
    ENQUEUE((γ → •S, 0), chart[0])
    for i ← from 0 to LENGTH(words) do
        for each state in chart[i] do
            if INCOMPLETE?(state) then
                if NEXT-CAT(state) is a nonterminal then
                    PREDICTOR(state, i, grammar)         // non-terminal
                else do
                    SCANNER(state, i)                    // terminal
            else do
                COMPLETER(state, i)
        end
    end
    return chart
 
procedure PREDICTOR((A → α•B, i), j, grammar)
    for each (B → γ) in GRAMMAR-RULES-FOR(B, grammar) do
        ADD-TO-SET((B → •γ, j), chart[j])
    end
 
procedure SCANNER((A → α•B, i), j)
    if B ⊂ PARTS-OF-SPEECH(word[j]) then
        ADD-TO-SET((B → word[j], j), chart[j + 1])
    end
 
procedure COMPLETER((B → γ•, j), k)
    for each (A → α•Bβ, i) in chart[j] do
        ADD-TO-SET((A → αB•β, i), chart[k])
    end
```
(Source: Wikipedia, http://en.wikipedia.org/wiki/Earley_parser)

## Usage
The Earley parser takes a tagged sentence as argument. Example of a tagged sentence:
```
[['I', 'Pronoun'], ['saw', 'Verb'], ['the', 'Article'], ['man', 'Noun']]
```

And here is how to parse a sentence:
```
var EarleyChartParser = require('./EarleyChartParser');
var pos = require('pos');
var chart = EarleyChartParser.earley_parse(taggedWords);
```
The resulting chart is an array of length N+1, and each entry contains items of the form [rule, dot, from, children] where:
* rule is the production rule; it has two members: lhs for the left-hand-side of the rule, and rhs for the right-hand-side of the rule.
* dot is the position in the right hand side of the rule up to which it has been recognised. 
* from is the origin position pointing at the position in the sentence at which recognition of this rule began.
* children are the completed items that are used to recognise the current item

Based on the children of the completed items the parse(s) of a sentence can be constructed.
# Left-Corner Chart Parser

# Head-Corner Chart Parser
The algorithm of head corner parsing is based on the idea that the right-hand side of a production rule contains a head, a word or constituent that determines the syntactic type of the complete phrase. To make the algorithm work in each production rule the right hand-side must a symbol that is decorated as head, like this:
 ```
S -> DET *N*
```
## Algorithm
The parser uses the head-corners to make predict new partial parses. In fact, it uses the reflexive transitive closure of the head-corner relation to create new goal items and head-corner items. Head-corner parsing involves a complex administrative bookkeeping. The following types of items are used:
* CYK items are of the form <code>[A, i, j]</code> which means that nonterminal A can produce the sentence from position i to position j.
* Goal items are of the form <code>[l, r, A]</code> which means that the nonterminal is expected to be recognised somewhere between position l and r.
* Head-corner items are of the form <code>[S -> NP VP, i, j, l, r] </code> which means: 
** The right hand side of the production rule has been recognised from position i to j, and
** The recognised part of the production can generate the sentence from position l to r.

The algorithm makes use of a chart and an agenda. The algorithm itself is straighforward in that it takes an item from the agenda and tries to combine it with items on the chart. New items are added to the agenda. Algorithm in pseudo-code:
```
function HEAD-CORNER-PARSE(sentence)
  INITIALISE-CHART(sentence)
  INITIALISE-AGENDA(sentence)
  while agenda is not empty do
    delete item current from agenda
      if (current is not on chart) then
        ADD-TO-CHART(current)
        COMBINE-WITH-CHART(current)
      end
  end
  return chart
```

## Use
