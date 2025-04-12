const amqp = require('amqplib');
const { indexPlanInElasticSearch, updatePlanInElasticSearch, deletePlanInElasticSearch } = require('./elasticSearchService');

const startConsumer = async () => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertQueue('planQueue', { durable: true });

    channel.consume('planQueue', async (msg) => {
        const { action, plan, planId } = JSON.parse(msg.content.toString());
        console.log('Received plan:', plan);  // Log the plan object

        
        switch (action) {
            case 'create':
                await indexPlanInElasticSearch(plan);
                break;
            case 'update':
                await updatePlanInElasticSearch(plan);
                break;
            case 'delete':
                await deletePlanInElasticSearch(planId);
                break;
        }

        channel.ack(msg);
    });
};

startConsumer().catch(console.error);
