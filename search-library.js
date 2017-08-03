var mongo = require("mongodb");

var connectionStr = "mongodb://beastoso:hard24get@ds129013.mlab.com:29013/fcc-beastoso";

var url = "https://cse.google.com/cse/publicurl?cx=011770336544442852827:mpp11sdfgvy";
var seid = "011770336544442852827:mpp11sdfgvy";
var apik = "AIzaSyB9HYd-zP3fT1teXkux85fUNXVxkjobGmk";
var address = "https://www.googleapis.com/customsearch/v1?";

var request = require('request');

var library = {
  search: function(searchStr, page, callback) {
    library.saveSearch(searchStr, function(err, data) {
      if (err) return callback(err, null);
      
      var params = {
        "key":apik,
        "cx":seid,
        "q":searchStr,
        "searchType":"image"
      };

      request({url: address, qs: params}, function(error, res, body) {
        if (error) return callback(error, null);
        var resultObj = JSON.parse(body);
        var results = [];
        
        if (typeof resultObj.items != 'undefined') {
          resultObj.items.forEach(function(item) {
            var result = {
              'image-url': item.link,
              'alt-text': item.title,
              'page-url': item.image.contextLink
            };
            results.push(result);
          });        
        }
        callback(null, results);
      });
    });
  },
  saveSearch: function(searchStr, callback) {
    mongo.connect(connectionStr, function(err, db) {
      if (err) return callback(err, null);
      
      var collection = db.collection('searches');
      
      var obj = { 'query' : searchStr, 'date': new Date().getTime() };
      collection.insert(obj,function(error, document) {
        if (error) return callback(error, null);
        db.close();
        callback(null, true);
      });
    });
  },
  history: function(setsize, callback) {
    mongo.connect(connectionStr, function(err, db) {
      if (err) return callback(err, null);
      var collection = db.collection('searches');
    
      collection.find().sort({'date':-1}).limit(setsize).toArray(
        function(error, results) {    
          if (error) return callback(error, null);
          db.close();
          if (results.length === 0) return callback(null, false);
          return callback(null, results);
        }
      );
    });
  }
}

module.exports = library;
