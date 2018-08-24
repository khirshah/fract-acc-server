var conf = require('./MongoConfig.json')

var database = require('mongoose');

process.env.dburl = conf.dburl;

database.connect(process.env.dburl,{useNewUrlParser: true}, function (err) {

	if (err) throw err;

});

module.exports = database;