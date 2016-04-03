/*
    Typed Feature Structure unit test
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
var logger = log4js.getLogger('TypedFeatureStructure');
var fs = require('fs');

var signatureParser = require('../lib/SignatureParser');
var lexiconParser = require('../lib/LexiconParser');
var TypeLattice = require('../lib/TypeLattice');
var Type = require('../lib/Type');

var base = './spec/data/TypedFeatureStructure/';

var signatureFile = base + 'TFS_Signature.txt';
var featureStructureFile = base + 'TFS_Lexicon.txt';

// For selecting tests from the lexicon
var ignoreFilter = true;
// A list of results that must be tested
var filterTests = ['wordWithListPhonstring1+wordWithListPhonstring1a'];

describe('Typed Feature Structure class', function() {
  var data = fs.readFileSync(signatureFile, 'utf8');
  var signature = signatureParser.parse(data);
  signature.typeLattice.implicit_types = true;

  data = fs.readFileSync(featureStructureFile, 'utf8');
  var lexicon = lexiconParser.parse(data, {signature: signature});

  it('Should unify and copy feature structures correctly',
    function () {
        Object.keys(lexicon.lexicon).forEach(function(word) {
          if (ignoreFilter || (filterTests.indexOf(word) > -1)) {
            if (word.indexOf('+') > -1) {
              // This is an expected result feature structure
              var words = word.split('+');
              var fss = lexicon.getWord(words[0]);
              var fs1 = null;
              if (fss) {
                fs1 = fss[0];
              }
              fss = lexicon.getWord(words[1]);
              var fs2 = null;
              if (fss) {
                fs2 = fss[0];
              }
              fss = lexicon.getWord(word);
              var expectedResult = null;
              if (fss) {
                expectedResult = fss[0];
              }
              if (fs1 && fs2 && expectedResult) {
                var unificationResult1 = fs1.unify(fs2, signature);
                var unificationResult2 = fs2.unify(fs1, signature);

                var copyResult1 = fs1.copy(signature);
                var copyResult2 = fs2.copy(signature);
                var copyResult3 = expectedResult.copy(signature);
                expect(unificationResult1.isEqualTo(expectedResult, signature)).toEqual(true);
                expect(unificationResult2.isEqualTo(expectedResult, signature)).toEqual(true);
                expect(copyResult1.isEqualTo(fs1, signature)).toEqual(true);
                expect(copyResult2.isEqualTo(fs2, signature)).toEqual(true);
                expect(copyResult3.isEqualTo(expectedResult, signature)).toEqual(true);

                logger.debug('TypedFeatureStructure_spec: fs1 ' + words[0] +
                  ' ->\n' + fs1.prettyPrint(signature, true));
                logger.debug('TypedFeatureStructure_spec: fs2 ' + words[1] +
                  ' ->\n' + fs2.prettyPrint(signature, true));
                logger.debug('TypedFeatureStructure_spec: fs1 + fs2:\n' +
                  unificationResult1.prettyPrint(signature, true));
                logger.debug('TypedFeatureStructure_spec: fs2 + fs1:\n' +
                  unificationResult2.prettyPrint(signature, true));
                logger.debug('TypedFeatureStructure_spec: expectedResult:\n' +
                  expectedResult.prettyPrint(signature, true));
              }
              else {
                logger.warn('TypedFeatureStructure_spec: test not specified' +
                  ' correctly in lexicon');
              }
            }
          }
        })
    });
});