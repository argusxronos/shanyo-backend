const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

const app = express();

require('dotenv/config');

// Enable cors to allow conexion from every where
app.use(cors());
app.options('*', cors())

//Meddleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);


// Global parameters
const api = process.env.API_URL;

// Routers Parameters
const productRouter = require('./routers/productsRouter');
const categoriesRouter = require('./routers/categoriesRouter');
const ordersRouter = require('./routers/ordersRouter');
const usersRouter = require('./routers/usersRouter');

// Routers
app.use(`${api}/products`, productRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'shanyo-database'
})
.then(() => {
    console.log('Database Connection is ready...')
})
.catch((err) => {
    console.log(err);
})

app.listen(3000, () => {
    console.log('server is running http://localhost:3000');
})