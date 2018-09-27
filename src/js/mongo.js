var database = require('mongoose');

database.connect(process.env.dburl,{useNewUrlParser: true}, function (err) {

	if (err) throw err;

});

module.exports = database;