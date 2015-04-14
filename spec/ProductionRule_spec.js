/*
    Production rule unit test
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


var ProductionRule = require('../lib/ProductionRule');
var Constraint = require('../lib/Constraint');
var fs_base = '/home/hugo/Workspace/feature-structures/lib/';
var TypeLattice = require(fs_base + 'TypeLattice');

describe('ProductionRule', function() {

  it('should create a production rule with unification constraints', function() {
    var rule = new ProductionRule('S', ['NP', 'VP'], 1);
    var path2 = ['NP', 'agreement', 'number'];
    var path1 = ['VP', 'agreement', 'number'];
    var constraint1 = new Constraint(path1, path2);
    var path3 = ['S', 'head'];
    var path4 = ['VP', 'head'];
    var constraint2 = new Constraint(path3, path4);

    var type_lattice = new TypeLattice({});
    rule.process_constraints([constraint1, constraint2], type_lattice);
    
    //expect().toEqual(true);
    console.log('Feature structure: ' + JSON.stringify(rule.fs, null, 2));
  });
});