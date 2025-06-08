const { savePlan, getPlan, deletePlan, computeEtag } = require('../services/planService');
const { sendToQueue } = require('../services/rabbitmqService');
const Ajv = require('ajv');
const deepMerge = require('../utils/deepMerge');

const ajv = new Ajv();

// JSON Schema for Validation

const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Plan",
    "type": "object",
    "properties": {
        "_org": { "type": "string", "minLength": 1 },
        "objectId": { "type": "string", "minLength": 1  },
        "objectType": { "type": "string", "minLength": 1  },
        "planType": { "type": "string", "minLength": 1  },
        "creationDate": { "type": "string", "minLength": 1  },
        "planCostShares": {
            "type": "object",
            "properties": {
                "deductible": { "type": "number", "minimum": 0 },
                "_org": { "type": "string", "minLength": 1  },
                "copay": { "type": "number", "minimum": 0 },
                "objectId": { "type": "string", "minLength": 1  },
                "objectType": { "type": "string", "minLength": 1  }
            },
            "required": ["deductible", "_org", "copay", "objectId", "objectType"]
        },
        "linkedPlanServices": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "linkedService": {
                        "type": "object",
                        "properties": {
                            "_org": { "type": "string", "minLength": 1  },
                            "objectId": { "type": "string", "minLength": 1  },
                            "objectType": { "type": "string", "minLength": 1  },
                            "name": { "type": "string", "minLength": 1  }
                        },
                        "required": ["_org", "objectId", "objectType", "name"]
                    },
                    "planserviceCostShares": {
                        "type": "object",
                        "properties": {
                            "deductible": { "type": "number", "minimum": 0 },
                            "_org": { "type": "string", "minLength": 1  },
                            "copay": { "type": "number", "minimum": 0 },
                            "objectId": { "type": "string", "minLength": 1  },
                            "objectType": { "type": "string", "minLength": 1 }
                        },
                        "required": ["deductible", "_org", "copay", "objectId", "objectType"]
                    },
                    "_org": { "type": "string", "minLength": 1  },
                    "objectId": { "type": "string" , "minLength": 1 },
                    "objectType": { "type": "string", "minLength": 1 }
                },
                "required": ["linkedService", "planserviceCostShares", "_org", "objectId", "objectType"]
            }
        }
    },
    "required": ["_org", "objectId", "objectType", "planType", "creationDate", "planCostShares", "linkedPlanServices"]
};

const validate = ajv.compile(schema);

// Create a Plan 
const createPlan = async (req, res) => {
    const data = req.body;

    if (!validate(data)) {
        return res.status(400).json({ error: "Invalid data", details: validate.errors });
    }

    const planId = data.objectId;

    // Check if the plan already exists in Redis
    const existingData = await getPlan(planId);

    if (existingData) {
        // Compute ETag for existing data
        const existingEtag = computeEtag(existingData);

        // Compute ETag for incoming data
        const incomingEtag = computeEtag(data);

        // Compare ETags: If the same, return 409 Conflict
        if (existingEtag === incomingEtag) {
            return res.status(409).json({ error: "Duplicate entry not allowed. Plan with the same content already exists." });
        }
    }

    // Save the new plan to Redis
    await savePlan(planId, data);

    // Send the plan to RabbitMQ for Elasticsearch indexing
    await sendToQueue({ action: 'create', plan: data });

    // Compute ETag for the new data and set it in the response
    const etagValue = computeEtag(data);
    res.set('ETag', etagValue);
    res.status(201).json({ message: "Plan created", objectId: planId });
};

//Get a Plan with Conditional Read
const getPlanById = async (req, res) => {
    const planId = req.params.id;
    const data = await getPlan(planId);

    if (!data) {
        return res.status(404).json({ error: "Plan not found" });
    }

    const etagValue = computeEtag(data);

    if (req.headers['if-none-match'] === etagValue) {
        return res.status(304).end();  // Not Modified
    }

    res.set('ETag', etagValue);
    res.status(200).json(data);
};

// Delete a Plan 
const deletePlanById = async (req, res) => {
    const planId = req.params.id;
    const result = await deletePlan(planId);

    if (result === 0) {
        return res.status(404).json({ error: "Plan not found" });
    }

    // Send the delete message to RabbitMQ for Elasticsearch deletion
    await sendToQueue({ action: 'delete', planId });

    res.status(200).json({ message: "Plan deleted" });
};

// Update a plan
const updatePlan = async (req, res) => {
    const planId = req.params.id;
    const ifMatchHeader = req.headers['if-match']; // ETag from request header

    if (!ifMatchHeader) {
        return res.status(400).json({ error: 'Missing If-Match header' });
    }

    // Get existing plan from DB
    const existingPlan = await getPlan(planId);
    if (!existingPlan) {
        return res.status(404).json({ error: 'Plan not found' });
    }

    // Compute ETag for the existing resource (based on its data)
    const currentETag = computeEtag(existingPlan);

    // Compare ETags
    if (ifMatchHeader !== currentETag) {
        return res.status(412).json({ error: 'Precondition Failed: ETag mismatch' });
    }

    // Validate the updated object against JSON Schema
    if (!validate(req.body)) {
        return res.status(400).json({ error: "Invalid data to update", details: validate.errors });
    }

    // Deep merge existing plan with request body
    const updatedPlan = deepMerge(existingPlan, req.body);


    // Save updated data to DB
    await savePlan(planId, updatedPlan);

    // Send the updated plan to RabbitMQ for re-indexing in Elasticsearch
    await sendToQueue({ action: 'update', plan: updatedPlan });

    // Generate new ETag for the updated resource
    const newETag = computeEtag(updatedPlan);

    res.setHeader('ETag', newETag);
    return res.status(200).json(updatedPlan);
};
module.exports = { createPlan, getPlanById, deletePlanById, updatePlan };
