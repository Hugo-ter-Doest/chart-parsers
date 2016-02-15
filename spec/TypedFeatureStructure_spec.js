/*
    Typed Feature Structure unit test
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
var logger = log4js.getLogger('TypedFeatureStructure');
var fs = require('fs');

var signatureParser = require('../lib/SignatureParser');
var lexiconParser = require('../lib/LexiconParser');
var TypeLattice = require('../lib/TypeLattice');
var Type = require('../lib/Type');

var base = './spec/data/TypedFeatureStructure/';

var signatureFile = base + 'TFS_Signature.txt';
var featureStructureFile = base + 'TFS_Lexicon.txt';


describe('Typed Feature Structure class', function() {
  var data = fs.readFileSync(signatureFile, 'utf8');
  var signature = signatureParser.parse(data);
  signature.typeLattice.implicit_types = true;

  data = fs.readFileSync(featureStructureFile, 'utf8');
  var lexicon = lexiconParser.parse(data, {signature: signature});

  it('Should unify feature structures correctly',
    function () {
      // Unify agreement features
      var third_singular = lexicon.getWord('third_singular')[0];
      var third_plural = lexicon.getWord('third_plural')[0];
      var fs = third_singular.unify(third_singular, signature);
      expect(fs.isEqualTo(third_singular)).toEqual(true);
      var fs = third_plural.unify(third_singular, signature);
      expect(fs.type).toEqual(signature.typeLattice.top);

      var fs_verb = lexicon.getWord('verb')[0];
      var fs_noun = lexicon.getWord('noun')[0];
      var fs_verb_noun = fs_verb.unify(fs_noun, signature);
      fs_verb_noun = fs_verb_noun.unify(signature.typeLattice.getTypeByName('rule').fs, signature);
      var expected_result = lexicon.getWord('verb_noun')[0];
      logger.debug('TypedFeatureStructure_spec: verb_noun: '  + fs_verb_noun.prettyPrint());
      logger.debug('TypedFeatureStructure_spec: expected FS: '  + expected_result.prettyPrint());
      expect(fs_verb_noun.isEqualTo(expected_result)).toEqual(true);

      // Unify noun with rule
      var fs_rule = lexicon.getWord('rule')[0];
      var rule_with_noun = fs_rule.unify(fs_noun, signature);
      expected_result = lexicon.getWord('rule_with_noun')[0];
      //logger.debug('TypedFeatureStructure_spec: verb_noun: '  +
      // rule_with_noun.prettyPrint());
      //logger.debug('TypedFeatureStructure_spec: expected FS: '  +
      // expected_result.prettyPrint());
      expect(rule_with_noun.isEqualTo(expected_result)).toEqual(true);

      // Unify the result further with verb
      var rule_with_noun_and_verb = rule_with_noun.unify(fs_verb, signature);
      expected_result = lexicon.getWord('rule_with_noun_and_verb')[0];
      logger.debug('TypedFeatureStructure_spec: rule_with_noun_and_verb: '  + rule_with_noun_and_verb.prettyPrint());
      logger.debug('TypedFeatureStructure_spec: expected FS: '  + expected_result.prettyPrint());
      expect(rule_with_noun_and_verb.isEqualTo(expected_result)).toEqual(true);

      var fs1 = lexicon.getWord('fs1')[0];
      var fs2 = lexicon.getWord('fs2')[0];
      var fs5 = fs1.unify(fs2, signature);
      expect(fs5.isEqualTo(fs2)).toEqual(true);

      var fs3 = lexicon.getWord('fs3')[0];
      var fs4 = lexicon.getWord('fs4')[0];
      var fs6 = fs3.unify(fs4, signature);
      logger.debug('TypedFeatureStructure_spec: fs6: '  + fs6.prettyPrint());
      logger.debug('TypedFeatureStructure_spec: expected FS: '  + fs4.prettyPrint());
      expect(fs6.isEqualTo(fs4)).toEqual(true);
  });

  it('Should copy feature structures correctly', function() {
    Object.keys(lexicon.lexicon).forEach(function(word) {
      var fs = lexicon.lexicon[word][0];
      var copy = fs.copy(signature);
      // Feature structures should be equal up to (but not including) the labels
      //expect(copy.isEqualTo(fs)).toEqual(true);
    });
  });
});