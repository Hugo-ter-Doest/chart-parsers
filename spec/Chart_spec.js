/*
    Unit test for Chart.js using Jasmine
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

var typeOf = require('typeof');

var Chart = require('../lib/Chart.js');
var Item = require('../lib/EarleyItem.js');

describe('Chart', function() {
  var chart;
  var size = 6;
  
  it('should create an empty chart', function() {
    chart = new Chart(size);
    expect(chart.N).toEqual(size);
    expect(chart.outgoing_edges.length).toEqual(size + 1);
    expect(chart.incoming_edges.length).toEqual(size + 1);
    expect(typeOf(chart.incoming_edges)).toEqual('array');
    expect(typeOf(chart.outgoing_edges)).toEqual('array');
  });

  var i1 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 0, 0, 1);
  var i2 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 1, 1, 2);
  var i3 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 2, 3);
  var i4 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 0, 6);
  i4.set_children([i1, i2, i3]);

  it('should add items to the chart', function() {
    chart.add_item(i1);
    chart.add_item(i2);
    chart.add_item(i3);
    expect(chart.get_items_from_to(0, 1)).toEqual([i1]);
    expect(chart.get_items_from_to(1, 2)).toEqual([i2]);
    expect(chart.get_items_from_to(2, 3)).toEqual([i3]);
    expect(chart.get_items_from(0)).toEqual([i1]);
    expect(chart.get_items_from(1)).toEqual([i2]);
    expect(chart.get_items_from(2)).toEqual([i3]);
    expect(chart.get_items_to(1)).toEqual([i1]);
    expect(chart.nr_items_to(1)).toEqual(1);
    expect(chart.get_items_to(2)).toEqual([i2]);
    expect(chart.nr_items_to(2)).toEqual(1);
    expect(chart.get_items_to(3)).toEqual([i3]);
    expect(chart.nr_items_to(3)).toEqual(1);
    expect(chart.get_complete_items_from_to(2, 3)).toEqual([i3]);
    expect(chart.full_parse_items()).toEqual([]);
    chart.add_item(i4);
    expect(chart.get_complete_items_from_to(0, 6)).toEqual([i4]);
    expect(chart.full_parse_items('S')).toEqual([i4]);
    expect(chart.nr_of_items()).toEqual(4);
  });

  it('should generate parse trees from the chart', function() {
    expect(chart.parse_trees('S', "earleyitem")).toEqual(["S(S(NP,VP),S(NP,VP),S(NP,VP))"]);
  });
});