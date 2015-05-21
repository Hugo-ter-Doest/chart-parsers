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

var FeatureStructureFactory = require('../lib/FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();
var TypeLattice = require('../lib/TypeLattice');
var Type = require('../lib/Type');

describe('Typed Feature Structure class', function() {
  it('Should create a feature structure from a JSON object and unify these', function() {

    var typeLattice = new TypeLattice({implicit_types: false});

    // first create a simple type hierarchy
    // based on  The Logic of Typed Feature Structures, Carpenter, 1992
    var agreement = new Type('agreement', []);

    typeLattice.add_type(agreement);

    var person = new Type('person', [agreement]);
    var first = new Type('first', [person]);
    var second = new Type('second', [person]);
    var third = new Type('third', [person]);

    typeLattice.add_type(person);
    typeLattice.add_type(first);
    typeLattice.add_type(second);
    typeLattice.add_type(third);

    var number = new Type('number', [agreement]);
    var singular = new Type('singular', [number]);
    var plural = new Type('plural', [number]);

    typeLattice.add_type(number);
    typeLattice.add_type(singular);
    typeLattice.add_type(plural);

    var gender = new Type('gender', [agreement]);
    var masculin = new Type('masculin', [gender]);
    var feminin = new Type('feminin', [gender]);
    var neutrum = new Type('neutrum', [gender]);

    typeLattice.add_type(gender);
    typeLattice.add_type(masculin);
    typeLattice.add_type(feminin);
    typeLattice.add_type(neutrum);

    var first_singular = new Type('first_singular', [first, singular]);
    var first_plural = new Type('first_plural', [first, plural]);
    var third_singular = new Type('third_singular', [third, singular]);
    var third_plural = new Type('third_plural', [third, plural]);

    typeLattice.add_type(first_singular);
    typeLattice.add_type(first_plural);
    typeLattice.add_type(third_singular);
    typeLattice.add_type(third_plural);

    var third_singular_masculin = new Type('third_singular_masculin', [third_singular, masculin]);
    var third_singular_feminin = new Type('third_singular_feminin', [third_singular, feminin]);
    var third_singular_neutrum = new Type('third_singular_neutrum', [third_singular, neutrum]);

    typeLattice.add_type(third_singular_masculin);
    typeLattice.add_type(third_singular_feminin);
    typeLattice.add_type(third_singular_neutrum);

    var part_of_speech = new Type('part_of_speech', []);
    var s = new Type('s', []);
    var noun = new Type('noun', [part_of_speech]);
    var verb = new Type('verb', [part_of_speech]);

    typeLattice.add_type(part_of_speech);
    typeLattice.add_type(s);
    typeLattice.add_type(noun);
    typeLattice.add_type(verb);

    var np = new Type('np', []);
    var vp = new Type('vp', []);
    var rule = new Type('rule', []);

    typeLattice.add_type(np);
    typeLattice.add_type(vp);
    typeLattice.add_type(rule);

    var man = new Type('man', []);
    var walks = new Type('walks', []);

    typeLattice.add_type(man);
    typeLattice.add_type(walks);

    var dag_verb = {
      'type': 'verb',
      'literal': 'walks',
      'agreement' : {
        'type': 'agreement',
        'person': 'third',
        'number': 'singular'
      }
    };

    var dag_noun = {
      'type': 'noun',
      'literal': 'man',
      'agreement': {
        'type': 'agreement',
        'person': 'third',
        'number': 'singular'
      }
    };

    var dag_rule = {
      'type': 'rule',
      's': 's',
      'np': {
        'type': 'np',
        'agreement: [1]': 'agreement'
      },
      'vp': {
        'type': 'vp',
        'agreement': '[1]'
      }
    };
  
    featureStructureFactory.setTypeLattice(typeLattice);
    var fs_verb = featureStructureFactory.createFeatureStructure({dag: dag_verb});
    console.log(fs_verb.pretty_print());
    
    var fs_noun = featureStructureFactory.createFeatureStructure({'dag': dag_noun});
    console.log(fs_noun.pretty_print());
    
    var fs_verb_noun = fs_verb.unify(fs_noun, typeLattice);
    console.log(fs_verb_noun.prettyPrint());
    
    var fs_rule = featureStructureFactory.createFeatureStructure({'dag': dag_rule});
    console.log(fs_rule.pretty_print());

  });

  var type_lattice_2 = new TypeLattice({implicit_types: true});
  var agreement = new Type('agreement', []);
  
  var dag1 = {
    'type': 'BOTTOM',
    'category': 'N',
    'agreement': {
      'type': 'agreement',
      'number': 'plural',
      'gender': 'male',
      'person': 'third'
    },
    'literal': 'kast'
  };

  var dag2 = {
    'type': 'BOTTOM',
    'category': 'N',
    'agreement: [1]': {
      'type': 'agreement',
      'number': 'plural',
      'gender': 'male',
      'person': 'third'
    },
    'subject': {
      'type': 'BOTTOM',
      'agreement': '[1]'
    },
    'literal': 'kast'
  };

  var dag3 = {
    'type': 'BOTTOM',
    'f': {
      'type': 'BOTTOM',
      'h': 'v',
      'k: [1]': 'w'
    },
    'g': {
      'k': '[1]'
    }
  };

  var dag4 = {
    'type': 'BOTTOM',
    'f: [2]': {
      'type': 'BOTTOM',
      'h': 'v',
      'k': 'w'
    },
    'g': '[2]'
  };
  
  it('Should create a feature structure from a JSON object and unify these', function() {
    featureStructureFactory.setTypeLattice(type_lattice_2);
    var fs1 = featureStructureFactory.createFeatureStructure({'dag': dag1});
    console.log(JSON.stringify(fs1, null, 2));
    console.log(fs1.pretty_print());
    //console.log(JSON.stringify(fs1, null, 2))
    var fs2 = featureStructureFactory.createFeatureStructure({'dag': dag2});
    console.log(JSON.stringify(fs2, null, 2));
    console.log(fs2.pretty_print());
    var fs3 = fs1.unify(fs2, type_lattice_2);
    console.log(JSON.stringify(fs3, null, 2));
    console.log(fs3.pretty_print());
  });
 
  it('Should create a feature structure from a JSON object and unify these', function() {
    featureStructureFactory.setTypeLattice(type_lattice_2);
    var fs3 = featureStructureFactory.createFeatureStructure({dag: dag3});
    console.log(JSON.stringify(fs3, null, 2));
    console.log(fs3.pretty_print());
    var fs4 = featureStructureFactory.createFeatureStructure({dag: dag4});
    console.log(JSON.stringify(fs4, null, 2));
    console.log(fs4.pretty_print());
    var fs5 = fs3.unify(fs4, type_lattice_2);
    console.log(fs5.pretty_print(0));
    console.log(JSON.stringify(fs5, null, 2));
  });
  
  it('Should copy feature structures correctly', function() {
    featureStructureFactory.setTypeLattice(type_lattice_2);
    var fs3 = featureStructureFactory.createFeatureStructure({dag: dag3});
    var fs4 = fs3.copy(type_lattice_2);
    // Feature structures should be equal up to the labels
    expect(fs3.is_equal_to(fs4)).toEqual(true);
    logger.debug(fs3.pretty_print());
    logger.debug(fs4.pretty_print());
  });
});