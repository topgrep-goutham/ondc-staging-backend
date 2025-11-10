const express = require('express');
const router = express.Router();
const ondcService = require('../services/ondcService');
const callbackController = require('../controllers/callbackController');
const { verifyONDCRequest, checkStaleRequest } = require('../middleware/verification');
const db = require('../config/db');

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

// Select
router.post('/buyer/select', async (req, res) => {
    try {
        const result = await ondcService.select(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Init
router.post('/buyer/init', async (req, res) => {
    try {
        const result = await ondcService.init(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Confirm
router.post('/buyer/confirm', async (req, res) => {
    try {
        const result = await ondcService.confirm(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Status
router.post('/buyer/status', async (req, res) => {
    try {
        const { orderId, bppUri, bppId } = req.body;
        const result = await ondcService.status(orderId, bppUri, bppId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel
router.post('/buyer/cancel', async (req, res) => {
    try {
        const { orderId, cancellationData, bppUri, bppId } = req.body;
        const result = await ondcService.cancel(orderId, cancellationData, bppUri, bppId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update
router.post('/buyer/update', async (req, res) => {
    try {
        const { orderId, updateData, bppUri, bppId } = req.body;
        const result = await ondcService.update(orderId, updateData, bppUri, bppId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track
router.post('/buyer/track', async (req, res) => {
    try {
        const { orderId, bppUri, bppId } = req.body;
        const result = await ondcService.track(orderId, bppUri, bppId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//result data
router.get("/search/results", async (req, res) => {
    try {
        const { transaction_id } = req.query;
        const result = await callbackController.getSearchResults(transaction_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== CALLBACK APIS (Incoming) =====

// All callback routes use verification middleware
router.post('/on_search', verifyONDCRequest, checkStaleRequest, callbackController.onSearch);
router.post('/on_select', verifyONDCRequest, checkStaleRequest, callbackController.onSelect);
router.post('/on_init', verifyONDCRequest, checkStaleRequest, callbackController.onInit);
router.post('/on_confirm', verifyONDCRequest, checkStaleRequest, callbackController.onConfirm);
router.post('/on_status', verifyONDCRequest, checkStaleRequest, callbackController.onStatus);
router.post('/on_cancel', verifyONDCRequest, checkStaleRequest, callbackController.onCancel);
router.post('/on_update', verifyONDCRequest, checkStaleRequest, callbackController.onUpdate);
router.post('/on_track', verifyONDCRequest, checkStaleRequest, callbackController.onTrack);

module.exports = router;