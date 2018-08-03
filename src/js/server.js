const express = require('express')
var path = require('path')
const app = express()
const asyncHandler = require('express-async-handler')

var database = require('./mongo');
var User = require('./user');

app.use(function (req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Allow-Credentials', true);
next();
});

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/mongo', asyncHandler(async (req, res, next) => {
	//console.log("req arrived: ", req);
	const f = await User.find({}, function(err, users) {
	  	if (err) throw err;


	  	return users;

	});
	console.log(f)
	res.send(f)
}))


app.listen(3000, () => console.log('Example app listening on port 3000!'))