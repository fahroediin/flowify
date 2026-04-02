const db = require('../services/dbService');
const parserService = require('../services/parserService');
const renderService = require('../services/renderService');
const exportService = require('../services/exportService');

exports.parseInput = async (req, res, next) => {
    try {
        const { input_type, content } = req.body;
        
        let mermaidCode = '';
        let graphData = null;

        if (input_type === 'mermaid') {
            mermaidCode = content;
            graphData = parserService.parseMermaidToGraphData(content);
        } else if (input_type === 'text') {
            const parsed = parserService.parseTextToGraphData(content);
            mermaidCode = parsed.mermaid_code;
            graphData = parsed.graph_data;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid input type' });
        }

        res.json({
            success: true,
            data: { mermaid_code: mermaidCode, graph_data: graphData, is_valid: true }
        });
    } catch (error) {
        next(error);
    }
};

exports.renderFlowchart = async (req, res, next) => {
    try {
        const { mermaid_code, theme } = req.body;
        
        if (!mermaid_code) {
            return res.status(400).json({ success: false, message: 'mermaid_code is required' });
        }

        const svg = await renderService.renderMermaidToSvg(mermaid_code, theme || 'ocean');

        res.json({
            success: true,
            data: { svg, theme: theme || 'ocean' }
        });
    } catch (error) {
        next(error);
    }
};

exports.saveFlowchart = async (req, res, next) => {
    try {
        const { title, input_type, input_content, mermaid_code, theme, svg_output } = req.body;
        const user_id = req.user.id;

        const result = await db.run(
            `INSERT INTO flowcharts (user_id, title, input_type, input_content, mermaid_code, theme, svg_output) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title || 'Untitled Flowchart', input_type, input_content, mermaid_code, theme || 'ocean', svg_output]
        );

        const newId = result.lastID;
        const newFlowchart = await db.get('SELECT * FROM flowcharts WHERE id = ?', [newId]);

        res.status(201).json({
            success: true,
            message: 'Flowchart saved',
            data: newFlowchart
        });
    } catch (error) {
        next(error);
    }
};

exports.getFlowcharts = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search}%` : '%';

        const flowcharts = await db.query(
            `SELECT id, title, input_type, theme, created_at, updated_at 
             FROM flowcharts 
             WHERE user_id = ? AND title LIKE ? 
             ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
            [user_id, search, limit, offset]
        );

        const totalRow = await db.get(
            `SELECT COUNT(*) as count FROM flowcharts WHERE user_id = ? AND title LIKE ?`,
            [user_id, search]
        );
        const total = totalRow.count;
        
        res.json({
            success: true,
            data: {
                flowcharts,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getFlowchartById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user_id = req.user.id;

        const flowchart = await db.get('SELECT * FROM flowcharts WHERE id = ? AND user_id = ?', [id, user_id]);
        
        if (!flowchart) {
            return res.status(404).json({ success: false, message: 'Flowchart not found' });
        }

        res.json({
            success: true,
            data: flowchart
        });
    } catch (error) {
        next(error);
    }
};

exports.updateFlowchart = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user_id = req.user.id;
        const { title, mermaid_code, theme, svg_output } = req.body;

        const existing = await db.get('SELECT id FROM flowcharts WHERE id = ? AND user_id = ?', [id, user_id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Flowchart not found' });
        }

        await db.run(
            `UPDATE flowcharts SET title = COALESCE(?, title), mermaid_code = COALESCE(?, mermaid_code), 
             theme = COALESCE(?, theme), svg_output = COALESCE(?, svg_output), updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [title, mermaid_code, theme, svg_output, id, user_id]
        );

        const updated = await db.get('SELECT * FROM flowcharts WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Flowchart updated',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteFlowchart = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user_id = req.user.id;

        const result = await db.run('DELETE FROM flowcharts WHERE id = ? AND user_id = ?', [id, user_id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Flowchart not found' });
        }

        res.json({
            success: true,
            message: 'Flowchart deleted'
        });
    } catch (error) {
        next(error);
    }
};

exports.exportFlowchart = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user_id = req.user.id;
        const { format = 'png', scale = 2 } = req.body;

        const flowchart = await db.get('SELECT svg_output, title FROM flowcharts WHERE id = ? AND user_id = ?', [id, user_id]);
        if (!flowchart || !flowchart.svg_output) {
            return res.status(404).json({ success: false, message: 'Flowchart or SVG not found' });
        }

        const exportedFileBuffer = await exportService.exportSvg(flowchart.svg_output, format, scale);
        
        const filename = `${flowchart.title.replace(/\s+/g, '-')}.${format}`;
        
        let contentType = 'image/png';
        if (format === 'svg') contentType = 'image/svg+xml';
        if (format === 'pdf') contentType = 'application/pdf';

        res.set('Content-Type', contentType);
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportedFileBuffer);
    } catch (error) {
        next(error);
    }
};
