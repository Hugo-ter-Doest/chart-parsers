/*
    Type lattice unit test
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


var TypeLattice = require('../lib/TypeLattice');
var typeLattice = new TypeLattice({implicit_types: false});

var Type = require('../lib/Type');

describe('Type lattice', function() {
  var performance = new Type('performance', [typeLattice.bottom]);
  var play = new Type('play', [performance]);
  var concert = new Type('concert', [performance]);
  var musical = new Type('musical', [play, concert]);
  var ballet = new Type('ballet', [concert]);

  typeLattice.add_type(performance);
  typeLattice.add_type(play);
  typeLattice.add_type(concert);
  typeLattice.add_type(musical);
  typeLattice.add_type(ballet);

  it('Should calculate least upper bounds correctly', function() {

    expect(performance.lub(ballet, typeLattice)).toEqual(ballet);
    expect(ballet.lub(performance, typeLattice)).toEqual(ballet);
    expect(performance.lub(play, typeLattice)).toEqual(play);
    expect(play.lub(performance, typeLattice)).toEqual(play);
    expect(play.lub(concert, typeLattice)).toEqual(musical);
    expect(concert.lub(play, typeLattice)).toEqual(musical);
    expect(ballet.lub(musical, typeLattice)).toEqual(typeLattice.top);
    expect(musical.lub(ballet, typeLattice)).toEqual(typeLattice.top);
  });
  
  it('Should determine subsumption correctly', function() {
    
    expect(performance.subsumes(typeLattice.bottom)).toEqual(true);
    expect(play.subsumes(typeLattice.bottom)).toEqual(true);
    expect(concert.subsumes(typeLattice.bottom)).toEqual(true);
    expect(musical.subsumes(typeLattice.bottom)).toEqual(true);
    expect(ballet.subsumes(typeLattice.bottom)).toEqual(true);
    
    expect(play.subsumes(performance)).toEqual(true);
    expect(concert.subsumes(performance)).toEqual(true);
    expect(musical.subsumes(play)).toEqual(true);
    expect(musical.subsumes(concert)).toEqual(true);
    expect(ballet.subsumes(concert)).toEqual(true);
    
    expect(ballet.subsumes(performance)).toEqual(true);
    expect(musical.subsumes(performance)).toEqual(true);
    
    expect(performance.subsumes(performance)).toEqual(true);
    expect(play.subsumes(play)).toEqual(true);
    expect(concert.subsumes(concert)).toEqual(true);
    expect(musical.subsumes(musical)).toEqual(true);
    expect(ballet.subsumes(ballet)).toEqual(true);
  });

});
