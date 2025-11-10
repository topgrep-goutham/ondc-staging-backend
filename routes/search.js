const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

/**
 * GET /search/results
 * Get all search results (paginated)
 */
router.get('/results', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const results = await searchService.getAllSearchResults(limit, offset);

        res.json({
            success: true,
            count: results.length,
            limit,
            offset,
            data: results
        });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /search/results/:transactionId
 * Get search results by transaction ID
 */
router.get('/results/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        const results = await searchService.getSearchResults(transactionId);

        if (!results) {
            return res.status(404).json({
                success: false,
                error: 'Search results not found'
            });
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /search/latest
 * Get latest search results
 */
router.get('/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const results = await searchService.getLatestSearchResults(limit);

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error fetching latest search results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /search/products
 * Search products by name or description
 */
router.get('/products', async (req, res) => {
    try {
        const { q, transactionId } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }

        const products = await searchService.searchProducts(q, transactionId);

        res.json({
            success: true,
            count: products.length,
            query: q,
            data: products
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /search/products/:transactionId
 * Get all products by transaction ID
 */
router.get('/products/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        const results = await searchService.getSearchResults(transactionId);

        if (!results) {
            return res.status(404).json({
                success: false,
                error: 'Products not found'
            });
        }

        res.json({
            success: true,
            transactionId,
            count: results.products.length,
            data: results.products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;