const Redis = require("ioredis");
const dotenv = require("dotenv");

dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

//Handle Redis connection events (Professional Practice)
redisClient.on('connect', () => console.log('Redis client connected.'));
redisClient.on('ready', () => console.log('Redis client is ready.'));
redisClient.on('error', (err) => console.error('Redis client error:', err.message));
redisClient.on('end', () => console.log('Redis client connection ended.'));

const acquireLock = async (key, value, ttl) => {
    try{
        const result = await redisClient.set(key, value, 'NX', 'PX', ttl);
        return result === 'OK';
    } catch(err){
        console.error(`Error acquiring Redis lock for key ${key}:`, error.message);
        return false;
    }
}

const releaseLock = async (key) => {
    try{
        await redisClient.del(key);
        return true;
    } catch(error){
        console.error(`Error releasing Redis lock for key ${key}:`, error.message);
        return false;
    }
}

module.exports = {
    acquireLock: acquireLock,
    releaseLock: releaseLock,
    redisClient: redisClient,
}