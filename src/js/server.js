//load env vars
require('dotenv').config();
const express = require('express')
var path = require('path')
const app = express()
const asyncHandler = require('express-async-handler')
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var database = require('./mongo');
var dataRow = require('./dataSchema');

app.use(function (req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
res.setHeader('Access-Control-Allow-Credentials', true);
next();
});

/*app.get('/mongoRead', asyncHandler(async (req, res, next) => {

	const f = await dataRow.find({}, function(err, data) {
	  	if (err) throw err;

		return data;

	});
	console.log(f)
	res.send(f)
}))
*/

app.post('/mongoRead', asyncHandler(async (req, res, next) => {
	
	const thisYearDate = new Date(req.body.startDate)
	let nextYear = parseInt(req.body.startDate)+1
	let nextYearDate = new Date(req.body.startDate)
	nextYearDate.setYear(nextYear)
	
	const f = await dataRow.find({TRANS_DATE:{ $gte: thisYearDate, $lt: nextYearDate}, CURRENCY:req.body.curr}, null, {sort: {TRANS_DATE:1}}, function(err, data){

        if (err) throw err;

        return data;
	})
	
	res.send(f)
}))

app.post('/mongoWrite', asyncHandler(async (req, res, next) => {
	
	console.log("req body: ", req.body)
	var row = new dataRow(req.body)

	const f = await row.save(function(err, item) {
	  if (err) throw err;

	  console.log('Data saved successfully!', item.id);
	  res.send({id : item.id})

	});


}))

app.put('/mongoUpdate', asyncHandler(async (req, res, next) => {
	
	f = await dataRow.findById(req.body._id, function (err, r) {

        if (err) throw err;

        r[Object.keys(req.body.dat)[0]] = Object.values(req.body.dat)[0];

        r.save(function (err) {
			if (err) throw err;
			console.log('data updated!')
        })
        
	})

	res.send()
}))

app.delete('/mongoRemove',asyncHandler(async (req, res) => {

	f = await dataRow.findById(req.body._id, function (err, r) {

        r.remove({
            _id: req.body._id
        }, function(err) {
            if (err) throw err;

        });
    })
    console.log('data deleted!')
    res.send()
}));



app.listen(process.env.PORT, () => console.log(`Example app listening on port ${process.env.PORT}`))