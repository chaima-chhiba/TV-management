require('dotenv').config();

const envConfig = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
};

module.exports = envConfig;