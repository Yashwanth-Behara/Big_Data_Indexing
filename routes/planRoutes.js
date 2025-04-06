const express = require('express');
const { createPlan, getPlanById, deletePlanById, updatePlan } = require('../controllers/planController');
const verifyToken = require('../middlewares/authMiddleware'); 

const router = express.Router();

router.post('/plan', verifyToken, createPlan);
router.get('/plan/:id', verifyToken, getPlanById);
router.delete('/plan/:id', verifyToken, deletePlanById);
router.patch('/plan/:id', verifyToken, updatePlan);
module.exports = router;