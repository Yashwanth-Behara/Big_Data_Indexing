const client = require('../config/redisClient');
const generateEtag = require('../utils/generateEtag');

// Save the new plan to Redis (or your DB)
const savePlan = async (planId, data) => {
    await client.set(planId, JSON.stringify(data));
};

// Get a plan from Redis (or your DB)
const getPlan = async (planId) => {
    const result = await client.get(planId);
    return result ? JSON.parse(result) : null;
};

// Delete a plan from Redis (or your DB)
const deletePlan = async (planId) => {
    return await client.del(planId);
};

// Generate the ETag for the plan
const computeEtag = (data) => {
    return generateEtag(data);
};

module.exports = { savePlan, getPlan, deletePlan, computeEtag };
