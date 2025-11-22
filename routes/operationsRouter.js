const express = require('express');
const router = express.Router();
const operationModel = require('../models/operation-model');
const productModel = require('../models/product-model');
const warehouseModel = require('../models/warehouse-model');
const isLoggedIn = require('../middlewares/isLoggedin');

// Helper: Update Stock Balance
async function updateStock(productId, warehouseId, qtyChange) {
    let product = await productModel.findById(productId);

    // Find specific location entry
    let stockEntry = product.stockByLocation.find(s => s.warehouse.toString() === warehouseId.toString());

    if (stockEntry) {
        stockEntry.quantity += qtyChange;
    } else {
        product.stockByLocation.push({ warehouse: warehouseId, quantity: qtyChange });
    }

    // Recalculate Total Global Stock
    product.totalStock = product.stockByLocation.reduce((acc, curr) => acc + curr.quantity, 0);
    await product.save();
}

// GET: List Operations
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const operations = await operationModel.find()
            .populate('items.product')
            .populate('sourceLocation')
            .populate('destinationLocation')
            .sort({ createdAt: -1 });

        const products = await productModel.find();
        // Sort warehouses by Path so "Main / Row 1" appears under "Main"
        const warehouses = await warehouseModel.find({ type: 'Internal' }).sort('path');

        res.render('operations', {
            operations,
            products,
            warehouses,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST: Create Operation
router.post('/create', isLoggedIn, async (req, res) => {
    try {
        const { type, partner, product, quantity, source, destination } = req.body;

        // Validation: Transfers need both locations
        if (type === 'Transfer' && (!source || !destination)) {
            req.flash('error', 'Transfers require both Source and Destination locations.');
            return res.redirect('/operations');
        }

        const generatedRef = `${type.toUpperCase().slice(0, 3)}/${Date.now().toString().slice(-6)}`;

        await operationModel.create({
            type,
            reference: generatedRef,
            partner,
            sourceLocation: source || null, // null for Receipts
            destinationLocation: destination || null, // null for Deliveries
            items: [{ product, quantity: Number(quantity) }],
            status: 'Draft'
        });

        req.flash('success', 'Operation Draft Created.');
        res.redirect('/operations');
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/operations');
    }
});

// POST: Validate (Move the Stock)
router.post('/validate/:id', isLoggedIn, async (req, res) => {
    try {
        const operation = await operationModel.findById(req.params.id).populate('items.product');

        if (operation.status !== 'Draft') return res.redirect('/operations');

        for (let item of operation.items) {
            // 1. Remove from Source
            if (operation.sourceLocation) {
                const source = await warehouseModel.findById(operation.sourceLocation);
                if (source.type === 'Internal') {
                    // Check balance
                    const prod = await productModel.findById(item.product._id);
                    const entry = prod.stockByLocation.find(s => s.warehouse.toString() === source._id.toString());

                    if (!entry || entry.quantity < item.quantity) {
                        req.flash('error', `Insufficient stock in ${source.name}`);
                        return res.redirect('/operations');
                    }
                    await updateStock(item.product._id, operation.sourceLocation, -item.quantity);
                }
            }

            // 2. Add to Destination
            if (operation.destinationLocation) {
                const dest = await warehouseModel.findById(operation.destinationLocation);
                if (dest.type === 'Internal') {
                    await updateStock(item.product._id, operation.destinationLocation, item.quantity);
                }
            }
        }

        operation.status = 'Done';
        await operation.save();

        req.flash('success', 'Movement Validated.');
        res.redirect('/operations');
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/operations');
    }
});

module.exports = router;