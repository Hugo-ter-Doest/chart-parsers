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

var FeatureStructureFactory = require('../lib/FeatureStructureFactory');
var featureStructureFactory = new FeatureStructureFactory();
var typeLatticeParser = require('../lib/TypeLatticeParser');
var TypeLattice = require('../lib/TypeLattice');
var Type = require('../lib/Type');

var typeLatticeFile = './spec/data/TypeLattice.txt';


describe('Typed Feature Structure class', function() {
  it('Should create a feature structure from a JSON object and unify these', function() {


    var data = fs.readFileSync(typeLatticeFile, 'utf8');
    var typeLattice = typeLatticeParser.parse(data);

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
      'literal': 'walks',
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
    console.log(fs_verb.prettyPrint());
    
    var fs_noun = featureStructureFactory.createFeatureStructure({'dag': dag_noun});
    console.log(fs_noun.prettyPrint());
    
    var fs_verb_noun = fs_verb.unify(fs_noun, typeLattice);
    console.log(fs_verb_noun.prettyPrint());
    
    var fs_rule = featureStructureFactory.createFeatureStructure({'dag': dag_rule});
    console.log(fs_rule.prettyPrint());

  });

  var type_lattice_2 = new TypeLattice({implicit_types: true});
  //var agreement = new Type('agreement', []);
  
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
    console.log(fs1.prettyPrint());
    //console.log(JSON.stringify(fs1, null, 2))
    var fs2 = featureStructureFactory.createFeatureStructure({'dag': dag2});
    console.log(JSON.stringify(fs2, null, 2));
    console.log(fs2.prettyPrint());
    var fs3 = fs1.unify(fs2, type_lattice_2);
    console.log(JSON.stringify(fs3, null, 2));
    console.log(fs3.prettyPrint());
  });
 
  it('Should create a feature structure from a JSON object and unify these', function() {
    featureStructureFactory.setTypeLattice(type_lattice_2);
    var fs3 = featureStructureFactory.createFeatureStructure({dag: dag3});
    console.log(JSON.stringify(fs3, null, 2));
    console.log(fs3.prettyPrint());
    var fs4 = featureStructureFactory.createFeatureStructure({dag: dag4});
    console.log(JSON.stringify(fs4, null, 2));
    console.log(fs4.prettyPrint());
    var fs5 = fs3.unify(fs4, type_lattice_2);
    console.log(fs5.prettyPrint(0));
    console.log(JSON.stringify(fs5, null, 2));
  });
  
  it('Should copy feature structures correctly', function() {
    featureStructureFactory.setTypeLattice(type_lattice_2);
    var fs3 = featureStructureFactory.createFeatureStructure({dag: dag3});
    var fs4 = fs3.copy(type_lattice_2);
    // Feature structures should be equal up to (but not including) the labels
    expect(fs3.isEqualTo(fs4)).toEqual(true);
    logger.debug(fs3.prettyPrint());
    logger.debug(fs4.prettyPrint());
  });
});