var database = require('mongoose');
//console.log(database)
database.connect('mongodb://127.0.0.1:27017/acc-app',{ useNewUrlParser: true });

module.exports = database;