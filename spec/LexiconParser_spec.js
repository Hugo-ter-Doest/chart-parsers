/*
    Lexicon Parser unit test
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
var logger = log4js.getLogger('LexiconParser');

var fs = require('fs');

var lexicon_parser = require('../lib/LexiconParser');
var type_lattice_parser = require('../lib/TypeLatticeParser');

var basedir = '/home/hugo/Workspace/chart-parsers/data/FS/';
var lexicon_file = basedir + 'example_lexicon.txt';
var type_lattice_file = basedir + 'type_lattice.txt';

describe('Lexicon parser', function() {
  it('Should parse a lexicon with type specification and words with feature structures', function() {
    // Read a file with type lattice
    fs.readFile(type_lattice_file, 'utf8', function (error, data) {
      if (error) {
        logger.debug(error);
      }
      // parse the type lattice
      var type_lattice = type_lattice_parser.parse(data);
      logger.debug(type_lattice.pretty_print());
      // Read a file with lexicon
      fs.readFile(lexicon_file, 'utf8', function (error, data) {
        if (error) {
          logger.debug(error);
        }
        // Parse the lexicon        
        // The type lattice is passed with an options variable
        var result = lexicon_parser.parse(data, {type_lattice: type_lattice});
      });
    });
  });
});