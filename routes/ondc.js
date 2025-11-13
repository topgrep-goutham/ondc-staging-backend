const express = require('express');
const router = express.Router();
const ondcService = require('../services/ondcService');
const callbackController = require('../controllers/callbackController');
const { verifyONDCRequest, checkStaleRequest } = require('../middleware/verification');
const { route } = require('..');

// ===== BUYER APP APIS (Outgoing) =====

// Search
router.post('/buyer/search', async (req, res) => {
    try {
        const result = await ondcService.search(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/on_search', verifyONDCRequest, checkStaleRequest, callbackController.onSearch);

router.get("/search/results", async (req, res) => {
    try {
        const { transaction_id } = req.query;
        const result = await callbackController.getSearchResults(transaction_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;