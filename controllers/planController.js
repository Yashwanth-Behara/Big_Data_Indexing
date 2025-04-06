const { savePlan, getPlan, deletePlan, computeEtag } = require('../services/planService');
const Ajv = require('ajv');

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

    res.status(200).json({ message: "Plan deleted" });
};

module.exports = { createPlan, getPlanById, deletePlanById };
