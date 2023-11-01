const express = require('express')
const cors=require('cors')
// const jwt = require('jsonwebtoken');
// const cokkieParser=require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT|| 5000;
//mpddleware
app.use(cors())
app.use(express.json())

//mongo connection
// console.log(process.env.DB_USER)

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nhy8bre.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicecollection= client.db('carDoctor2').collection('services')
    const bookingscollection= client.db('carDoctor2').collection('bookings')


    // const bookingcollection= client.db('cardoctor').collection('bookings')
    app.get('/services',async(req,res)=>{
        const cursor = servicecollection.find();
        const result=await cursor.toArray();
        res.send(result)
    })
    app.get('/services/:id',async(req,res)=>{
        const id =req.params.id;
        const query={_id: new ObjectId(id)}
        const result=await servicecollection.findOne(query)
        res.send(result)
    })

    //bokkings

    app.post('/bookings',async(req,res)=>{
        const booking = req.body;
        console.log(booking)
        const result=await bookingscollection.insertOne(booking)
        res.send(result) 
      })
//req.cookies.token
      app.get('/bookings',async(req,res)=>{
        console.log(req.query.email)
        // // console.log('tok tok token')
        // console.log('user in the valid token',req.user)
        // if(require.query.email !==req.user.email){
        //   return res.status(403).send({message:'forbidden access'})
        // }
        let query={}
        if(req.query?.email){
          query={email:req.query.email}
        }
  
        const result=await bookingscollection.find(query).toArray()
        res.send(result)
  
      })

      app.delete('/bookings/:id',async(req,res)=>{
        const id=req.params.id
        const query={_id: new ObjectId(id)}
        const result=await bookingscollection.deleteOne(query)
        res.send(result)
      })

      app.patch('/bookings/:id',async(req,res)=>{
        const id=req.params.id
        const filter={_id:new ObjectId(id)}
        const updatebook=req.body
        console.log(updatebook)
        const updatedoc={
          $set:{
            status:updatebook.status
          }
        }
        const result=await bookingscollection.updateOne(filter,updatedoc)
        res.send(result)
      })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('doctor is comming!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })