const express = require('express');
const router = express.Router();
const warehouseModel = require('../models/warehouse-model');
const isLoggedIn = require('../middlewares/isLoggedin');

// GET: Show Map of all Warehouses
router.get('/map', isLoggedIn, async (req, res) => {
    try {
        const warehouses = await warehouseModel.find({ type: 'Internal' });
        res.render('warehouseMap', { warehouses });
    } catch (err) {
        res.send(err.message);
    }
});

// GET: Page to Add a New Warehouse (Helper route)
router.get('/create', isLoggedIn, (req, res) => {
    res.render('createWarehouse');
});

// POST: Create Warehouse logic
router.post('/create', isLoggedIn, async (req, res) => {
    try {
        let { name, address, latitude, longitude } = req.body;
        await warehouseModel.create({
            name,
            address,
            latitude,
            longitude
        });
        res.redirect('/warehouses/map');
    } catch (err) {
        res.send(err.message);
    }
});

module.exports = router;