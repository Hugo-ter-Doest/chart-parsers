/*
    Unit test for Item.js using Jasmine
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

var ItemFactory = require('../lib/ItemFactory');
var itemFactory = new ItemFactory();

describe('Item', function() {
  var item;
  it('should create Items correctly', function () {
    item = itemFactory.createItem({
      'type': 'Earley',
      'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
      'dot': 0,
      'from': 0,
      'to': 0
    });
    expect(item.id).toEqual('Earley(S->NP,VP, 0, 0, 0)');
    expect(item.name).toEqual('S');
    expect(item.children).toEqual([]);
    expect(item.data).toEqual({'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']}, 'dot': 0, 'from': 0, 'to': 0});
  });

  var c1 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 0,
    'from': 0,
    'to': 0
  });
  var c2 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 0,
    'from': 0,
    'to': 0
  });
  var c3 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 0,
    'from': 0,
    'to': 0
  });
  it('should set the children of the item', function () {
    item.set_children([c1, c2, c3]);
    expect(item.children).toEqual([c1, c2, c3]);
  });
  
  var c4 = itemFactory.createItem({
    'type': 'Earley',
    'rule': {'lhs': 'S', 'rhs': ['NP', 'VP']},
    'dot': 0,
    'from': 0,
    'to': 0
  });
  it('should add a child to the item', function () {
    item.append_child(c4);
    expect(item.children).toEqual([c1, c2, c3, c4]);
  });
  
  it('should check if an item is complete', function () {
    expect(item.is_complete()).toEqual(false);
  });
  
  it('should check if an item is incomplete', function () {
    expect(item.is_incomplete()).toEqual(true);
  });
});
