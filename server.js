// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ---------- CORS (you can move origins to ENV if you prefer) ----------
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://ninawitch-two.vercel.app',
    'https://ninawitch-vi.vercel.app',
    'https://b49f9e04.ninawitch-final.pages.dev',
    'https://ninawitch-final.pages.dev',
    'https://ninawitch.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ---------- Routes ----------
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const subcribeRoutes = require('./routes/subcribeRoutes');
app.use('/api/subcribes', subcribeRoutes);

const needRoutes = require('./routes/needRoutes');
app.use('/api/needs', needRoutes);

const feedbackRoutes = require("./routes/feedbackRoutes");
app.use("/api/feedbacks", feedbackRoutes);

// ----------------- OPTIONAL: Test route to trigger daily email (DEV only) -----------------
// ADD: create file routes/emailTestRoute.js and mount here
// WARNING: Protect this route with auth + admin middleware in production.
try {
  const emailTestRoute = require('./routes/emailTestRoute'); // <-- ADD THIS FILE (optional)
  app.use('/api/test-email', emailTestRoute); // <-- use Postman: POST /api/test-email/send-daily-email
} catch (err) {
  // file not present — ok in production
}

// ----------------- Connect to Mongo and start server -----------------
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI /*, { useNewUrlParser: true, useUnifiedTopology: true } */)
  .then(() => {
    console.log('MongoDB connected');

    // ----------------- ADD: start scheduler AFTER DB connected -----------------
    // If you added services/emailScheduler.js, start it here so it has DB access.
    try {
      const { startScheduler } = require('./services/emailScheduler'); // <-- ADD THIS FILE earlier
      startScheduler();
      console.log('Email scheduler started (if available).');
    } catch (err) {
      console.log('No email scheduler found or failed to start (skipping).');
    }
    // --------------------------------------------------------------------------------

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Mongo connection error:', err);
  });

// ----------------- Graceful shutdown (optional but recommended) -----------------
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down');
  try {
    await mongoose.disconnect();
    console.log('Mongo disconnected');
  } catch (e) {
    console.error('Error during mongoose disconnect', e);
  }
  process.exit(0);
});

// ----------------- Global error handler (optional) -----------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});
