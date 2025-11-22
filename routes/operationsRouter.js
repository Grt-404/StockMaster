const express = require('express');
const router = express.Router();
const operationModel = require('../models/operation-model');
const productModel = require('../models/product-model');
const isLoggedIn = require('../middlewares/isLoggedin');

// GET: List all operations
router.get('/', isLoggedIn, async (req, res) => {
    try {
        // Fetch operations and populate product details so we see names, not just IDs
        const operations = await operationModel.find()
            .populate('items.product')
            .sort({ createdAt: -1 });

        // Fetch products for the "Create New" dropdown
        const products = await productModel.find();

        res.render('operations', {
            operations,
            products,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST: Create a new Draft Operation
router.post('/create', isLoggedIn, async (req, res) => {
    try {
        const { type, reference, partner, product, quantity } = req.body;

        // Basic ID generation if reference is empty (e.g., WH/IN/1715...)
        const generatedRef = reference || `${type.toUpperCase().slice(0, 3)}/${Date.now().toString().slice(-6)}`;

        await operationModel.create({
            type,
            reference: generatedRef,
            partner,
            items: [{ product, quantity }],
            status: 'Draft' // Starts as draft, doesn't affect stock yet
        });

        req.flash('success', 'Operation created (Draft). Click Validate to update stock.');
        res.redirect('/operations');
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/operations');
    }
});

// POST: Validate Operation (Apply Stock Change)
router.post('/validate/:id', isLoggedIn, async (req, res) => {
    try {
        const operation = await operationModel.findById(req.params.id).populate('items.product');

        if (operation.status !== 'Draft') {
            req.flash('error', 'Operation is already processed.');
            return res.redirect('/operations');
        }

        // Loop through items and update stock based on operation type
        for (let item of operation.items) {
            const product = await productModel.findById(item.product._id);

            if (operation.type === 'Receipt') {
                // Buying: Increase Stock
                product.stock += item.quantity;
            } else if (operation.type === 'Delivery') {
                // Selling: Decrease Stock
                if (product.stock < item.quantity) {
                    req.flash('error', `Validation Failed: Not enough stock for ${product.name}`);
                    return res.redirect('/operations');
                }
                product.stock -= item.quantity;
            } else if (operation.type === 'Adjustment') {
                // Inventory Adjustment: Set Stock to "Counted Quantity"
                // Example: System says 50, you count 48. You enter 48. System updates to 48.
                product.stock = item.quantity;
            }
            // Internal Transfer logic can be added here if you implement multiple locations later

            await product.save();
        }

        // Mark as Done
        operation.status = 'Done';
        await operation.save();

        req.flash('success', 'Operation Validated. Stock levels updated.');
        res.redirect('/operations');
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/operations');
    }
});
module.exports = router;