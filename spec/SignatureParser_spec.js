/*
  Signature parser unit test
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
var logger = log4js.getLogger('SignatureParser');

var fs = require('fs');

var basedir = __dirname + '/data/SignatureParser/';
var signatureFile =       basedir + "Signature.txt";
var expectedResultsFile = basedir + "ExpectedResults.txt";

var LexiconParser = require('../lib/LexiconParser');
var SignatureParser = require('../lib/SignatureParser');

// For selecting tests from the lexicon
var ignoreFilter = true;
// A list of results that must be tested
var filterTests = ['TypeWithListOfCorefsInherit'];

var signature = null;

describe('Signature parser', function() {
  it('Should read a type lattice from a specification file', function() {
    var data = fs.readFileSync(signatureFile, 'utf8');
    signature = SignatureParser.parse(data, {
      implicitTypes: false
    });
    logger.error(signature);
  });

  it('Should correctly apply subsumption relations', function() {
    // Look up some types
    var bottom = signature.typeLattice.bottom;
    var agreement = signature.typeLattice.getTypeByName('agreement');
    var person = signature.typeLattice.getTypeByName('person');
    var first = signature.typeLattice.getTypeByName('first');
    var second = signature.typeLattice.getTypeByName('second');
    var third = signature.typeLattice.getTypeByName('third');

    // Tests for subsumption relation
    expect(bottom.subsumes(agreement)).toEqual(true);
    expect(agreement.subsumes(person)).toEqual(true);
    expect(bottom.subsumes(person)).toEqual(true);
    expect(person.subsumes(first)).toEqual(true);
    expect(person.subsumes(second)).toEqual(true);
    expect(person.subsumes(third)).toEqual(true);
  });

  it('Should correctly process inheritance of features from super types', function() {
    var data = fs.readFileSync(expectedResultsFile, 'utf8');
    var expectedResults = LexiconParser.parse(data, {
      signature: signature
    });

    Object.keys(expectedResults.lexicon).forEach(function(typeName) {
      if (ignoreFilter || (filterTests.indexOf(typeName) > -1)) {
        var type = signature.typeLattice.getTypeByName(typeName);
        if (type) {
          // Get the expected result from the lexicon
          var result = expectedResults.getWord(typeName);
          if (result) {
            var expectedFS = result[0];
            logger.debug('SignatureMechanisms_spec: testing ' + typeName);
            logger.debug('SignatureMechanisms_spec: fs of type: ' +
              type.fs.prettyPrint(signature, true));
            logger.debug('SignatureMechanisms_spec: expected fs: ' +
              expectedFS.prettyPrint(signature, true));
            expect(type.fs.isEqualTo(expectedFS, signature)).toEqual(true);
          }
        }
      }
    });
  });
});