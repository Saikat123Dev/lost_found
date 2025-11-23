const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users - Create or get user
router.post('/', async (req, res) => {
  try {
    const { username, email } = req.body;

    let user = await User.findOne({ username });

    if (!user) {
      user = new User({ username, email });
      await user.save();
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/users/:username - Get user by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/users/:username/points - Award points
router.post('/:username/points', async (req, res) => {
  try {
    const { points, action } = req.body;
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.points += points;

    if (action === 'report') {
      user.itemsReported += 1;
    } else if (action === 'return') {
      user.itemsReturned += 1;
    }

    // Level up logic
    user.level = Math.floor(user.points / 100) + 1;

    // Award badges
    if (user.itemsReported === 1 && !user.badges.find(b => b.name === 'First Reporter')) {
      user.badges.push({
        name: 'First Reporter',
        icon: '🎯',
        earnedAt: new Date()
      });
    }

    if (user.itemsReported === 10 && !user.badges.find(b => b.name === 'Super Reporter')) {
      user.badges.push({
        name: 'Super Reporter',
        icon: '⭐',
        earnedAt: new Date()
      });
    }

    if (user.itemsReturned === 1 && !user.badges.find(b => b.name === 'Helper')) {
      user.badges.push({
        name: 'Helper',
        icon: '🤝',
        earnedAt: new Date()
      });
    }

    await user.save();

    res.json({
      success: true,
      data: user,
      newBadges: user.badges.filter(b =>
        new Date(b.earnedAt).getTime() === new Date().getTime()
      )
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/users - Get leaderboard
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select('username points level badges itemsReported itemsReturned');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
