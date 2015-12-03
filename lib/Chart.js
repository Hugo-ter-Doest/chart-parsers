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
// Items are identified by their id.

var settings = require('../config/Settings');

var log4js = require('log4js');
log4js.configure(settings.log4js_config);
var logger = log4js.getLogger('Chart');

var typeOf = require('typeof');

// Creates a chart for recognition of a sentence of length N
function Chart(N) {
  logger.debug("Chart: " + N);
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
Chart.prototype.addItem = function(item) {
  var nr_items_added = 0;
  var item_found = false;

  logger.debug("Enter Chart.add_item: " + item.id);
  if (this.outgoing_edges[item.data.from][item.id]) {
    // item already exists -> deep compare
    this.outgoing_edges[item.data.from][item.id].some(function(item2) {
      if (item.isEqualTo(item2)) {
        item_found = true;
        return(true);
      }
    });
    if (!item_found) {
      // if not found -> add  item to chart
      logger.debug("Chart.add_item: " + this.outgoing_edges[item.data.from][item.id]);
      this.outgoing_edges[item.data.from][item.id].push(item);
      logger.debug("Chart.add_item: " + this.incoming_edges[item.data.to][item.id]);
      if (!this.incoming_edges[item.data.to][item.id]) {
        this.incoming_edges[item.data.to][item.id] = [];
      }
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
  if (nr_items_added > 0) {
  }
  logger.debug("Exit Chart.add_item: number of items added: " + nr_items_added);
  return(nr_items_added);
};

Chart.prototype.isNotOnChart = function(item) {
  var item_found = false;

  logger.debug("Enter Chart.isNotOnChart " + item.id);
  if (this.outgoing_edges[item.data.from][item.id]) {
    // item already exists -> deep compare
    this.outgoing_edges[item.data.from][item.id].some(function(item2) {
      if (item.isEqualTo(item2)) {
        item_found = true;
        return(true);
      }
    });
  }
  logger.debug("Exit Chart.isNotOnChart: " + item_found);
  return(!item_found);
};

// Returns all items that span i to j
Chart.prototype.getItemsFromTo = function(i, j) {
  var res = [];
  var that = this;

  logger.debug("Enter Chart.getItemsFromTo(" + i + ", " + j + ")");
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
    if (that.outgoing_edges[i][item_id].length > 0) {
      if (that.outgoing_edges[i][item_id][0].data.to === j) {
        res = res.concat(that.outgoing_edges[i][item_id]);
      }
    }
  });
  logger.debug("Exit Chart.getItemsFromTo: " + JSON.stringify(res));
  return(res);
};

Chart.prototype.getItemsFrom = function(i) {
  var res = [];
  var that = this;

  logger.debug("Enter Chart.getItemsFrom(" + i + ")");
  Object.keys(this.outgoing_edges[i]).forEach(function(item_id){
    res = res.concat(that.outgoing_edges[i][item_id]);
  });
  logger.debug("Exit Chart.getItemsFrom: " + res);
  return(res);
};

Chart.prototype.getItemsTo = function(j) {
  var res = [];
  var that = this;
  
  logger.debug("Enter Chart.getItemsTo(" + j + ")");
  Object.keys(this.incoming_edges[j]).forEach(function(item_id){
    res = res.concat(that.incoming_edges[j][item_id]);
  });
  logger.debug("Exit Chart.getItemsTo:" + res);
  return(res);
};

Chart.prototype.nrItemsTo = function(j) {
  var that = this;
  var nr_items = 0;
  
  logger.debug("Enter Chart.nrItemsTo(" + j + ")");
  Object.keys(this.incoming_edges[j]).forEach(function(item_id){
      nr_items += that.incoming_edges[j][item_id].length;
  });
  logger.debug("Exit Chart.nrItemsTo: " + nr_items);
  return(nr_items);
};

// Returns all complete items that span i to j
Chart.prototype.getCompleteItemsFromTo = function(i, j) {
  var res = [];
  var that = this;
  
  logger.debug("Enter Chart.getCompleteItemsFromTo(" + i + ", " + j + ")");
  this.getItemsFromTo(i, j).forEach(function(item){
    if (item.isComplete()) {
      res.push(item);
    }
  });
  logger.debug("Exit Chart.getCompleteItemsFromTo: " + res);
  return(res);
};

// Returns all complete items span i to j AND start with nonterminal A
Chart.prototype.fullParseItems = function(A, item_type) {
  var that = this;
  var items = [];
  
  logger.debug("Enter Chart.fullParseItems(" + A + ")");
  this.getCompleteItemsFromTo(0, this.N).forEach(function(item) {
    logger.debug('Exit Chart.fullParseItems: type of item: ' + typeOf(item));
    if ((item.data.rule.lhs === A)  && (typeOf(item) === item_type)) {
      items.push(item);
    }
  });
  logger.debug("Exit Chart.fullParseItems: " + items);
  return(items);
};

// Returns the parse trees in textual bracketed form
// item_type selects the right type of item to create the parse tree from
Chart.prototype.parseTrees = function(nonterminal, item_type) {
  var that = this;
  var parses = [];

  logger.debug("Enter Chart.parseTrees(" + nonterminal + ", " + item_type + ")");
  this.getItemsFromTo(0, this.N).forEach(function(item) {
    if (typeOf(item) === item_type) {
      if ((item.data.rule.lhs === nonterminal) && item.isComplete()) {
        parses.push(item.createParseTree());
      }
    }
  });
  logger.debug("Exit Chart.parseTrees:" + parses);
  return(parses);
};

// Returns the total number of items on the chart
Chart.prototype.nrOfItems = function() {
  var nr_items = 0;
  
  logger.debug("Enter Chart.nrOfItems()");
  for (var i = 0; i <= this.N; i++) {
    nr_items += this.nrItemsTo(i);
  }
  logger.debug("Exit Chart.nrOfItems: " + nr_items);
  return(nr_items);
};

module.exports = Chart;