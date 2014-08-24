

# CYK Chart Parser
The CYK algorithm works with context-free grammars in Chomsky Normal Form (CNF). Production rules are either of the form:
```
A -> B C
A -> a
```
where A, B and C are nonterminals and a is a terminal.
See http://en.wikipedia.org/wiki/CYK_algorithm for an explanation of the algorithm.

Below is a simple toy grammar:
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
The language generated by this grammar contains a.o. "I saw the man with the telescope". 

## Usage
```
var CYK = require('./CYK');
var Grammar = require('./ContextFreeGrammar');

// Load grammar file
Grammar.read_grammar_file(grammar_file_path, function(error) {
      // do something
    });

// Parse sentence
var sentence = 'I saw the man with the telescope';
chart = CYK.CYK_Chart_Parser(sentence);
```

## Developing
* Separate the lexicon from the grammar.
* Chomsky Normal Form entails rules of the form A -> *empty* as well. Such rules cannot be loaded and I don't know if the parser can handle these.

# Earley Chart Parser
The Earley Chart Parser can parse all context-free languages and uses arbitrary context-free grammars.
See http://en.wikipedia.org/wiki/Earley_parser for more information on the algorithm.

## Usage
The Earley parser takes a tagged sentence as argument. Example of a tagged sentence:
```
[['I', 'Pronoun'], ['saw', 'Verb'], ['the', 'Article'], ['man', 'Noun']]
```

And here is how to parse a sentence:
```
var EarleyChartParser = require('./EarleyChartParser');
var pos = require('pos');
chart = EarleyChartParser.earley_parse(taggedWords);
```
The resulting chart is an array of length N+1, and each entry contains items of the form [rule, dot, from, children] where:
* rule is the production rule; it has two members: lhs for the left-hand-side of the rule, and rhs for the right-hand-side of the rule.
* dot is the position in the right hand side of the rules up to which it has been recognised. 
* from is the origin position pointing at the position in the sentence at which recognition of this rule began.
* children are the completed items that are used to recognised the current item

Based on the children of the completed items the parse(s) of a sentence can be constructed.

## Development


# Tools

Created with [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   

Nodeclipse is free open-source project that grows with your contributions.
