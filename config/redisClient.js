const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

client.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Redis error:', err));

module.exports = client;