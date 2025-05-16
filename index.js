const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://online-tutor-booking.web.app',
    'https://online-tutor-booking.firebaseapp.com',
  ],
  credentials: true,
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.utrln.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// -------- FIXED & WORKING run function
async function run() {
  try {
    const db = client.db('PH_10_AS_server');
    const tutorialCollection = db.collection('tutorials');
    const userDataCollection = db.collection('userBookedData');

    // JWT Login
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })
        .send({ success: true });
    });

    // JWT Logout
    app.post('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })
        .send({ success: true });
    });

    // GET all tutorials with optional search
    app.get('/cards', async (req, res) => {
      const search = req.query.search || '';
      const result = await tutorialCollection
        .find({ language: { $regex: search, $options: 'i' } })
        .toArray();
      res.send(result);
    });

    // GET by language
    app.get('/find-tutors/:language', async (req, res) => {
      const language = req.params.language;
      const result = await tutorialCollection.find({ language }).toArray();
      res.send(result);
    });

    // POST new tutorial
    app.post('/addTutorial', async (req, res) => {
      const data = req.body;
      const result = await tutorialCollection.insertOne(data);
      res.send(result);
    });

    // Auth middleware
    const verifyToken = (req, res, next) => {
      const token = req.cookies.token;
      if (!token) return res.status(401).send('Unauthorized');
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('Forbidden');
        req.user = decoded;
        next();
      });
    };

    // GET user's tutorials
    app.get('/mytutorial/:email', verifyToken, async (req, res) => {
      if (req.user.email !== req.params.email) {
        return res.status(403).send('Forbidden');
      }
      const result = await tutorialCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    // PUT tutorial update
    app.put('/UpdateMyTutorial/:id', async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: updateData };
      const result = await tutorialCollection.updateOne(filter, update);
      res.send(result);
    });

    // DELETE tutorial
    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const result = await tutorialCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ✅ This ping route is required by Vercel for health check
    app.get('/', (req, res) => {
      res.send('Server is running');
    });

  } catch (err) {
    console.error('Server Error:', err);
  }
}

run().catch(console.dir);

// ✅ Vercel must export the app
module.exports = app;

// Optional if testing locally
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
