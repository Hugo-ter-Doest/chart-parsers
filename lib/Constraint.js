/*
    Constraint class
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

  var log4js = require('log4js');
  var logger = log4js.getLogger();
  
  var settings = require('./Settings');
  
  logger.setLevel(settings.loggingLevels.Constraint);

// Constructor
// left_of and right_op are arrays of features (i.e. strings)
function Constraint(left_op, right_op) {
  this.left = left_op;
  this.right = right_op;
}

module.exports = Constraint;