/*
    Lexicon Parser unit test
    Copyright (C) 2016 Hugo W.L. ter Doest

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

var lexiconParser = require('../lib/LexiconParser');
var signatureParser  = require('../lib/SignatureParser');

var basedir = './spec/data/LexiconParser/';
var lexiconFile = basedir +   'Lexicon.txt';
var signatureFile = basedir + 'Signature.txt';

describe('Lexicon parser', function() {
  var lexicon;
  var signature;
  it('Should parse a lexicon with type specification and words with feature' +
  ' structures', function() {
    // Read a file with type lattice
    fs.readFile(signatureFile, 'utf8', function (error, data) {
      if (error) {
        logger.debug(error);
      }
      // parse the type lattice
      signature = signatureParser.parse(data, {
        implicitTypes:false
      });
    });
  });

  it('Should parse a lexicon with type specification and words with feature' +
      ' structures', function(done) {
    // Read a file with lexicon
    fs.readFile(lexiconFile, 'utf8', function (error, data) {
      if (error) {
        logger.debug(error);
      }
      // Parse the lexicon        
      // The type lattice is passed with an options variable
      lexicon = lexiconParser.parse(data, {signature: signature});
      done();
      expect(lexicon.size()).toEqual(10);
    });
  });

});