
/*
    Glue between paths and modules
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

var express = require('express');
var app = express();

var ParserController = require('./ParserController');

app.get('/load_grammar', ParserController.choose_grammar_file);
app.post('/load_grammar', ParserController.submit_grammar);
app.get('/parse_sentence', ParserController.input_sentence);
app.post('/parse_sentence', ParserController.parse_sentence);

module.exports = app;