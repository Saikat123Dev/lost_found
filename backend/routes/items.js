const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// POST /api/items - Create new item (found or lost)
router.post('/', upload.array('photos', 5), async (req, res) => {
  try {
    const itemData = {
      type: req.body.type,
      location: {
        floor: req.body.floor,
        room: req.body.room || '',
        specificLocation: req.body.specificLocation || ''
      },
      date: req.body.date,
      time: req.body.time,
      category: req.body.category,
      itemName: req.body.itemName,
      description: req.body.description || '',
      submittedBy: req.body.submittedBy || 'Anonymous',
      photos: req.files ? req.files.map(file => file.filename) : []
    };

    const item = new Item(itemData);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item reported successfully!',
      data: item,
      points: 10
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/items - Get all items with filters
router.get('/', async (req, res) => {
  try {
    const {
      type,
      floor,
      category,
      startDate,
      endDate,
      status = 'active'
    } = req.query;

    let query = { status };

    if (type) query.type = type;
    if (floor) query['location.floor'] = floor;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const items = await Item.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/items/:id - Update item status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/items/stats/summary - Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalFound = await Item.countDocuments({ type: 'found', status: 'active' });
    const totalLost = await Item.countDocuments({ type: 'lost', status: 'active' });
    const totalReturned = await Item.countDocuments({ status: 'returned' });

    res.json({
      success: true,
      data: {
        totalFound,
        totalLost,
        totalReturned,
        totalActive: totalFound + totalLost
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
