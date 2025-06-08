// elasticsearchClient.js
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://localhost:9200', // Make sure Elasticsearch is running at this address
});

module.exports = client;
