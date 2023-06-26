const axios = require('axios');
const { MongoClient } = require('mongodb');
const express = require('express');
const retry = require('async-retry');

const uri = "mongodb://127.0.0.1:27017/";
const client = new MongoClient(uri);
const app = express();
const port = 3000;
const mainUrl = "https://jsonplaceholder.typicode.com/users/"


app.get('/users/', async (req, res) => {
    await retry(async() => {

    await client.connect();
    const db = client.db("local");
    const collection1 = db.collection("users");
    var response = await axios.get(mainUrl);
    let dataArray = response.data;
    let dataPopArray =  dataArray.map(personData => {
        let tempNameArray =  personData.name.split(' ');
        if (tempNameArray[0] == 'Mr.' || tempNameArray[0] == 'Mrs.') {
            personData.prefix = tempNameArray.shift();
        }
        personData.firstName = tempNameArray.shift();
        personData.lastName = tempNameArray.shift();
        personData.geolocation = personData.address.geo;
        delete personData.address.geo;
        personData.companyName = personData.company.name;
        personData.address = Object.values(personData.address).join(" ");
        delete personData.name;
        delete personData.company;
        delete personData.username;
        delete personData.phone;
        delete personData.website;
        return personData;});
    for (let i = 0; i < dataPopArray.length; i++) {
         let options = { upsert: true };
         let updateSpecs = { $set: dataPopArray[i] };
         let filter = { id: dataPopArray[i].id };
         await collection1.updateOne ( filter, updateSpecs, options );
    }
    await client.close();
    res.send(dataPopArray);
 
    }, {retries: 5})
 
 });

app.get('/users/:id/posts', async (req, res) => {
   await retry(async() => {

   await client.connect();
   const db = client.db("local");
   const collection1 = db.collection("tryDB");
   let idUser = req.params.id;
   var response = await axios.get(mainUrl + idUser + "/posts/");
   let data = response.data;
   for (let i = 0; i < data.length; i++) {
    if (data[i].body.length > 150) {
        let options = { upsert: true };
        let updateSpecs = { $set: data[i] };
        let filter = { id: data[i].id };
        await collection1.updateOne ( filter, updateSpecs, options );
    }
   }
   await client.close();
   res.send(response.data);

   }, {retries: 5})

});

function logColl (db, id) {
    const logCollection = db.collection("log-collection");

}

app.listen(port);
