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

// For deep comparing items including children
var _ = require('lodash');
var typeOf = require('typeof');
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('DEBUG');


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

  logger.debug("Enter Chart.add_item: " + item.id);
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
  
  logger.debug("Exit Chart.add_item: number of items added: " + nr_items_added);
  return(nr_items_added);
};

Chart.prototype.is_not_on_chart = function(item) {
  var item_found = false;

  logger.debug("Enter Chart.is_not_on_chart " + item.id);
  if (this.outgoing_edges[item.data.from][item.id]) {
    // item already exists -> deep compare
    this.outgoing_edges[item.data.from][item.id].some(function(item2) {
      if (_.isEqual(item, item2)) {
        item_found = true;
        return(true);
      }
    });
  }
  logger.debug("Exit Chart.is_not_on_chart: " + item_found);
  return(!item_found);
};

Chart.prototype.get_items_from_to = function(i, j) {
  var res = [];
  var that = this;
  
  logger.debug("Enter Chart.get_items_from_to(" + i + ", " + j + ")");
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
    if (that.outgoing_edges[i][item_id].length > 0) {
      if (that.outgoing_edges[i][item_id][0].data.to === j) {
        res = res.concat(that.outgoing_edges[i][item_id]);
      }
    }
  });
  logger.debug("Exit Chart.get_items_from_to: " + JSON.stringify(res));
  return(res);
};

Chart.prototype.get_complete_items_from_to = function(i, j) {
  var res = [];
  var that = this;
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
    if (that.outgoing_edges[i][item_id].length > 0) {
      if ((that.outgoing_edges[i][item_id][0].data.to === j) && 
          (that.outgoing_edges[i][item_id][0].data.rule.rhs.length === that.outgoing_edges[i][item_id][0].data.dot)){
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
      nr_items += that.incoming_edges[j][item_id].length;
  });
  return(nr_items);
};

Chart.prototype.full_parse_items = function(nonterminal) {
  var that = this;
  var items = [];
  
  this.get_items_from_to(0, this.N).forEach(function(item) {
    if ((item.data.rule.lhs === nonterminal) &&
        (item.data.dot === item.data.rule.rhs.length)) {
      items.push(item);
    }
  });
  return(items);
};

// item_type selects the right type of item to create the parse tree from
Chart.prototype.parse_trees = function(nonterminal, item_type) {
  var that = this;
  var parses = [];
  
  this.get_items_from_to(0, this.N).forEach(function(item) {
    if (typeOf(item) === item_type) {
      if ((item.data.rule.lhs === nonterminal) && item.is_complete()) {
        parses.push(item.create_parse_tree());
      }
    }
  });
  return(parses);
};

Chart.prototype.nr_of_items = function() {
  var nr_items = 0;
  for (i = 0; i <= this.N; i++) {
    nr_items += this.nr_items_to(i);
  }
  return(nr_items);
};


module.exports = Chart;