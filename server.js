const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'https://ninawitch-two.vercel.app', 'https://ninawitch-vi.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const subcribeRoutes = require('./routes/subcribeRoutes');
app.use('/api/subcribes', subcribeRoutes);



mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Server have been turning on');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server have been running on ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('Server has error:', err));
