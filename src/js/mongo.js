var conf;

try {
  conf = require('./MongoConfig.json');
}
catch(err){
  console.log(err)
}

var database = require('mongoose');

database.connect(process.env.dburl || conf.dburl,{useNewUrlParser: true}, function (err) {

	if (err) throw err;

});

module.exports = database;