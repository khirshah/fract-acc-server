
/*try {
  var conf = require('./MongoConfig.json');
  process.env.dburl = conf.dburl;
}
catch(err){
  throw err;
}*/

var database = require('mongoose');

database.connect(process.env.dburl,{useNewUrlParser: true}, function (err) {

	if (err) throw err;

});

module.exports = database;