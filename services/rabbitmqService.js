const amqp = require('amqplib');

let channel, connection;

const connectQueue = async () => {
    connection = await amqp.connect('amqp://localhost'); // Connect to RabbitMQ
    channel = await connection.createChannel();
    await channel.assertQueue('planQueue', { durable: true }); // Declare a queue
    console.log("Connected to RabbitMQ and queue created");
};

// Send message to RabbitMQ
const sendToQueue = async (message) => {
    if (!channel) {
        await connectQueue(); // Ensure we're connected
    }
    channel.sendToQueue('planQueue', Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log("Message sent to RabbitMQ");
};

module.exports = { sendToQueue };
