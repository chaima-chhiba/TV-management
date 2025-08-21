const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const tvRoutes = require('./routes/tv');

const { authenticateJWT } = require('./middleware/authMiddleware');
const contentController = require('./controllers/contentController');
const scheduleController = require('./controllers/scheduleController');
const tvController = require('./controllers/tvController'); // ADD
const scheduleRoutes = require('./routes/schedule');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Set body size limit BEFORE routes (increase as needed)
const BODY_LIMIT = process.env.BODY_LIMIT || '50mb';
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Public endpoints (no auth)
app.get('/api/public/content', contentController.getContentsPublic);
app.get('/api/public/schedule/tv/:tvId', scheduleController.getSchedulesByTv);
app.post('/api/public/tv/:id/ping', tvController.pingPublicTV);
// ADD: resolve TV by name (used by public Display)
app.get('/api/public/tv/by-name/:name', tvController.getByNamePublic);
app.use('/api/schedule', authenticateJWT, scheduleRoutes);
// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/content', authenticateJWT, contentRoutes);
app.use('/api/tv', authenticateJWT, tvRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => console.error('MongoDB connection error:', err));
