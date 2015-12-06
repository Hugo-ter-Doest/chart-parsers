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

var typeLatticeParser = require('../lib/TypeLatticeParser');
var lexiconParser = require('../lib/LexiconParser');
var TypeLattice = require('../lib/TypeLattice');
var Type = require('../lib/Type');

var base = '/home/hugo/Workspace/chart-parsers/spec/data/';

var typeLatticeFile = base + 'TypeLattice.txt';
var featureStructureFile = base + 'FeatureStructures.txt';


describe('Typed Feature Structure class', function() {
  var data = fs.readFileSync(typeLatticeFile, 'utf8');
  var typeLattice = typeLatticeParser.parse(data);
  typeLattice.implicit_types = true;

  data = fs.readFileSync(featureStructureFile, 'utf8');
  var lexicon = lexiconParser.parse(data, {'type_lattice': typeLattice});

  it('Should unify feature structures correctly',
    function () {

      var fs_verb = lexicon.getWord('verb')[0];
      var fs_noun = lexicon.getWord('noun')[0];
      var fs_verb_noun = fs_verb.unify(fs_noun, typeLattice);
      expect(fs_verb_noun).toEqual(typeLattice.getTypeByName('TOP'));

      // Unify agreement features
      var agreementFS = fs_verb.features['agreement'].unify(fs_noun.features['agreement'], typeLattice);
      expect(agreementFS.isEqualTo(fs_verb.features['agreement'])).toEqual(true);

      // Unify noun and verb with the rule
      var fs_rule = lexicon.getWord('rule')[0];
      fs_rule.features['np'] = fs_rule.features['np'].unify(fs_noun, typeLattice);
      fs_rule.features['vp'] = fs_rule.features['vp'].unify(fs_verb, typeLattice);

      var fs1 = lexicon.getWord('fs1')[0];
      var fs2 = lexicon.getWord('fs2')[0];
      var fs3 = lexicon.getWord('fs3')[0];
      var fs4 = lexicon.getWord('fs4')[0];

      var fs5 = fs1.unify(fs2, typeLattice);
      expect(fs5.isEqualTo(fs2)).toEqual(true);

      var fs6 = fs3.unify(fs4, typeLattice);
      expect(fs6.isEqualTo(fs4)).toEqual(true);

    });

  it('Should copy feature structures correctly', function() {
    var fs3 = lexicon.getWord('fs3')[0];
    var fs7 = fs3.copy(typeLattice);
    // Feature structures should be equal up to (but not including) the labels
    expect(fs7.isEqualTo(fs3)).toEqual(true);
  });
});