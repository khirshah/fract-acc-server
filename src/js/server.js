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


app.post('/mongoRead', asyncHandler(async (req, res, next) => {
	
	const thisYearDate = new Date(req.body.startDate)
	let nextYear = parseInt(req.body.startDate)+1
	let nextYearDate = new Date(req.body.startDate)
	nextYearDate.setYear(nextYear)
	
	const f = await dataRow.find({TRANS_DATE:{ $gte: thisYearDate, $lt: nextYearDate}, CURRENCY:req.body.curr}, null, {sort: {TRANS_DATE:1}}, function(err, data){

        if (err) throw err;

        return data;
	})
	//console.log(f)
	res.send(f)
}))

app.post('/mongoWrite', asyncHandler(async (req, res, next) => {
  //create a date integer with the date of the received row
  var inpdate = new Date(req.body.TRANS_DATE)
  var dateInt = inpdate.getTime();
  //copy the content of the requisition (the row we want to save) into and object
  var obj = req.body

	//get rows with the same date from Mongo
	const recordsOnSameDate = await dataRow.find({TRANS_DATE: inpdate, CURRENCY:req.body.CURRENCY}, function(err, data){

    if (err) throw err;
		
		//if there is none yet, this row gets the date id ending with zero
		if (data.length == 0){

	    	obj.DATE_ID = parseInt(dateInt+"00")
		
		}

		//if there are record(s) on this date already, this row gets the next date id
		else {

			var index = data.length-1
			var prevDateId = data[index].DATE_ID
			obj.DATE_ID = parseInt(prevDateId)+1
			
		}

	})


  const recordsBeforeThisOne = await dataRow.find({DATE_ID: {$lt: obj.DATE_ID}, CURRENCY:req.body.CURRENCY},null, {sort: {DATE_ID:1}}, function(err, data){

    if (err) throw err;
		
		if (data.length == 0) {
		
			obj.CUMUL_AMOUNT = obj.AMOUNT
		
		}

		else {

			obj.CUMUL_AMOUNT = parseFloat(data[data.length-1].CUMUL_AMOUNT)+parseFloat(obj.AMOUNT)
		
		}

	})

	//create a mongo object using our object with the date id added to it
	var row = new dataRow(obj)
	//perform save
	

	const f = await row.save(async function(err, item) {
	  
	  if (err) throw err;
	  return new Promise ((resolve, reject) =>  {

	  	console.log('Data saved successfully!', item.id)

	  	resolve(true)

	  })
	 
	  
	});



	const recordsAfterThisOne = await dataRow.find({DATE_ID: {$gte: obj.DATE_ID}, CURRENCY:req.body.CURRENCY}, null, {sort: {DATE_ID:1}},  function(err, data){

      if (err) throw err;


      if (data.length > 0) {
      
      	for (var i=0; i<data.length-1 ; i++) {

      		console.log(data[i].TRANS_DATE)
      		var index = i+1
      		
      		var row = data[i+1]
      		var prevRow = data[i]

      		row.CUMUL_AMOUNT = parseFloat(prevRow.CUMUL_AMOUNT) + parseFloat(row.AMOUNT)

      		row.save(function (err) {
			
						if (err) throw err;
					
    			})

      	}
      }
	})

res.send()

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


  });

  console.log('data deleted!')



  res.send()

}));



app.listen(process.env.PORT, () => console.log(`Example app listening on port ${process.env.PORT}`))