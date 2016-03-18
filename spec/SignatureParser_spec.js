/*
  Signature parser unit test
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
var logger = log4js.getLogger('SignatureParser');

var fs = require('fs');

var basedir = "/Workspace/chart-parsers/spec/data/UnificationBasedChartParser/";
var signatureFile = basedir + "UG_Signature.txt";

var SignatureParser = require('../lib/SignatureParser');

describe('Signature parser', function() {
  it('Should read type lattices from a specification file', function() {
    var data = fs.readFileSync(signatureFile, 'utf8');
    var signature = SignatureParser.parse(data, {
      implicitTypes:false
    });
    logger.error(signature);
    var agreement = signature.typeLattice.getTypeByName('agreement');
    //Approp POS agreement agreement
    var POS = signature.typeLattice.getTypeByName('POS');
    //Approp agreement number plural
    var plural = signature.typeLattice.getTypeByName('plural');

    //Approp agreement number singular
    var singular = signature.typeLattice.getTypeByName('singular');
    //Approp agreement gender masculin
    var masculin = signature.typeLattice.getTypeByName('masculin');
    //Approp agreement gender feminin
    var feminin = signature.typeLattice.getTypeByName('feminin');
    //Approp agreement gender neutrum
    var neutrum = signature.typeLattice.getTypeByName('neutrum');

    //Tests for subsumption relation
    var bottom = signature.typeLattice.getTypeByName('BOTTOM');
    expect(bottom.subsumes(agreement)).toEqual(true);
    var person = signature.typeLattice.getTypeByName('person');
    expect(agreement.subsumes(person)).toEqual(true);
    expect(bottom.subsumes(person)).toEqual(true);
    var first = signature.typeLattice.getTypeByName('first');
    expect(person.subsumes(first)).toEqual(true);
    var second = signature.typeLattice.getTypeByName('second');
    expect(person.subsumes(second)).toEqual(true);
    var third = signature.typeLattice.getTypeByName('third');
    expect(person.subsumes(third)).toEqual(true);
  });
});