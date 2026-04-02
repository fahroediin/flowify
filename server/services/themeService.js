const themes = [
    { id: 'ocean', name: 'Ocean', description: 'Blue gradients, clean lines' },
    { id: 'sunset', name: 'Sunset', description: 'Warm oranges and purples' },
    { id: 'forest', name: 'Forest', description: 'Green tones, organic feel' },
    { id: 'midnight', name: 'Midnight', description: 'Dark mode, neon accents' },
    { id: 'corporate', name: 'Corporate', description: 'Professional, muted colors' },
    { id: 'pastel', name: 'Pastel', description: 'Soft, friendly colors' },
    { id: 'monochrome', name: 'Monochrome', description: 'Black & white, elegant' }
];

// Returns base variables for mermaid
exports.getThemeVariables = (themeId) => {
    const baseVars = {
        fontFamily: "'Inter', sans-serif",
    };

    switch (themeId) {
        case 'ocean':
            return { ...baseVars, primaryColor: '#bae6fd', primaryTextColor: '#0369a1', primaryBorderColor: '#0284c7', lineColor: '#0ea5e9' };
        case 'sunset':
            return { ...baseVars, primaryColor: '#fed7aa', primaryTextColor: '#9a3412', primaryBorderColor: '#ea580c', lineColor: '#f97316' };
        case 'forest':
            return { ...baseVars, primaryColor: '#bbf7d0', primaryTextColor: '#166534', primaryBorderColor: '#15803d', lineColor: '#22c55e' };
        case 'midnight':
            return { ...baseVars, primaryColor: '#312e81', primaryTextColor: '#e0e7ff', primaryBorderColor: '#6366f1', lineColor: '#8b5cf6', background: '#0f172a' };
        case 'corporate':
            return { ...baseVars, primaryColor: '#e2e8f0', primaryTextColor: '#0f172a', primaryBorderColor: '#475569', lineColor: '#334155' };
        case 'pastel':
            return { ...baseVars, primaryColor: '#f1f5f9', primaryTextColor: '#475569', primaryBorderColor: '#cbd5e1', lineColor: '#94a3b8' };
        case 'monochrome':
            return { ...baseVars, primaryColor: '#ffffff', primaryTextColor: '#000000', primaryBorderColor: '#000000', lineColor: '#000000' };
        default:
            return { ...baseVars, primaryColor: '#bae6fd', primaryTextColor: '#0369a1', primaryBorderColor: '#0284c7', lineColor: '#0ea5e9' };
    }
};

exports.getThemes = () => themes;

exports.enrichSvg = (svgContent, themeId) => {
    // Add custom defs or styles if needed, here we just return the original SVG for the MVP
    return svgContent;
};
