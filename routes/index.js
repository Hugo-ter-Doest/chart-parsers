
/*
 * File: index.js
 * Last edit: 19-6-2014
 */
var express = require('express');
var app = express();

var ParserController = require('./ParserController');

app.get('/load_grammar', ParserController.choose_grammar_file);
app.post('/load_grammar', ParserController.submit_grammar);
app.get('/parse_sentence', ParserController.input_sentence);
app.post('/parse_sentence', ParserController.parse_sentence);

module.exports = app;