const express = require('express');
const router = express.Router();
const productModel = require('../models/product-model');
const warehouseModel = require('../models/warehouse-model');
const isLoggedIn = require('../middlewares/isLoggedin');

// GET: List Products with Filters
router.get('/', isLoggedIn, async (req, res) => {
    try {
        let query = {};

        // 1. Filter by Category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // 2. Smart Search (Name or SKU)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i'); // Case-insensitive
            query.$or = [{ name: searchRegex }, { sku: searchRegex }];
        }

        // 3. Fetch Data
        let products = await productModel.find(query)
            .populate('stockByLocation.warehouse')
            .sort({ createdAt: -1 });

        // 4. "Low Stock" Filter (Handled in code since it relies on dynamic calculation)
        if (req.query.filter === 'low_stock') {
            products = products.filter(p => {
                let current = p.totalStock || p.stock || 0;
                let min = p.minimumStock || 10;
                return current <= min;
            });
        }

        // Fetch extra data for dropdowns
        const categories = await productModel.distinct('category');
        const warehouses = await warehouseModel.find({ type: 'Internal' });

        res.render('products', {
            products,
            warehouses,
            categories, // Send unique categories for the dropdown
            search: req.query.search || '',
            selectedCategory: req.query.category || '',
            selectedFilter: req.query.filter || '',
            success: req.flash('success')
        });
    } catch (err) {
        res.send(err.message);
    }
});

// ... (Keep POST /create and GET /history routes as is)
router.post('/create', isLoggedIn, async (req, res) => {
    try {
        let { name, sku, category, unitOfMeasure, stock, initialWarehouse, minimumStock } = req.body;
        let stockByLocation = [];
        let totalStock = 0;
        if (stock && stock > 0) {
            if (!initialWarehouse) {
                req.flash('success', 'Error: Please select a warehouse for initial stock.');
                return res.redirect('/products');
            }
            stockByLocation.push({ warehouse: initialWarehouse, quantity: Number(stock) });
            totalStock = Number(stock);
        }
        await productModel.create({
            name, sku, category, unitOfMeasure,
            minimumStock: Number(minimumStock) || 10,
            stockByLocation, totalStock
        });
        req.flash('success', 'Product created successfully');
        res.redirect('/products');
    } catch (err) { res.send(err.message); }
});

router.get('/:id/history', isLoggedIn, async (req, res) => {
    const product = await productModel.findById(req.params.id);
    const operations = await require('../models/operation-model').find({ 'items.product': req.params.id }).sort({ createdAt: -1 });
    res.render('product_history', { product, operations });
});

module.exports = router;