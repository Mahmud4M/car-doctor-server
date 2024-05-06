const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 5000;

// MiddleWare
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://car-doctor-client-77eb9.web.app',
        'https://car-doctor-client-77eb9.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.05txn1y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// Middlewares
const logger = async (req, res, next) => {
    // console.log(req.method, req.url)
    next()
}

const verifyToken = async (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('Token in the middleware', token)

    // No token Avaliable
    if(!token) {
        return res.status(401).send({messege: 'Unauthorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err) { 
            return res.status(401).send({messege: 'Unauthorized Access'})
        }
        req.user = decoded;
        next()
    })
}

const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // Service Collection
        const servicesCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('bookings');

        // Auth related Api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            // console.log('user for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });

            res.cookie('token', token, cookieOption)
            .send({success: true})
        })

        app.post('/logout', async (req, res) => {
            const user = req.user;
            // console.log('Logout token user', user)
            res.clearCookie('token', {...cookieOption, maxAge: 0 }).send({ success: true })
        })




        // Service Related Api
        // Data for Services Direct in Database (Find Multiply)z
        app.get('/services', logger, async (req, res) => {
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
                    customerName: 1,
                    service_id: 1,
                    title: 1,
                    price: 1,
                    img: 1

                },
            };
            const result = await servicesCollection.findOne(query, options);
            res.send(result)
        })

        // Get booking data
        app.get('/bookings', logger, verifyToken, async (req, res) => {


            // console.log('Token owner Info', req.user)
            if(req.user.email !== req.query.email){
                return res.status(403).send({messege: 'Forbidden Access'})
            }

            let = query = {};
            if (req.query?.email) {
                query = {
                    email: req.query.email
                }
            }

            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })

        // Delete 
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })

        // Update cofirm button
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const updatedBooking = req.body;
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
              };
              const result = await bookingCollection.updateOne(filter, updateDoc)
              res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({
        //     ping: 1
        // });

        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
    // console.log(`Car Doctor is Running on: ${port}`)
})










// Middlewares
// const looger = async (req, res, next) => {
//     console.log('called', req.hostname, req.originalUrl);
//     next();
// }

// const verifyToken = async (req, res, next) => {
//     const token = req.cookies.token;
//     console.log('token in verify', token)
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//         if(err) {
//             console.log(err)
//             res.status(401).send({messege: 'Not authorize'})
//         }
//         console.log('Hoisee', decoded);
//         req.user = decoded;
//         next();
//     })
    
// } 


// Auth related Api
        // app.post('/jwt', looger,  async (req, res) => {
        //     const user = req.body;
        //     console.log(user)
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'} )

        //     res
        //     res.cookie('token', token, {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === 'production', 
        //         sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

        //     })
        //     .send({success: true})
        // })