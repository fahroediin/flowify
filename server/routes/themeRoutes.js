const express = require('express');
const router = express.Router();
const themeService = require('../services/themeService');

// @route   GET /api/themes
// @desc    List all themes
// @access  Public
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: themeService.getThemes()
    });
});

module.exports = router;
