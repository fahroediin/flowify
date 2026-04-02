const express = require('express');
const router = express.Router();
const flowchartController = require('../controllers/flowchartController');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/flowcharts/parse
// @desc    Parse input to mermaid code (live preview)
// @access  Private
router.post('/parse', authMiddleware, flowchartController.parseInput);

// @route   POST /api/flowcharts/render
// @desc    Render mermaid code with theme to SVG
// @access  Private
router.post('/render', authMiddleware, flowchartController.renderFlowchart);

// @route   POST /api/flowcharts
// @desc    Save flowchart to history
// @access  Private
router.post('/', authMiddleware, flowchartController.saveFlowchart);

// @route   GET /api/flowcharts
// @desc    Get all flowcharts for current user
// @access  Private
router.get('/', authMiddleware, flowchartController.getFlowcharts);

// @route   GET /api/flowcharts/:id
// @desc    Get single flowchart
// @access  Private
router.get('/:id', authMiddleware, flowchartController.getFlowchartById);

// @route   PUT /api/flowcharts/:id
// @desc    Update flowchart
// @access  Private
router.put('/:id', authMiddleware, flowchartController.updateFlowchart);

// @route   DELETE /api/flowcharts/:id
// @desc    Delete flowchart
// @access  Private
router.delete('/:id', authMiddleware, flowchartController.deleteFlowchart);

// @route   POST /api/flowcharts/:id/export
// @desc    Export flowchart (svg, png, pdf)
// @access  Private
router.post('/:id/export', authMiddleware, flowchartController.exportFlowchart);

module.exports = router;
