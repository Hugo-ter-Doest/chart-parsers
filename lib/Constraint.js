/*
    Constraint class
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
var logger = log4js.getLogger('Constraint');
  
// Constructor
// left_of and right_op are arrays of features (i.e. strings)
// if isList is true then the right operand is a list of paths
function Constraint(left_op, right_op, isList) {
  this.left = left_op;
  this.right = right_op;
  this.isList = false;
  if (isList) {
    this.isList = isList;
  }
}

module.exports = Constraint;