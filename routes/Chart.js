/*
    Generic chart that can be used for all chart parsers
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

var _ = require('lodash');

function Chart(N) {
  this.N = N;
  this.outgoing_edges = new Array(N+1);
  this.incoming_edges = new Array(N+1);
  
  var i;
  for (i = 0; i <= N; i++) {
    this.outgoing_edges[i] = {};
    this.incoming_edges[i] = {};
  }
}

// Adds an item to the chart if it is not already there; returns 1 if the item was added, 0 otherwise
// Items are compared using deep compare (so including children)
Chart.prototype.add_item = function(item) {
  var nr_items_added = 0;
  var item_found = false;

  if (this.outgoing_edges[item.data.from][item.id]) {
    // item already exists -> deep compare
    this.outgoing_edges[item.data.from][item.id].some(function(item2) {
      if (_.isEqual(item, item2)) {
        item_found = true;
        return(true);
      }
    });
    if (!item_found) {  
      // if not found -> add  item to chart
      this.outgoing_edges[item.data.from][item.id].push(item);
      this.incoming_edges[item.data.to][item.id].push(item);
      nr_items_added = 1;
    }
  }
  else {
      // item does not exist -> add to the chart
      this.outgoing_edges[item.data.from][item.id] = [item];
      this.incoming_edges[item.data.to][item.id] = [item];
      nr_items_added = 1;
  }
  
  return(nr_items_added);
};

Chart.prototype.get_items_from_to = function(i, j) {
  var res = [];
  var that = this;
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
    if (that.outgoing_edges[i][item_id].length > 0) {
      if (that.outgoing_edges[i][item_id][0].data.to === j) {
        res = res.concat(that.outgoing_edges[i][item_id]);
      }
    }
  });
  return(res);
};

Chart.prototype.get_items_from = function(i) {
  var res = [];
  var that = this;
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
      res = res.concat(that.outgoing_edges[i][item_id]);
  });
  return(res);
};

Chart.prototype.get_items_to = function(j) {
  var res = [];
  var that = this;
  Object.keys(this.incoming_edges[j]).forEach(function(item_id){
      res = res.concat(that.incoming_edges[j][item_id]);
  });
  return(res);
};

Chart.prototype.nr_items_to = function(j) {
  var that = this;
  var nr_items = 0;
  Object.keys(this.incoming_edges[j]).forEach(function(item_id){
      nr_items += that.incoming_edges[i][item_id].length;
  });
  return(nr_items);
};

Chart.prototype.parse_trees = function(nonterminal) {
  var that = this;
  var parses = [];
  
  this.get_items_from_to(0, this.N).forEach(function(item) {
    if ((item.data.rule.lhs === nonterminal) &&
        (item.data.dot === item.data.rule.rhs.length)) {
      parses.push(that.create_parse_tree(item));
      //parses.push(JSON.stringify(item));
    }
  });
  return(parses);
};

Chart.prototype.create_parse_tree = function(item) {
  console.log(item);
  var that= this;
  var subtree = item.data.rule.lhs;
  
  if (item.children.length === 0) {
    subtree += "( " + item.data.rule.rhs + " )";
  }
  else {
    subtree += " (";
    var i;
    for (i = 0; i < item.children.length; i++) {
      subtree +=  this.create_parse_tree(item.children[i]);
    }
    subtree += ") ";
  }
  return(subtree);
};


module.exports = Chart;