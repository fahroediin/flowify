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

let currentMermaidCode = '';
let currentSvgOutput = '';

const renderCode = async () => {
    const content = document.getElementById('editor-input').value;
    if (!content.trim()) return showToast('Input cannot be empty', 'error');

    const renderBtn = document.getElementById('btn-render');
    const ogText = renderBtn.textContent;
    renderBtn.textContent = 'Parsing...';
    renderBtn.disabled = true;

    try {
        // Step 1: Parse to mermaid code if it's text
        let mermaidCode = content;
        if (inputFormat === 'text') {
            const parseRes = await apiCall('/flowcharts/parse', {
                method: 'POST',
                body: JSON.stringify({ input_type: 'text', content })
            });
            mermaidCode = parseRes.data.mermaid_code;
        }

        currentMermaidCode = mermaidCode;

        // Step 2: Render to SVG
        renderBtn.textContent = 'Rendering...';
        const renderRes = await apiCall('/flowcharts/render', {
            method: 'POST',
            body: JSON.stringify({ mermaid_code: mermaidCode, theme: selectedTheme })
        });

        currentSvgOutput = renderRes.data.svg;
        document.getElementById('preview-container').innerHTML = currentSvgOutput;
        showToast('Rendered successfully!');

    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        renderBtn.textContent = ogText;
        renderBtn.disabled = false;
    }
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
        if (!currentSvgOutput) return showToast('Please render a flowchart first', 'error');
        
        try {
            const title = prompt('Enter flowchart title:', 'My Flowchart');
            if (title === null) return;

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

            showToast('Saved to history!');
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    document.getElementById('btn-export-png').addEventListener('click', () => {
        if (!currentSvgOutput) return showToast('Please render a flowchart first', 'error');
        
        const svgElement = document.querySelector('#preview-container svg');
        if (!svgElement) return showToast('SVG not found', 'error');

        try {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Set scale factor for higher resolution PNG
            const scale = 2;
            const viewBox = svgElement.viewBox.baseVal || document.documentElement;
            // Get proper dimensions by parsing viewBox or using boundingClientRect
            const rect = svgElement.getBoundingClientRect();
            const width = viewBox.width || rect.width || 800;
            const height = viewBox.height || rect.height || 600;

            canvas.width = width * scale;
            canvas.height = height * scale;
            
            img.onload = () => {
                ctx.fillStyle = '#ffffff'; // Use white background just in case
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const link = document.createElement('a');
                link.download = 'flowify-diagram.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('Exported successfully!');
            };
            
            // Must encode properly to base64
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        } catch (err) {
            showToast('Failed to export image', 'error');
        }
    });
};
