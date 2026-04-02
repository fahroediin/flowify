const fs = require('fs').promises;
const path = require('path');
const themeService = require('./themeService');

exports.renderMermaidToSvg = async (mermaidCode, themeId = 'ocean') => {
    const { run } = await import('@mermaid-js/mermaid-cli');
    // get theme variables
    const themeParams = themeService.getThemeVariables(themeId);
    
    const tempMmdFile = path.join(__dirname, '../../uploads', `temp_${Date.now()}.mmd`);
    const tempSvgFile = path.join(__dirname, '../../uploads', `temp_${Date.now()}.svg`);

    const jsonConfigPath = path.join(__dirname, '../../uploads', `temp_config_${Date.now()}.json`);

    try {
        await fs.writeFile(tempMmdFile, mermaidCode);
        await fs.writeFile(jsonConfigPath, JSON.stringify({
            theme: 'base',
            themeVariables: themeParams
        }));

        // Render using mermaid-cli
        await run(tempMmdFile, tempSvgFile, {
            puppeteerConfig: { args: ['--no-sandbox'] },
            mermaidConfig: jsonConfigPath,
            parseMMDOptions: { backgroundColor: 'transparent' }
        });

        const svgContent = await fs.readFile(tempSvgFile, 'utf-8');
        
        // Future: Inject extra styling not supported by mermaid config out-of-the-box (like gradients)
        const enrichedSvg = themeService.enrichSvg(svgContent, themeId);
        
        return enrichedSvg;
    } finally {
        // Clean up temp files
        try { await fs.unlink(tempMmdFile); } catch (e) {}
        try { await fs.unlink(tempSvgFile); } catch (e) {}
        try { await fs.unlink(jsonConfigPath); } catch (e) {}
    }
};
