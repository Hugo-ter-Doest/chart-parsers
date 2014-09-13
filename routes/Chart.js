/*
    Generic chart that can be used for all chart parsers (hopefully)
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

// Implements a chart with from/to edges. Items are added by chart.add_item(i, j, item)
// Items are identified by their id. Items that have the same id are not added to the same edge.

function Chart(N) {
  this.outgoing_edges = new Array(N+1);
  this.incoming_edges = new Array(N+1);
  
  var i;
  for (i = 0; i <= N; i++) {
    this.outgoing_edges[i] = {};
    this.incoming_edges[i] = {};
  }
}

// Adds an item to the chart; returns 1 if the item was added, 0 otherwise
Chart.prototype.add_item = function(item) {
  if (!this.outgoing_edges[item.data.from][item.id]) {
    this.outgoing_edges[item.data.from][item.id] = item;
    this.incoming_edges[item.data.to][item.id] = item;
    return(1);
  }
  else {
    return(0);
  }
};

Chart.prototype.get_items_from_to = function(i, j) {
  var res = [];
  var that = this;
  this.outgoing_edges[i].forEach(function(item_id){
    if (that.outgoing_edges[i][item_id].data.to === j) {
      res.push(that.outgoing_edges[i][item_id]);
    }
  });
  return(res);
};

Chart.prototype.get_items_from = function(i) {
  var res = [];
  var that = this;
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
    res.push(that.outgoing_edges[i][item_id]);
  });
  return(res);
};

Chart.prototype.get_items_to = function(j) {
  var res = [];
  var that = this;
  Object.keys(this.incoming_edges[j]).forEach(function(item_id){
    res.push(that.incoming_edges[j][item_id]);
  });
  return(res);
};

Chart.prototype.nr_items_to = function(j) {
  return(Object.keys(this.incoming_edges[j]).length);
}

module.exports = Chart;