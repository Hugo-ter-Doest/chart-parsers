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
var typeLattice = new TypeLattice({
  implicit_types: false
});

var Type = require('../lib/Type');

describe('Type lattice', function() {
  var performance = new Type('performance', [typeLattice.bottom]);
  var play = new Type('play', [performance]);
  var concert = new Type('concert', [performance]);
  var musical = new Type('musical', [play, concert]);
  var ballet = new Type('ballet', [concert]);

  typeLattice.addType(performance);
  typeLattice.addType(play);
  typeLattice.addType(concert);
  typeLattice.addType(musical);
  typeLattice.addType(ballet);

  it('Should calculate least upper bounds correctly', function() {

    expect(performance.LUB(ballet, typeLattice)).toEqual(ballet);
    expect(ballet.LUB(performance, typeLattice)).toEqual(ballet);
    expect(performance.LUB(play, typeLattice)).toEqual(play);
    expect(play.LUB(performance, typeLattice)).toEqual(play);
    expect(play.LUB(concert, typeLattice)).toEqual(musical);
    expect(concert.LUB(play, typeLattice)).toEqual(musical);
    expect(ballet.LUB(musical, typeLattice)).toEqual(typeLattice.top);
    expect(musical.LUB(ballet, typeLattice)).toEqual(typeLattice.top);
  });
  
  it('Should determine subsumption correctly', function() {
    
    expect(typeLattice.bottom.subsumes(performance)).toEqual(true);
    expect(typeLattice.bottom.subsumes(play)).toEqual(true);
    expect(typeLattice.bottom.subsumes(concert)).toEqual(true);
    expect(typeLattice.bottom.subsumes(musical)).toEqual(true);
    expect(typeLattice.bottom.subsumes(ballet)).toEqual(true);
    
    expect(performance.subsumes(play)).toEqual(true);
    expect(performance.subsumes(concert)).toEqual(true);
    expect(play.subsumes(musical)).toEqual(true);
    expect(concert.subsumes(musical)).toEqual(true);
    expect(concert.subsumes(ballet)).toEqual(true);
    
    expect(performance.subsumes(ballet)).toEqual(true);
    expect(performance.subsumes(musical)).toEqual(true);
    
    expect(performance.subsumes(performance)).toEqual(true);
    expect(play.subsumes(play)).toEqual(true);
    expect(concert.subsumes(concert)).toEqual(true);
    expect(musical.subsumes(musical)).toEqual(true);
    expect(ballet.subsumes(ballet)).toEqual(true);
  });

});
