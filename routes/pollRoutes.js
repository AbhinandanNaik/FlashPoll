const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.get('/', pollController.getHome);
router.post('/create', pollController.createPoll);
router.get('/poll/:id', pollController.getPoll);
router.post('/vote/:id', pollController.votePoll);

module.exports = router;
