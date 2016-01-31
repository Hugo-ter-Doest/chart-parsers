/*
  Signature parser unit test
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
var logger = log4js.getLogger('SignatureParser');

var fs = require('fs');

var basedir = "/home/hugo/Workspace/chart-parsers/spec/data/SignatureParser/";
var signatureFile = basedir + "SignatureMechanisms.txt";
var expectedResultsFile = basedir + "ExpectedResults.txt";

var SignatureParser = require('../lib/SignatureParser');
var LexiconParser = require('../lib/LexiconParser');

describe('Signature parser', function() {
  it('Should read type lattices from a specification file', function() {
    var data = fs.readFileSync(signatureFile, 'utf8');
    var signature = SignatureParser.parse(data, {
      implicitTypes: false
    });
    logger.error(signature);
    var data = fs.readFileSync(expectedResultsFile, 'utf8');
    var expectedResults = LexiconParser.parse(data, {
      signature: signature
    });

    ['TypeOne', 'TypeTwo', 'TypeThree', 'TypeFour'].forEach(function (typeName) {
      // Get the type
      var type = signature.typeLattice.getTypeByName(typeName);
      if (type) {
        var result = expectedResults.getWord(typeName);
        if (result) {
          expect(type.fs.isEqualTo(result[0])).toEqual(true);
        }
      }
    });
  });
});