const express = require('express');
const router = express.Router();
const productModel = require('../models/product-model');
const isLoggedIn = require('../middlewares/isLoggedin');

// GET Route: Display all products
router.get('/', isLoggedIn, async (req, res) => {
    try {
        // Fetch all products, sorted by newest first
        let products = await productModel.find().sort({ createdAt: -1 });

        // Render the 'products' view (we will create this next)
        // Pass the products data and any flash messages
        res.render('products', { products, success: req.flash('success') });
    } catch (err) {
        res.send(err.message);
    }
});

// POST Route: Create a new product
router.post('/create', isLoggedIn, async (req, res) => {
    try {
        let { name, sku, category, unitOfMeasure, stock } = req.body;

        // Create the product using the data from the form
        let product = await productModel.create({
            name,
            sku,
            category,
            unitOfMeasure,
            stock: stock || 0 // Default to 0 if empty
        });

        req.flash('success', 'Product created successfully');
        res.redirect('/products');
    } catch (err) {
        res.send(err.message);
    }
});
router.get('/:id/history', isLoggedIn, async (req, res) => {
    try {
        // 1. Find the specific product
        const product = await productModel.findById(req.params.id);

        // 2. Find all operations that contain this product
        // We look inside the 'items' array for an item with this product ID
        const operations = await require('../models/operation-model').find({
            'items.product': req.params.id
        }).sort({ createdAt: -1 }); // Newest first

        // 3. Render the history view
        res.render('product_history', { product, operations });
    } catch (err) {
        res.send(err.message);
    }
});
module.exports = router;