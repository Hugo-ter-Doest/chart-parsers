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

var ItemFactoryClass = require('../lib/ItemFactory');
var itemFactory = new ItemFactoryClass();


describe('Chart', function() {
  var chart;
  var size = 6;
  
  it('should create an empty chart', function() {
    function event_func(event_name, item) {
      //console.log(item.id);
    }
    chart = new Chart(size, event_func);
    expect(chart.N).toEqual(size);
    expect(chart.outgoing_edges.length).toEqual(size + 1);
    expect(chart.incoming_edges.length).toEqual(size + 1);
    expect(typeOf(chart.incoming_edges)).toEqual('array');
    expect(typeOf(chart.outgoing_edges)).toEqual('array');
  });

  //var i1 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 0, 0, 1);
  var i1 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 0,
    'from': 0,
    'to': 1
  });
  //var i2 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 1, 1, 2);
  var i2 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 1,
    'from': 1,
    'to': 2
  });
  //var i3 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 2, 3);
  var i3 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 2,
    'from': 2,
    'to': 3
  });
  //var i4 = new Item({'lhs': 'S', 'rhs': ['NP', 'VP']}, 2, 0, 6);
  var i4 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 2,
    'from': 0,
    'to': 6
  });
  i4.setChildren([i1, i2, i3]);

  it('should add items to the chart', function() {
    chart.addItem(i1);
    chart.addItem(i2);
    chart.addItem(i3);
    expect(chart.getItemsFromTo(0, 1)).toEqual([i1]);
    expect(chart.getItemsFromTo(1, 2)).toEqual([i2]);
    expect(chart.getItemsFromTo(2, 3)).toEqual([i3]);
    expect(chart.getItemsFrom(0)).toEqual([i1]);
    expect(chart.getItemsFrom(1)).toEqual([i2]);
    expect(chart.getItemsFrom(2)).toEqual([i3]);
    expect(chart.getItemsTo(1)).toEqual([i1]);
    expect(chart.nrItemsTo(1)).toEqual(1);
    expect(chart.getItemsTo(2)).toEqual([i2]);
    expect(chart.nrItemsTo(2)).toEqual(1);
    expect(chart.getItemsTo(3)).toEqual([i3]);
    expect(chart.nrItemsTo(3)).toEqual(1);
    expect(chart.getCompleteItemsFromTo(2, 3)).toEqual([i3]);
    expect(chart.fullParseItems('S', 'earleyitem')).toEqual([]);
    chart.addItem(i4);
    expect(chart.getCompleteItemsFromTo(0, 6)).toEqual([i4]);
    expect(chart.fullParseItems('S', 'earleyitem')).toEqual([i4]);
    expect(chart.nrOfItems()).toEqual(4);
  });

  it('should generate parse trees from the chart', function() {
    expect(chart.parseTrees('S', "earleyitem")).toEqual(["S(S(NP,VP),S(NP,VP),S(NP,VP))"]);
  });
});