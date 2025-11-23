const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['found', 'lost']
  },
  location: {
    floor: {
      type: String,
      required: true,
      enum: ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6']
    },
    room: String,
    specificLocation: String
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ID Cards', 'Electronics', 'Appliances', 'Documents', 'Accessories', 'Other']
  },
  itemName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  photos: [{
    type: String
  }],
  submittedBy: {
    type: String,
    default: 'Anonymous'
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'returned'],
    default: 'active'
  },
  points: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient searching
itemSchema.index({ type: 1, 'location.floor': 1, category: 1, date: 1 });

module.exports = mongoose.model('Item', itemSchema);
