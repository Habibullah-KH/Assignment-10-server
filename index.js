require ('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//*middleware

app.use(cors({
  origin: ['http://localhost:5173', 'https://ph-10-as-54712.web.app', 'https://ph-10-as-54712.firebaseapp.com'],
  credentials: true

}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.utrln.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

        // Connect to the "insertDB" database and access its "haiku" collection
        const database = client.db('UserDataDB').collection('userData');
        const userInfo = client.db('UserDataDB').collection('userInfo');
        
//?----user equepment sencion start

//***  Send created full web equepment data to clint site
        app.post('/equipment', async(req, res)=>{
          const newequipment = req.body;
          const result = await database.insertOne(newequipment);
          res.send(result);
        })


        app.get('/update/:id', async(req, res)=>{
          try {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await database.findOne(query);
            res.send(result);
          }
          catch (error) {
            console.error('Error fetching products:', error);
          }
        })

        //?  update web equepment data to clint site
      app.put('/update/:id', async(req, res)=>{
        try{
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const options = {upsert:true}
          const updatedEquepment = req.body;
          const updated = {

            $set:{
              email:updatedEquepment.email,
               name:updatedEquepment.name,
               itemName:updatedEquepment.itemName,
               image:updatedEquepment.image,
               description:updatedEquepment.description,
               price:updatedEquepment.price,
               categoryName:updatedEquepment.categoryName,
               rating:updatedEquepment.rating,
               processingTime:updatedEquepment.processingTime,
               stockStatus:updatedEquepment.stockStatus,
               customization:updatedEquepment.customization

            }
          }
          const result = await database.updateOne(query, updated, options)
          res.send(result);
        }
        catch(error) {
          console.error('Error fetching products:', error);
        }
      })

//**** send data based on user if user not then user data not

app.get('/equipment', async (req, res) => {
    try {
        const userEmail = req.query.user || null;

        let query = {};
        if (userEmail) {
            query = { $or: [{ email: userEmail }, { email: { $exists: false } }] };
        } else {
            query = { email: { $exists: false } };
        }

        const result = await database.find(query).sort({ _id: -1 }).limit(6).toArray();
        res.send(result);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).send({ error: 'Failed to fetch equipment' });
    }
});



//***  get user equepment data to clint site
        app.get('/equipment/:user', async(req, res)=>{
          try{
            const user = req.params.user;
            const query = { email: user };
            const result = await database.find(query).toArray();
            console.log(result);
            res.send(result);
          }
          catch (error) {
            console.error('Error fetching products:', error);
          }
        })


//***  sent user allequepment data to clint site
app.get('/allequipment', async (req, res) => {
  try {
      const userEmail = req.query.user || null;

      let query = {};
      if (userEmail) {

          query = { $or: [{ email: userEmail }, { email: { $exists: false } }] };
      } else {
          query = { email: { $exists: false } };
      }

      const result = await database.find(query).toArray();
      res.send(result);
  } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).send({ error: 'Failed to fetch equipment' });
  }
});

// Get profile info
app.get('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const profile = await userInfo.findOne({ userEmail: email });
    res.send(profile || {});
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).send({ error: 'Failed to fetch profile' });
  }
});

// Create or update profile info
app.post('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const { age, location } = req.body;

    const result = await userInfo.updateOne(
      { userEmail: email },
      { $set: { userEmail: email, age, location } },
      { upsert: true }
    );

    res.send(result);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send({ error: 'Failed to update profile' });
  }
});

        
        //* Get bulck stock data from data base
        app.get('/myprodouct', async(req, res)=>{
          try {
            
            const cursor = database.find().limit(6);
            const result = await cursor.toArray();
            res.send(result);
          } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).send({ error: 'Failed to fetch products' });
          }
        })

        //* find a data
        app.get('/user/:id', async(req, res)=>{
          const id = req.params.id;
          const query = {_id: new ObjectId(id)}
          const result = await database.findOne(query);
          res.send(result);

        })

        //!delete data
        app.delete('/users/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          try {
              const result = await database.deleteOne(query);
              res.send(result);
          } catch (error) {
              console.error("Error deleting item:", error);
              res.status(500).send({ error: "Failed to delete the item." });
          }
      });
      
        
//* filter data and set it to additional
app.get('/category', async (req, res) => {
  const { category, user } = req.query;
  let query = {};

  if (user) {
    query = { $or: [{ email: user }, { email: { $exists: false } }] };
  } else {
    query = { email: { $exists: false } };
  }

  if (category && category !== "All") {
    query.categoryName = category;
  }

  try {
    const result = await database.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error("🔥 ERROR while fetching data:", error);
    res.status(500).send({
      error: "Failed to fetch data from the database",
      message: error.message,
      stack: error.stack,
    });
  } 
});


          
          //!!----user equepment sencion end

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('surver is running');
})

app.listen(port, ()=>{
    console.log('surver is running');
})