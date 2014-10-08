/*
    Agenda class
    Copyright (C) 2014 Hugo W.L. ter Doest

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

// Constructor
function Agenda() {
  this.agenda = [];
}

// Adds an item to the agenda
Agenda.prototype.add_item(item) {
  this.agenda.push(item);
}

// Removes an item from the agenda and returns it
Agenda.prototype.get_item() {
  return(this.agenda.pop());
}

// Checks if the agenda is empty
Agenda.prototype.is_non_empty() {
  return(this.agenda !== []);
}