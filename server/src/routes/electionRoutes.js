const express = require('express');
const router = express.Router();

const {
  getElections,
  getElectionById,
  getElectionResults,
} = require('../controllers/electionController');
const { authenticate } = require('../middlewares/authMiddleware');

// Public or voter/admin endpoints
router.get('/', authenticate, getElections);
router.get('/:id', authenticate, getElectionById);
router.get('/:id/results', authenticate, getElectionResults);

module.exports = router;

