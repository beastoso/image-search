'use strict';

var searchLib = require('./search-library.js');
var fs = require('fs');
var express = require('express');
var app = express();


if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/').get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    });

app.route('/api/latest/imagesearch/').get(function(req, res, next) {
  searchLib.history(10, function(err, searches) {
    if (err) return res.send(err);
    var result = [];
    searches.forEach(function(search) {
      var d = new Date(search.date);
       result.push({
          'term': search.query,
         'when': d.toDateString()+" "+(d.getHours()-1)+":"+d.getMinutes()
       });                
     });
      
    res.send(JSON.stringify(result));
  });    
});

app.route('/api/imagesearch/*').get(function(req, res, next){
  var query = req.url.substr(17);
  var page = 0;
  var paramIndex = query.indexOf("?");
  if (paramIndex > 0) {
    query = query.substr(0, paramIndex);
    if (req.query.offset) page = parseInt(req.query.offset);
  }
  
  var query = decodeURIComponent(query);
  if (!query) {
    return res.send('Invalid query');
  }
  
  searchLib.search(query, page, function(err, results) {
    if (err) return res.send(err);
    if (results === false) return res.send("No matches found");
    else res.send(JSON.stringify(results));
  });
  
});


// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
});

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

