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
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Allow-Credentials', true);
next();
});

//app.get('/', (req, res) => res.send('Hello World!'))
app.get('/mongoRead', asyncHandler(async (req, res, next) => {

	const f = await dataRow.find({}, function(err, users) {
	  	if (err) throw err;


	  	return users;

	});
	//console.log(f)
	res.send(f)
}))

app.post('/mongoWrite', asyncHandler(async (req, res, next) => {
	
	var row = new dataRow(req.body)

	f = await row.save(function(err) {
	  if (err) throw err;

	  console.log('Data saved successfully!');
	});
	res.send()
}))

app.put('/mongoUpdate', asyncHandler(async (req, res, next) => {
	
	f = await dataRow.findById(req.body._id, function (err, r) {
		console.log(req.body)
        if (err) throw err;

        r[Object.keys(req.body.dat)[0]] = Object.values(req.body.dat)[0];

        r.save(function (err) {
			if (err) throw err;

			res.json({message: 'data updated!'})
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

            res.json({ message: 'Successfully deleted' });
            console.log('data deleted!')
        });
    })
    res.send()
}));



app.listen(3000, () => console.log('Example app listening on port 3000!'))