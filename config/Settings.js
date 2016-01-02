/*
    Settings module for chart parsers
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

var config = {};

// Separator used in AppropriateFunction to concatenate triples 
// (type, feature, type)
config.appropriateSeparator = ':';

// If true the chart parsers apply unification in parsing
// At completion steps feature structures are unified
config.UNIFICATION = true;

// A tagged sentence is a word followed bij a list of categories or a
// list of feature structures
config.LIST_OF_CATEGORIES = false;

// Feature path to lexical category of a feature structure: array of strings
// For HPSG
//config.pathToLexicalCategory = ['SYNSEM', 'LOC', 'CAT', 'HEAD'];
// For simple feature structures
// This is the default value. This item can be set through options of
// ParserFactory.createParser
config.pathToLexicalCategory = ['category'];

config.typeOfLexicalString = 'phonstring';

config.log4js_config = '/home/hugo/Workspace/chart-parsers/config/log4js.json';
//config.log4js_config = '/Workspace/chart-parsers/config/log4js.json';

GLOBAL.config = config;

module.exports = config;