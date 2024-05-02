const express = require('express');
const cors = require('cors');
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 5000;

// MiddleWare
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.05txn1y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        // Service Collection
        const servicesCollection = client.db('carDoctor').collection('services');

        // Data for Services Direct in Database (Find Multiply)
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // Data for Services Direct in Database (Find One)
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: {
                    title: 1,
                    price: 1,
                    service_id: 1
                },
            };
            const result = await servicesCollection.findOne(query, options);
            res.send(result)
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({
            ping: 1
        });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Doctor Is Running')
})

app.listen(port, () => {
    console.log(`Car Doctor is Running on: ${port}`)
})