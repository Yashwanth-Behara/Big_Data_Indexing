const client = require('../config/redisClient');
const generateEtag = require('../utils/generateEtag');

const savePlan = async (planId, data) => {
    await client.set(planId, JSON.stringify(data));
};

const getPlan = async (planId) => {
    const result = await client.get(planId);
    return result ? JSON.parse(result) : null;
};

const deletePlan = async (planId) => {
    return await client.del(planId);
};

const computeEtag = (data) => {
    return generateEtag(data);
};

module.exports = { savePlan, getPlan, deletePlan, computeEtag };