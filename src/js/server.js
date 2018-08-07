const express = require('express')
var path = require('path')
const app = express()
const asyncHandler = require('express-async-handler')

var database = require('./mongo');
var dataRow = require('./dataSchema');

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
	const f = await dataRow.find({}, function(err, users) {
	  	if (err) throw err;


	  	return users;

	});
	console.log(f)
	res.send(f)
}))

var row = new dataRow({
    "USD": 7800,
    "GBP_PROJ": 56,
    "GBP": 0.00,
    "TRANS_TYPE": "IC",
    "TRANS_DATE": "2017-07-12",
    "TRANS_REF": "#CS24",
    "TRANS_DESC": "$7800.00 USD  =  £6037.27 GBP  [inv: £6064.94 | 31/05/17]",
    "XCH_USD_GBP": 0.7740096914,
    "XCH_GBP_USD": 1.2919734870
});

row.save(function(err) {
  if (err) throw err;

  console.log('Data saved successfully!');
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))