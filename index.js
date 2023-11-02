const express = require('express')
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 5000;
//mpddleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

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

//middleware
const logger= async (req,res,next)=>{
  console.log('called:',req.host,req.originalUrl)
  next()
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicecollection = client.db('carDoctor2').collection('services')
    const bookingscollection = client.db('carDoctor2').collection('bookings')

    //auth realted api for token

    app.post('/jwt',logger,  async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
      })
          .send({ success: true });
  })

  const verifytoken=async(req,res,next)=>{
    const token=req.cookies?.token
    console.log('value of token in middleware',token)
    if(!token){
      return res.status(401).send({message:'forbidden'}) 
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        console.log(err)
        return res.status(401).send({message:'unauthorized'})
      }
      console.log('value in the token',decoded)
      req.user=decoded
      next()   
    })    
  }

  //auth realtaed api
  app.post('/jwt',logger,  async (req, res) => {
    const user = req.body;
    console.log('user for token', user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })
        .send({ success: true });
})

app.post('/logout',async(req,res)=>{
  const user=req.body
  console.log('loging out',user)
  res.clearCookie('token',{maxAge:0}).send({ success: true });
})

    //service api
    app.get('/services',logger, async (req, res) => {
      const cursor = servicecollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await servicecollection.findOne(query)
      res.send(result)
    })

    //bokkings

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking)
      const result = await bookingscollection.insertOne(booking)
      res.send(result)
    })
    
    app.get('/bookings',logger,verifytoken, async (req, res) => {
      console.log(req.query.email)
      console.log('from valid token',req.user)
      if(req.query.email !==req.user.email){
        return res.status(403).send({message:'forbidden access'})
      }
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }

      const result = await bookingscollection.find(query).toArray()
      res.send(result)

    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingscollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatebook = req.body
      console.log(updatebook)
      const updatedoc = {
        $set: {
          status: updatebook.status
        }
      }
      const result = await bookingscollection.updateOne(filter, updatedoc)
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