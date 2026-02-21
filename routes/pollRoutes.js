const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const authController = require('../controllers/authController');

router.get('/', pollController.getHome);
router.post('/create', pollController.createPoll);
router.get('/poll/:id', pollController.getPoll);
router.post('/vote/:id', pollController.votePoll);

// Protected routes
router.get('/dashboard', authController.protect, pollController.getDashboard);
router.post('/poll/:id/delete', authController.protect, pollController.deletePoll);

module.exports = router;
