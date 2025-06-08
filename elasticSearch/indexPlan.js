// This file will create an index in the Elasticsearch

const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

const createIndex = async () => {
  try {
    // Creating the index with the correct mappings
    const result = await client.indices.create({
      index: 'plans',
      body: {
        mappings: {
          properties: {
            planType: { type: 'keyword' },
            creationDate: { 
              type: 'date', 
              format: 'yyyy-MM-dd' // Ensure correct date format
            },
            // Nested field for planCostShares
            planCostShares: {
              type: 'nested',
              properties: {
                deductible: { type: 'integer' },
                copay: { type: 'integer' },
                _org: { type: 'keyword' },
                objectId: { type: 'keyword' },
                objectType: { type: 'keyword' }
              }
            },
            // Nested field for linkedPlanServices
            linkedPlanServices: {
              type: 'nested',
              properties: {
                linkedService: {
                  properties: {
                    name: { type: 'text' },
                    objectId: { type: 'keyword' },
                    objectType: { type: 'keyword' },
                    _org: { type: 'keyword' }
                  }
                },
                planserviceCostShares: {
                  type: 'nested',
                  properties: {
                    deductible: { type: 'integer' },
                    copay: { type: 'integer' },
                    _org: { type: 'keyword' },
                    objectId: { type: 'keyword' },
                    objectType: { type: 'keyword' }
                  }
                },
                _org: { type: 'keyword' },
                objectId: { type: 'keyword' },
                objectType: { type: 'keyword' }
              }
            },
            // Parent-Child relationship using the join_field
            join_field: {
              type: 'join',
              relations: {
                'plan': ['planCostShares', 'linkedPlanServices'], 
                'linkedPlanServices': ['linkedService', 'planserviceCostShares']
              }
            }
          }
        }
      }
    });

    console.log('Index created:', result);
  } catch (error) {
    console.error('Error creating index:', error);
  }
};

// Create the index with proper mappings
createIndex();
