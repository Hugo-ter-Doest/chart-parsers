var http = require('http');
var express = require('express');
var router = require('./routes/index');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

//Set port to listen to
app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded());
app.use(router);

//Create http server by passing "app" to it:
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
