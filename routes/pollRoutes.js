const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const validate = require('../middlewares/validate');
const { createPollSchema, votePollSchema } = require('../validators/pollValidator');

router.get('/', pollController.getHome);
router.post('/create', validate(createPollSchema), pollController.createPoll);
router.get('/poll/:id', pollController.getPoll);
router.post('/vote/:id', validate(votePollSchema), pollController.votePoll);

module.exports = router;
