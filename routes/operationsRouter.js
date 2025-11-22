const express = require('express');
const router = express.Router();
const operationModel = require('../models/operation-model');
const productModel = require('../models/product-model');
const warehouseModel = require('../models/warehouse-model');
const isLoggedIn = require('../middlewares/isLoggedin');


async function updateStock(productId, warehouseId, qty, mode = 'add') {
    let product = await productModel.findById(productId);


    let stockEntry = product.stockByLocation.find(s => s.warehouse.toString() === warehouseId.toString());

    if (stockEntry) {
        if (mode === 'set') {
            stockEntry.quantity = qty;
        } else {
            stockEntry.quantity += qty;
        }
    } else {

        if (mode === 'set') {
            product.stockByLocation.push({ warehouse: warehouseId, quantity: qty });
        } else {
            product.stockByLocation.push({ warehouse: warehouseId, quantity: qty });
        }
    }


    product.totalStock = product.stockByLocation.reduce((acc, curr) => acc + curr.quantity, 0);
    await product.save();
}

// ... imports (keep existing)

router.get('/', isLoggedIn, async (req, res) => {
    try {
        let query = {};

        // 1. Filter by Type (Receipt, Delivery...)
        if (req.query.type) {
            query.type = req.query.type;
        }

        // 2. Filter by Status (Draft, Done)
        if (req.query.status) {
            query.status = req.query.status;
        }

        // 3. Smart Search (Reference or Partner Name)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [{ reference: searchRegex }, { partner: searchRegex }];
        }

        const operations = await operationModel.find(query)
            .populate('items.product')
            .populate('sourceLocation')
            .populate('destinationLocation')
            .sort({ createdAt: -1 });

        const products = await productModel.find();
        const warehouses = await warehouseModel.find({ type: 'Internal' }).sort('path');

        res.render('operations', {
            operations,
            products,
            warehouses,
            // Pass current filters back to view to keep inputs filled
            search: req.query.search || '',
            selectedType: req.query.type || '',
            selectedStatus: req.query.status || '',
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ... (Keep POST /create and POST /validate routes as is)



router.post('/create', isLoggedIn, async (req, res) => {
    try {
        const { type, partner, product, quantity, source, destination, location } = req.body;

        // For Adjustment, 'location' (from form) acts as the target
        // For Delivery/Transfer, 'source' is used
        // For Receipt, 'destination' is used

        let sourceLoc = source;
        let destLoc = destination;

        // Special handling for Adjustment: It affects one specific location
        if (type === 'Adjustment') {
            // We store the target warehouse in "sourceLocation" for simplicity in the schema
            sourceLoc = location;
            destLoc = null;
        }

        const generatedRef = `${type.toUpperCase().slice(0, 3)}/${Date.now().toString().slice(-6)}`;

        await operationModel.create({
            type,
            reference: generatedRef,
            partner,
            sourceLocation: sourceLoc || null,
            destinationLocation: destLoc || null,
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

// POST: Validate (Execute Stock Change)
router.post('/validate/:id', isLoggedIn, async (req, res) => {
    try {
        const operation = await operationModel.findById(req.params.id).populate('items.product');

        if (operation.status !== 'Draft') return res.redirect('/operations');

        for (let item of operation.items) {
            if (operation.type === 'Adjustment') {
                // ADJUSTMENT LOGIC: Set stock to counted quantity
                if (operation.sourceLocation) {
                    await updateStock(item.product._id, operation.sourceLocation, item.quantity, 'set');
                }
            }
            else if (operation.type === 'Receipt') {
                // RECEIPT LOGIC: Add to Destination
                if (operation.destinationLocation) {
                    await updateStock(item.product._id, operation.destinationLocation, item.quantity, 'add');
                }
            }
            else if (operation.type === 'Delivery') {
                // DELIVERY LOGIC: Remove from Source
                if (operation.sourceLocation) {
                    await updateStock(item.product._id, operation.sourceLocation, -item.quantity, 'add');
                }
            }
            else if (operation.type === 'Transfer') {
                // TRANSFER LOGIC: Move A -> B
                if (operation.sourceLocation && operation.destinationLocation) {
                    await updateStock(item.product._id, operation.sourceLocation, -item.quantity, 'add');
                    await updateStock(item.product._id, operation.destinationLocation, item.quantity, 'add');
                }
            }
        }

        operation.status = 'Done';
        await operation.save();

        req.flash('success', 'Stock updated successfully.');
        res.redirect('/operations');
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/operations');
    }
});

module.exports = router;