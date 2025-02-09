const express = require('express');
const dotenv = require('dotenv');
const planRoutes = require('./routes/planRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use('/api/v1', planRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));