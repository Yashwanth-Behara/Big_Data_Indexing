const express = require('express');
const { createPlan, getPlanById, deletePlanById } = require('../controllers/planController');

const router = express.Router();

router.post('/plan', createPlan);
router.get('/plan/:id', getPlanById);
router.delete('/plan/:id', deletePlanById);

module.exports = router;