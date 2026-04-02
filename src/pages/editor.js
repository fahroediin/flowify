import { apiCall } from '../utils/api.js';
import { logout } from '../utils/auth.js';
import { showToast } from '../main.js';

let currentThemes = [];
let selectedTheme = 'ocean';
let inputFormat = 'mermaid';

export const renderEditorPage = async (container, user) => {
    container.innerHTML = `
        <nav class="navbar">
            <a href="/" class="brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Flowify</span>
            </a>
            <div class="nav-links">
                <span style="color: var(--text-muted); font-size: 0.9rem;">Hi, ${user.name}</span>
                <button id="btn-history">History</button>
                <button id="btn-save" class="primary">Save to History</button>
                <button id="btn-logout" style="background: transparent; border-color: var(--danger); color: var(--danger);">Logout</button>
            </div>
        </nav>

        <div class="page editor-layout">
            <!-- Left Panel (Input) -->
            <div class="left-panel">
                <div class="tabs">
                    <div class="tab active" data-format="mermaid">Mermaid Code</div>
                    <div class="tab" data-format="text">Sequential Text</div>
                </div>
                
                <div class="panel-content">
                    <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted);" id="input-hint">
                        Write your Mermaid.js flowchart code here.
                    </p>
                    <textarea id="editor-input" class="editor-textarea" spellcheck="false" placeholder="flowchart TD\n    A[Start] --> B[Process]\n    B --> C{Decision}\n    C -->|Yes| D[End]"></textarea>
                    
                    <button id="btn-render" class="primary" style="margin-top: 1rem; width: 100%;">Render Flowchart</button>
                </div>
            </div>

            <!-- Right Panel (Preview) -->
            <div class="right-panel">
                <div class="panel-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <h3 style="margin: 0; font-size: 1rem;">Live Preview</h3>
                        <div id="theme-selector" class="theme-selector" style="margin-top: 0;">
                            <!-- Themes loaded dynamically -->
                        </div>
                    </div>
                    <div>
                        <button id="btn-export-png">Export PNG</button>
                    </div>
                </div>
                
                <div id="preview-container" class="svg-container">
                    <div style="color: var(--text-muted); text-align: center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin-bottom: 1rem; opacity: 0.5;">
                            <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18C20 17.4696 19.7893 16.9609 19.4142 16.5858C19.0391 16.2107 18.5304 16 18 16H6C5.46957 16 4.96086 16.2107 4.58579 16.5858C4.21071 16.9609 4 17.4696 4 18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p>Write input on the left and click Render</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
    await loadThemes();
};

const loadThemes = async () => {
    try {
        const res = await apiCall('/themes');
        currentThemes = res.data;
        
        const selector = document.getElementById('theme-selector');
        selector.innerHTML = currentThemes.map(t => 
            `<button class="theme-btn ${t.id === selectedTheme ? 'active' : ''}" data-theme="${t.id}">${t.name}</button>`
        ).join('');

        selector.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                selector.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedTheme = btn.dataset.theme;
                // If there's code, re-render
                const val = document.getElementById('editor-input').value;
                if (val.trim()) {
                    renderCode();
                }
            });
        });
    } catch (e) {
        showToast('Failed to load themes', 'error');
    }
};

const THEME_PALETTES = {
    'ocean': { bg: '#0f172a', nodeBg: '#bae6fd', border: '#0284c7', font: '#0369a1', line: '#0ea5e9' },
    'sunset': { bg: '#0f172a', nodeBg: '#fed7aa', border: '#ea580c', font: '#9a3412', line: '#f97316' },
    'forest': { bg: '#0f172a', nodeBg: '#bbf7d0', border: '#15803d', font: '#166534', line: '#22c55e' },
    'midnight': { bg: '#0f172a', nodeBg: '#312e81', border: '#6366f1', font: '#e0e7ff', line: '#8b5cf6' },
    'corporate': { bg: '#0f172a', nodeBg: '#e2e8f0', border: '#475569', font: '#0f172a', line: '#334155' },
    'pastel': { bg: '#0f172a', nodeBg: '#f1f5f9', border: '#cbd5e1', font: '#475569', line: '#94a3b8' },
    'monochrome': { bg: '#ffffff', nodeBg: '#ffffff', border: '#000000', font: '#000000', line: '#000000' }
};

let currentMermaidCode = '';
let currentSvgOutput = '';
let network = null;

const renderCode = async () => {
    const content = document.getElementById('editor-input').value;
    if (!content.trim()) return showToast('Input cannot be empty', 'error');

    const renderBtn = document.getElementById('btn-render');
    const ogText = renderBtn.textContent;
    renderBtn.textContent = 'Parsing & Rendering...';
    renderBtn.disabled = true;

    try {
        const parseRes = await apiCall('/flowcharts/parse', {
            method: 'POST',
            body: JSON.stringify({ input_type: inputFormat, content })
        });
        
        currentMermaidCode = parseRes.data.mermaid_code;
        const graphData = parseRes.data.graph_data;

        if (graphData && graphData.nodes.length > 0) {
            drawVisNetwork(graphData, selectedTheme);
        } else {
            showToast('No valid flowchart data parsed.', 'error');
        }

        showToast('Rendered successfully!');

    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        renderBtn.textContent = ogText;
        renderBtn.disabled = false;
    }
};

const createDiamondDataURI = (text, palette) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = '600 13px Inter, sans-serif'; 
    
    const wrapText = (text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const cleanText = text.replace(/\n/g, ' ');
    const lines = wrapText(cleanText, 110); 
    
    let textWidth = 0;
    lines.forEach(l => {
        const metrics = ctx.measureText(l);
        if(metrics.width > textWidth) textWidth = metrics.width;
    });

    const lineHeight = 16;
    const textHeight = lines.length * lineHeight; 
    
    const paddingX = 20;
    const paddingY = 20;
    
    let canvasWidth = (textWidth * 2) + paddingX;
    let canvasHeight = (textHeight * 2) + paddingY;
    
    if (canvasWidth < 120) canvasWidth = 120;
    if (canvasHeight < 80) canvasHeight = 80;

    // Retina scale rendering but with correct CSS scaling data payload
    // To make sure Vis-Network doesn't draw it twice as large when `useImageSize: true` is used, 
    // we must NOT multiply the actual canvas.width! We only use scale for internal context.
    // Actually, Vis-Network uses the literal image dimensions in pixels. 
    // So 1x pixel dimensions is the right way for true proportional sizing.
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = palette.nodeBg;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2, 4);
    ctx.lineTo(canvasWidth - 4, canvasHeight/2);
    ctx.lineTo(canvasWidth/2, canvasHeight - 4);
    ctx.lineTo(4, canvasHeight/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = palette.font;
    
    const startY = (canvasHeight / 2) - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
        ctx.fillText(l, canvasWidth/2, startY + (i * lineHeight));
    });
    
    return canvas.toDataURL('image/png');
};

const drawVisNetwork = (data, themeId) => {
    const container = document.getElementById('preview-container');
    container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.id = 'vis-network-canvas';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    container.appendChild(wrapper);

    const palette = THEME_PALETTES[themeId] || THEME_PALETTES['ocean'];
    
    const nodes = new vis.DataSet(data.nodes.map(n => {
        if (n.shape === 'diamond') {
            return {
                id: n.id,
                shape: 'image',
                image: createDiamondDataURI(n.label, palette),
                shapeProperties: { useImageSize: true }
            };
        } else {
            return {
                id: n.id,
                label: n.label,
                shape: 'box',
                margin: { top: 12, right: 18, bottom: 12, left: 18 },
                color: {
                    background: palette.nodeBg,
                    border: palette.border,
                    highlight: { background: palette.border, border: palette.font }
                },
                font: { color: palette.font, face: 'Inter', size: 14, bold: { color: palette.font } },
                borderWidth: 1,
                shadow: { color: 'rgba(0,0,0,0.1)', size: 4, x: 0, y: 3 }
            };
        }
    }));

    const edges = new vis.DataSet(data.edges.map(e => ({
        from: e.from,
        to: e.to,
        label: e.label || '',
        arrows: 'to',
        color: { color: palette.line },
        font: { align: 'middle', background: palette.bg !== '#ffffff' ? '#1e293b' : '#ffffff', color: palette.font, strokeWidth: 0 },
        smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 }
    })));

    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'UD',
                sortMethod: 'directed',
                nodeSpacing: 350,
                levelSeparation: 200
            }
        },
        physics: {
            enabled: false
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true
        }
    };

    network = new vis.Network(wrapper, { nodes, edges }, options);

    // Kunci titik koordinat dan matikan penahan hierarki agar bebas digeser vertikal & horizontal
    network.once('afterDrawing', () => {
        const positions = network.getPositions();
        const updates = Object.keys(positions).map(id => ({
            id: id,
            x: positions[id].x,
            y: positions[id].y
        }));
        
        nodes.update(updates);
        
        network.setOptions({
            layout: {
                hierarchical: {
                    enabled: false
                }
            }
        });
    });
};

const setupEventListeners = () => {
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            inputFormat = tab.dataset.format;
            
            const hint = document.getElementById('input-hint');
            const textarea = document.getElementById('editor-input');
            
            if (inputFormat === 'mermaid') {
                hint.textContent = 'Write your Mermaid.js flowchart code here.';
                textarea.placeholder = "flowchart TD\n    A[Start] --> B[Process]";
            } else {
                hint.textContent = 'Write step-by-step text process (e.g., 1. Start, 2. Process).';
                textarea.placeholder = "1. User opens the app\n2. User logs in\n3. Dashboard is shown";
            }
        });
    });

    document.getElementById('btn-render').addEventListener('click', renderCode);

    document.getElementById('btn-save').addEventListener('click', async () => {
        if (!currentMermaidCode) return showToast('Please render a flowchart first', 'error');
        
        try {
            const title = prompt('Enter flowchart title:', 'My Flowchart');
            if (title === null) return;

            showToast('Generating Vector Base on Backend...');
            
            // To maintain history SVG view compatibility in the DB without breaking the backend
            const renderRes = await apiCall('/flowcharts/render', {
                method: 'POST',
                body: JSON.stringify({ mermaid_code: currentMermaidCode, theme: selectedTheme })
            });

            currentSvgOutput = renderRes.data.svg;
            const content = document.getElementById('editor-input').value;

            await apiCall('/flowcharts', {
                method: 'POST',
                body: JSON.stringify({
                    title: title || 'Untitled',
                    input_type: inputFormat,
                    input_content: content,
                    mermaid_code: currentMermaidCode,
                    theme: selectedTheme,
                    svg_output: currentSvgOutput
                })
            });

            showToast('Saved to history successfully!');
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    document.getElementById('btn-export-png').addEventListener('click', () => {
        if (!network) return showToast('Please render a flowchart first', 'error');
        
        const canvas = document.querySelector('#vis-network-canvas canvas');
        if (!canvas) return showToast('Canvas not found', 'error');

        // Draw an opaque background dynamically for the PNG export
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        
        const palette = THEME_PALETTES[selectedTheme] || THEME_PALETTES['ocean'];
        ctx.fillStyle = palette.bg; // Use theme matching background
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.download = 'flowify-diagram.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
        showToast('Exported successfully!');
    });
};
