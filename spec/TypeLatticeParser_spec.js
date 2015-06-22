/*
    Type lattice parser unit test
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

var fs = require('fs');

var basedir = "/home/hugo/Workspace/chart-parsers/";
var type_lattice_file = basedir + "data/FS/type_lattice.txt";

var type_lattice_parser = require('../lib/TypeLatticeParser');

describe('Type lattice parser', function() {
  it('Should read type lattices from a specification file', function(done) {
    fs.readFile(type_lattice_file, 'utf8', function (error, data) {
      done();
      var type_lattice = type_lattice_parser.parse(data);
      var agreement = type_lattice.get_type_by_name('agreement');
      //Approp POS agreement agreement
      var POS = type_lattice.get_type_by_name('POS');
      expect(type_lattice.appropriate_function.isAppropriate(POS, 'agreement', agreement)).toEqual(true);
      //Approp agreement number plural
      var plural = type_lattice.get_type_by_name('plural');
      expect(type_lattice.appropriate_function.isAppropriate(agreement, 'number', plural)).toEqual(true);
      //Approp agreement number singular
      var singular = type_lattice.get_type_by_name('singular');
      expect(type_lattice.appropriate_function.isAppropriate(agreement, 'number', singular)).toEqual(true);
      //Approp agreement gender masculin
      var masculin = type_lattice.get_type_by_name('masculin');
      expect(type_lattice.appropriate_function.isAppropriate(agreement, 'gender', masculin)).toEqual(true);
      //Approp agreement gender feminin
      var feminin = type_lattice.get_type_by_name('feminin');
      expect(type_lattice.appropriate_function.isAppropriate(agreement, 'gender', feminin)).toEqual(true);
      //Approp agreement gender neutrum
      var neutrum = type_lattice.get_type_by_name('neutrum');
      expect(type_lattice.appropriate_function.isAppropriate(agreement, 'gender', neutrum)).toEqual(true);

      var bottom = type_lattice.get_type_by_name('BOTTOM');
      expect(agreement.subsumes(bottom)).toEqual(true);
      var person = type_lattice.get_type_by_name('person');
      expect(person.subsumes(agreement)).toEqual(true);
      expect(person.subsumes(bottom)).toEqual(true);
      var first = type_lattice.get_type_by_name('first');
      expect(first.subsumes(person)).toEqual(true);
      var second = type_lattice.get_type_by_name('second');
      expect(second.subsumes(person)).toEqual(true);
      var third = type_lattice.get_type_by_name('third');
      expect(third.subsumes(person)).toEqual(true);
    });
  });
});