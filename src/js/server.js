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

//dataRow.watch().on('change', data => console.log("CHANGE: ", new Date(), data));

async function calculateAmounts(dateID, curr){

	return new Promise((resolve,reject) => {
		//find all the records from the given date (inclusive)
		dataRow.find({DATE_ID: {$gte: dateID}, CURRENCY: curr}, null, {sort: {DATE_ID:1}},  function(err, data){

	    if (err) throw err;
	    //if there are such records, do the calculation
	    if (data.length > 0) {
	    	//iterate through all of them and count the cumulative amount
	    	for (var i=0; i<data.length-1 ; i++) {

	    		var row = data[i+1]
	    		var prevRow = data[i]

	    		row.CUMUL_AMOUNT = parseFloat(prevRow.CUMUL_AMOUNT) + parseFloat(row.AMOUNT)
	    		//save the rows individually
	    		row.save(function (err) {
			
						if (err) throw err;
					
	  			})
	      }
	    }
	    resolve(true)
		})

	})
}


app.post('/mongoRead', asyncHandler(async (req, res, next) => {
	
	const thisYearDate = new Date(req.body.startDate)
	let nextYear = parseInt(req.body.startDate)+1
	let nextYearDate = new Date(req.body.startDate)
	nextYearDate.setYear(nextYear)
	
	const f = await dataRow.find({TRANS_DATE:{ $gte: thisYearDate, $lt: nextYearDate}, CURRENCY:req.body.curr}, null, {sort: {TRANS_DATE:1}}, function(err, data){

        if (err) throw err;
        console.log(req.body.startDate, data)
        return data;
	})

	res.send(f)
}))


app.post('/mongoWrite', asyncHandler(async (req, res, next) => {
  //create a date integer with the date of the received row
  var inpdate = new Date(req.body.TRANS_DATE)
  var dateInt = inpdate.getTime();
  //copy the content of the requisition (the row we want to save) into and object
  var obj = req.body

  //ASSIGNING A DATE_ID
	//get rows with the same date from Mongo
	const recOnSameDate = await dataRow.find({TRANS_DATE: inpdate, CURRENCY:req.body.CURRENCY})

		//if there is none yet, this row gets the date id ending with zero
	if (recOnSameDate.length == 0){

    	obj.DATE_ID = parseInt(dateInt+"00")
	
	}
	//if there are record(s) on this date already, this row gets the next date id
	else {

		var prevDateId = recOnSameDate[recOnSameDate.length-1].DATE_ID
		obj.DATE_ID = parseInt(prevDateId)+1
		
	}
	//get the records before this one
  const recBefThis = await dataRow.find({DATE_ID: {$lt: obj.DATE_ID}, CURRENCY:req.body.CURRENCY},null, {sort: {DATE_ID:1}})
  //if there are no such records, this is the first, so make cumul amount equal to the amount
	if (recBefThis.length == 0) {
		
		obj.CUMUL_AMOUNT = obj.AMOUNT
	
	}
	//if there are preceeding records, get the last item of the list = the record befor this one
	else {
	
		obj.CUMUL_AMOUNT = parseFloat(recBefThis[recBefThis.length-1].CUMUL_AMOUNT)+parseFloat(obj.AMOUNT)
	
	}

	//create a mongo object using our object with the date id added to it
	var row = new dataRow(obj)
	//perform save
	const f = await row.save()
	//calculate cumulative amounts
	await calculateAmounts(obj.DATE_ID,req.body.CURRENCY);

	res.send();

}))



app.put('/mongoUpdate', asyncHandler(async (req, res, next) => {
	
	var thisRec = await dataRow.findById(req.body._id)

  thisRec[Object.keys(req.body.dat)[0]] = Object.values(req.body.dat)[0];
  //save the record
  await thisRec.save()

  console.log('data updated!')
  //and retrieve it again, so we get the changes and can save the rec again later
  var thisRec = await dataRow.findById(req.body._id)
  //if the amount of the row is modified
  if (Object.keys(req.body.dat)[0] == "AMOUNT") {
  	//We need to recount the Cumul amount of this record and all the followings
  	const recBefThis = await dataRow.find({DATE_ID: {$lt: thisRec.DATE_ID}, CURRENCY:thisRec.CURRENCY},null, {sort: {DATE_ID:-1}}).limit(1)
  	//if there are no records before this one, the amount equals the cumul amount
		if (recBefThis.length == 0) {
			
			thisRec.CUMUL_AMOUNT = Object.values(req.body.dat)[0];
		}
		//if there are, then we add the amount to the previous record's cumul amount
		else {

			thisRec.CUMUL_AMOUNT = parseFloat(recBefThis[0].CUMUL_AMOUNT) + parseFloat(Object.values(req.body.dat)[0]);		
		}
		//save the record
		await thisRec.save();
  	//call the calculation function
  	await calculateAmounts(thisRec.DATE_ID,thisRec.CURRENCY);
  }
  //if the date is modified
  else if (Object.keys(req.body.dat)[0] == "TRANS_DATE") {

  	var date = Object.values(req.body.dat)[0]
  	var inpdate = new Date(date)
  	var dateInt = inpdate.getTime();
  	//new DATE_ID is needed and we recount the whole db cumul amounts
		const recOnSameDate = await dataRow.find({TRANS_DATE: inpdate, CURRENCY:req.body.CURRENCY})

		//if there is none yet, this row gets the date id ending with zero
		if (recOnSameDate.length == 0){

	    	thisRec.DATE_ID = parseInt(dateInt+"00")
		}
		//if there are record(s) on this date already, this row gets the next date id
		else {

			var prevDateId = recOnSameDate[recOnSameDate.length-1].DATE_ID
			thisRec.DATE_ID = parseInt(prevDateId)+1
			}
		//either way we have to save the record
		await thisRec.save();
		//we need to get the first record of the database
		firstRec = await dataRow.find({CURRENCY:thisRec.CURRENCY},null,{sort: {DATE_ID:1}}).limit(1);
		//just in case we make cumul amount and amount equal (in case we just inserted our record to the first slot)
		firstRec[0].CUMUL_AMOUNT = firstRec[0].AMOUNT;
		//save the first rec
		await firstRec[0].save();
		//retrieve it again so we can work with the modified version
		firstRec = await dataRow.find({CURRENCY:thisRec.CURRENCY},null,{sort: {DATE_ID:1}}).limit(1);
		//to calculate the cumulative amounts
		await calculateAmounts(firstRec[0].DATE_ID,firstRec[0].CURRENCY);
  }

	res.send()
}))



app.delete('/mongoRemove',asyncHandler(async (req, res) => {
	  //create a variable for the record we will use for the calculation of cumulative amounts
  var recForCount;
	//let's find our rec to delete
	f = await dataRow.findById(req.body._id);
	//and then the one before
  const recordBeforeThisOne = await dataRow.find({DATE_ID: {$lt: f.DATE_ID}, CURRENCY:f.CURRENCY},null, {sort: {DATE_ID:1}})

  //if this is the first record, we need to find the one after this one, because that's going to be the first after deleting this
  if (recordBeforeThisOne == 0) {

		const recordAfterThisOne = await dataRow.find({DATE_ID: {$gt: f.DATE_ID}, CURRENCY:f.CURRENCY},null, {sort: {DATE_ID:1}}).limit(1);
			
		recordAfterThisOne[0].CUMUL_AMOUNT = recordAfterThisOne[0].AMOUNT
			
		recordAfterThisOne[0].save();
		
		recForCount = recordAfterThisOne[0]
	}
	//if this isn't the first record, easy: the record before this one will be the one we use for the calculation of cumul amounts
	else {

		recForCount = recordBeforeThisOne[recordBeforeThisOne.length-1]
	}
	//now we can safely delete the original item
  const deleteItem = await f.remove({_id: req.body._id});

  console.log('data deleted!')
  //then perform the calculation
  const calcCumAmounts = await calculateAmounts(recForCount.DATE_ID,recForCount.CURRENCY);

  res.send()

}));



app.listen(process.env.PORT, () => console.log(`Example app listening on port ${process.env.PORT}`))