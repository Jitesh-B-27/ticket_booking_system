const redis = require("redis");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const redisClient = redis.createClient({ url: process.env.REDIS_URI});

redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('ready', () => console.log('Redis client is ready'));
redisClient.on('error', (err) => console.error('Redis client error:', err.message));
redisClient.on('onEnd', () => console.log('Redis client connection ended.'));

/**
 * Acquires a distributed lock for a given key.
 * @param {string} key - The key to lock.
 * @param {number} ttl - Time-to-live in milliseconds.
 * @returns {Promise<string|false>} The unique lock value if acquired, otherwise false.
 */

const acquireLock = async (key, ttl) => {
    const lockValue = uuidv4();
    try{
        const result = await redisClient.set(key, lockValue, {
            NX: true,
            PX: ttl,
        });

        return result === 'OK' ? lockValue : false;
    } catch (error){
        console.error(`Error acquiring Redis lock for key ${key}: `, error.message);
        return false;
    }
};

/**
 * Releases a distributed lock, but only if the value matches.
 * This prevents one process from releasing a lock that belongs to another.
 * @param {string} key - The lock key.
 * @param {string} value - The unique value of the lock to be released.
 * @returns {Promise<boolean>} True if the lock was released, false otherwise.
 */

const releaseLock = async (key, value) => {
    const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
    `;

    try{
        const result = await redisClient.eval(script, { keys: [key], arguments: [value]});
        // The result is 1 if the lock was deleted, 0 if it was not found or the value didnt match
        return result === 1;
    } catch (error){
        console.error(`Error releasing Redis lock for key ${key}: `, error.message);
        return false;
    }
}

module.exports = {
    redisClient: redisClient,
    acquireLock: acquireLock,
    releaseLock: releaseLock,
};