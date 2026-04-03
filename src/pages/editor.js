import { apiCall } from '../utils/api.js';
import { logout } from '../utils/auth.js';
import { showToast } from '../main.js';

let currentThemes = [];
let selectedTheme = 'ocean';
let inputFormat = 'mermaid';

const DEFAULT_SAMPLES = [
    {
        id: 'sample-text-1',
        title: 'E-Commerce',
        format: 'text',
        content: `1. Buka Aplikasi Toko Online\n2. Cari Produk\n3. Pilih Produk\n4. Apakah Stok Tersedia?\n  - Ya: Tambahkan ke Keranjang -> Buka Keranjang\n  - Tidak: Tampilkan Peringatan Stok Habis -> Cari Produk\n5. Buka Keranjang\n6. Lanjut ke Checkout\n7. Apakah Saldo Mencukupi?\n  - Cukup: Lakukan Pembayaran -> Apakah Pembayaran Diverifikasi?\n  - Kurang: Tampilkan Error Saldo -> Buka Keranjang\n8. Apakah Pembayaran Diverifikasi?\n  - Sukses: Terbitkan Invoice -> Pesanan Diproses\n  - Gagal: Kirim Notifikasi Gagal -> Lanjut ke Checkout\n9. Pesanan Diproses\n10. Selesai`
    },
    {
        id: 'sample-text-2',
        title: 'Klinik Apotek',
        format: 'text',
        content: `1. Pasien Datang\n2. Pendaftaran di Resepsionis\n3. Pemeriksaan oleh Dokter\n4. Apakah Butuh Obat?\n  - Ya: Dokter Berikan Resep -> Bawa Resep ke Apotek\n  - Tidak: Pasien ke Kasir -> Pembayaran Pemeriksaan\n5. Bawa Resep ke Apotek\n6. Ambil Obat\n7. Pasien ke Kasir\n8. Pembayaran Pemeriksaan dan Obat\n9. Selesai\n10. Pembayaran Pemeriksaan -> Selesai`
    },
    {
        id: 'sample-text-3',
        title: 'E-KYC Selfie',
        format: 'text',
        content: `1. Mulai Proses E-KYC\n2. Buka Kamera\n3. Deteksi Wajah Awal\n4. Instruksi Hadap Depan\n5. Apakah Wajah Valid?\n  - Ya: Simpan Gambar Depan -> Instruksi Hadap Kiri\n  - Tidak: Tampilkan Error -> Instruksi Hadap Depan\n6. Instruksi Hadap Kiri\n7. Apakah Wajah Kiri Valid?\n  - Ya: Simpan Gambar Kiri -> Instruksi Hadap Kanan\n  - Tidak: Tampilkan Error Kiri -> Instruksi Hadap Kiri\n8. Instruksi Hadap Kanan\n9. Apakah Wajah Kanan Valid?\n  - Ya: Ekstrak Data ke Base64 -> Kirim ke Backend API\n  - Tidak: Tampilkan Error Kanan -> Instruksi Hadap Kanan\n10. Kirim ke Backend API\n11. E-KYC Selesai`
    },
    {
        id: 'sample-mermaid-1',
        title: 'E-Commerce',
        format: 'mermaid',
        content: `flowchart TD\n    Node1[Buka Aplikasi Toko Online]\n    Node2[Cari Produk]\n    Node3[Pilih Produk]\n    Node4{Apakah Stok Tersedia?}\n    Node5[Tambahkan ke Keranjang]\n    Node6[Buka Keranjang]\n    Node7[Lanjut ke Checkout]\n    Node8{Apakah Saldo Mencukupi?}\n    Node9[Lakukan Pembayaran]\n    Node10{Apakah Pembayaran Diverifikasi?}\n    Node11[Tampilkan Peringatan Stok Habis]\n    Node12[Tampilkan Error Saldo]\n    Node13[Terbitkan Invoice]\n    Node14[Pesanan Diproses]\n    Node15[Kirim Notifikasi Gagal]\n    Node16[Selesai]\n\n    Node1 --> Node2\n    Node2 --> Node3\n    Node3 --> Node4\n    \n    Node4 -->|Ya| Node5\n    Node4 -->|Tidak| Node11\n    Node5 --> Node6\n    Node11 --> Node2\n    \n    Node6 --> Node7\n    Node7 --> Node8\n    \n    Node8 -->|Cukup| Node9\n    Node8 -->|Kurang| Node12\n    Node9 --> Node10\n    Node12 --> Node6\n    \n    Node10 -->|Sukses| Node13\n    Node10 -->|Gagal| Node15\n    Node13 --> Node14\n    Node15 --> Node7\n    \n    Node14 --> Node16`
    },
    {
        id: 'sample-mermaid-2',
        title: 'Klinik Apotek',
        format: 'mermaid',
        content: `flowchart TD\n    A[Pasien Datang] --> B[Pendaftaran di Resepsionis]\n    B --> C[Pemeriksaan oleh Dokter]\n    C --> D{Apakah Butuh Obat?}\n    D -->|Ya| E[Dokter Berikan Resep]\n    D -->|Tidak| H[Pasien ke Kasir]\n    E --> F[Bawa Resep ke Apotek]\n    F --> G[Ambil Obat]\n    G --> H\n    H --> I[Pembayaran Pemeriksaan dan Obat]\n    I --> J[Selesai]`
    },
    {
        id: 'sample-mermaid-3',
        title: 'E-KYC Selfie',
        format: 'mermaid',
        content: `flowchart TD\n    A[Mulai Proses E-KYC] --> B[Buka Kamera]\n    B --> C[Deteksi Wajah Awal]\n    C --> D[Instruksi Hadap Depan]\n    D --> E{Apakah Wajah Valid?}\n    E -->|Ya| F[Simpan Gambar Depan]\n    E -->|Tidak| G[Tampilkan Error]\n    G --> D\n    F --> H[Instruksi Hadap Kiri]\n    H --> I{Apakah Wajah Kiri Valid?}\n    I -->|Ya| J[Simpan Gambar Kiri]\n    I -->|Tidak| K[Tampilkan Error Kiri]\n    K --> H\n    J --> L[Instruksi Hadap Kanan]\n    L --> M{Apakah Wajah Kanan Valid?}\n    M -->|Ya| N[Ekstrak Data ke Base64]\n    M -->|Tidak| O[Tampilkan Error Kanan]\n    O --> L\n    N --> P[Kirim ke Backend API]\n    P --> Q[E-KYC Selesai]`
    },
    {
        id: 'sample-text-4',
        title: 'Swimlane Sales',
        format: 'text',
        content: `1. @Customer: Submit Purchase Order\n2. @Sales: Proses PO\n3. @Contracts: Cek Order\n4. Apakah Order Valid?\n  - Ya: @Legal: Legal Approves -> @Fulfillment: Kirim Pesanan\n  - Tidak: @Sales: Hubungi Customer\n5. Kirim Pesanan\n6. Selesai`
    },
    {
        id: 'sample-mermaid-4',
        title: 'Swimlane Sales',
        format: 'mermaid',
        content: `flowchart TD\n    subgraph Customer\n        A[Submit Purchase Order]\n    end\n    subgraph Sales\n        B[Proses PO]\n        E[Hubungi Customer]\n    end\n    subgraph Contracts\n        C{Apakah Order Valid?}\n    end\n    subgraph Legal\n        D[Legal Approves]\n    end\n    subgraph Fulfillment\n        F[Kirim Pesanan]\n        G[Selesai]\n    end\n    A --> B\n    B --> C\n    C -->|Ya| D\n    C -->|Tidak| E\n    D --> F\n    F --> G\n    E --> A`
    }
];

const userSamples = DEFAULT_SAMPLES;

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
                
                <div id="samples-list" class="samples-bar"></div>
                
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

        <!-- History Modal -->
        <div id="history-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div style="background: var(--bg-panel); width: 800px; max-width: 90%; max-height: 80vh; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-hover);">
                    <h3 style="margin: 0; font-size: 1.2rem;">Your Flowcharts</h3>
                    <button id="btn-close-modal" style="background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
                </div>
                <div style="padding: 1rem; flex: 1; overflow-y: auto;" id="history-list"></div>
            </div>
        </div>
    `;

    setupEventListeners();
    await loadThemes();
    renderSamples();
};

const renderSamples = () => {
    const list = document.getElementById('samples-list');
    if (!list) return;
    
    const relevantSamples = userSamples.filter(s => s.format === inputFormat);

    if (relevantSamples.length === 0) {
        list.style.display = 'none';
        return;
    }
    list.style.display = 'flex';

    list.innerHTML = `
        <span class="samples-label">Load Sample:</span>
        <div class="samples-scroll">
            ${relevantSamples.map(sample => `
                <button class="sample-pill" data-id="${sample.id}">${sample.title}</button>
            `).join('')}
        </div>
    `;

    list.querySelectorAll('.sample-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = userSamples.find(s => s.id === btn.dataset.id);
            if (sample) {
                inputFormat = sample.format;
                
                // Switch tab UI
                document.querySelectorAll('.tab').forEach(t => {
                    if (t.dataset.format === sample.format) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
                
                const hint = document.getElementById('input-hint');
                const textarea = document.getElementById('editor-input');
                
                if (inputFormat === 'mermaid') {
                    hint.textContent = 'Write your Mermaid.js flowchart code here.';
                } else {
                    hint.textContent = 'Write step-by-step text process (e.g., 1. Start, 2. Process).';
                }
                
                textarea.value = sample.content;
                showToast(`Loaded sample: ${sample.title}`);
                renderCode();
            }
        });
    });
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
                
                // If flowchart is already drawn, hot-reload theme without destroying user-adjusted positions
                if (network && visNodes) {
                    updateNetworkTheme(selectedTheme);
                } else {
                    const val = document.getElementById('editor-input').value;
                    if (val.trim()) {
                        renderCode();
                    }
                }
            });
        });
    } catch (e) {
        showToast('Failed to load themes', 'error');
    }
};

const THEME_PALETTES = {
    'ocean': { bg: '#0f172a', nodeBg: '#bae6fd', border: '#0284c7', font: '#0369a1', line: '#0ea5e9', laneEven: 'rgba(14, 165, 233, 0.05)', laneOdd: 'rgba(14, 165, 233, 0.1)', laneBorder: 'rgba(14, 165, 233, 0.3)', laneText: '#7dd3fc' },
    'sunset': { bg: '#0f172a', nodeBg: '#fed7aa', border: '#ea580c', font: '#9a3412', line: '#f97316', laneEven: 'rgba(249, 115, 22, 0.05)', laneOdd: 'rgba(249, 115, 22, 0.1)', laneBorder: 'rgba(249, 115, 22, 0.3)', laneText: '#fdba74' },
    'forest': { bg: '#0f172a', nodeBg: '#bbf7d0', border: '#15803d', font: '#166534', line: '#22c55e', laneEven: 'rgba(34, 197, 94, 0.05)', laneOdd: 'rgba(34, 197, 94, 0.1)', laneBorder: 'rgba(34, 197, 94, 0.3)', laneText: '#86efac' },
    'midnight': { bg: '#0f172a', nodeBg: '#312e81', border: '#6366f1', font: '#e0e7ff', line: '#8b5cf6', laneEven: 'rgba(99, 102, 241, 0.08)', laneOdd: 'rgba(99, 102, 241, 0.15)', laneBorder: 'rgba(99, 102, 241, 0.4)', laneText: '#a5b4fc' },
    'corporate': { bg: '#0f172a', nodeBg: '#e2e8f0', border: '#475569', font: '#0f172a', line: '#334155', laneEven: 'rgba(148, 163, 184, 0.08)', laneOdd: 'rgba(148, 163, 184, 0.15)', laneBorder: 'rgba(148, 163, 184, 0.4)', laneText: '#cbd5e1' },
    'pastel': { bg: '#0f172a', nodeBg: '#f1f5f9', border: '#cbd5e1', font: '#475569', line: '#94a3b8', laneEven: 'rgba(203, 213, 225, 0.08)', laneOdd: 'rgba(203, 213, 225, 0.15)', laneBorder: 'rgba(203, 213, 225, 0.4)', laneText: '#e2e8f0' },
    'monochrome': { bg: '#ffffff', nodeBg: '#ffffff', border: '#000000', font: '#000000', line: '#000000', laneEven: 'rgba(0,0,0,0.05)', laneOdd: 'rgba(0,0,0,0.1)', laneBorder: 'rgba(0,0,0,0.3)', laneText: '#333333' }
};

let currentMermaidCode = '';
let currentSvgOutput = '';
let network = null;
let visNodes = null;
let visEdges = null;
let currentLanes = null;
let currentLaneDirection = 'vertical';

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

const updateNetworkTheme = (themeId) => {
    if (!visNodes || !visEdges) return;
    const palette = THEME_PALETTES[themeId] || THEME_PALETTES['ocean'];
    
    const nodeUpdates = visNodes.get().map(n => {
        if (n.shape === 'image') {
            return {
                id: n.id,
                image: createDiamondDataURI(n.originalLabel, palette)
            };
        } else {
            return {
                id: n.id,
                color: {
                    background: palette.nodeBg,
                    border: palette.border,
                    highlight: { background: palette.border, border: palette.font }
                },
                font: { color: palette.font, face: 'Inter', size: 14, bold: { color: palette.font } }
            };
        }
    });

    const edgeUpdates = visEdges.get().map(e => {
        let nodeFrom = visNodes.get(e.from);
        let nodeTo = visNodes.get(e.to);
        let labelText = e.label || '';
        
        // Re-calculate padding if needed or keep existing
        return {
            id: e.id,
            color: { color: palette.line },
            font: { 
                align: 'middle', 
                background: 'rgba(0,0,0,0)',
                color: palette.laneText, 
                strokeWidth: 4, 
                strokeColor: palette.bg,
                size: 13,
                face: 'Inter'
            }
        };
    });

    visNodes.update(nodeUpdates);
    visEdges.update(edgeUpdates);

    // Batalkan status pemilihan/fokus (Highlight) karena node yang ditarik 
    // akan terus berstatus "Selected" dan memberikan ilusi warnanya tertinggal.
    if (network) {
        network.unselectAll();
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
        if (metrics.width > textWidth) textWidth = metrics.width;
    });

    const lineHeight = 16;
    const textHeight = lines.length * lineHeight; 
    
    const paddingX = 20;
    const paddingY = 20;
    
    let canvasWidth = (textWidth * 2) + paddingX;
    let canvasHeight = (textHeight * 2) + paddingY;
    
    if (canvasWidth < 120) canvasWidth = 120;
    if (canvasHeight < 80) canvasHeight = 80;

    // Build SVG string for INFINITE vector scalability
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">`;
    const defs = `<defs><filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.1"/></filter></defs>`;
    const rect = `<polygon points="${canvasWidth/2},4 ${canvasWidth-4},${canvasHeight/2} ${canvasWidth/2},${canvasHeight-4} 4,${canvasHeight/2}" fill="${palette.nodeBg}" stroke="${palette.border}" stroke-width="2" filter="url(#ds)"/>`;
    
    let textEls = '';
    const startY = (canvasHeight / 2) - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
        textEls += `<text x="${canvasWidth/2}" y="${startY + (i * lineHeight)}" font-family="Inter, sans-serif" font-weight="600" font-size="13px" fill="${palette.font}" text-anchor="middle" dominant-baseline="central">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
    });

    const svgString = `${svgHeader}${defs}${rect}${textEls}</svg>`;
    
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
};

const drawSwimlaneBackground = (ctx, lanes, direction, palette, minX, maxX, minY, maxY) => {
    const laneCount = lanes.length;
    if (!laneCount) return;
    ctx.save();
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (!Number.isFinite(minY)) minY = -200;
    if (!Number.isFinite(maxY)) maxY = 1000;
    if (!Number.isFinite(minX)) minX = -300;
    if (!Number.isFinite(maxX)) maxX = 1000;

    lanes.forEach((laneName, index) => {
        const isEven = index % 2 === 0;
        ctx.fillStyle = isEven ? palette.laneEven : palette.laneOdd;
        ctx.strokeStyle = palette.laneBorder;
        ctx.lineWidth = 1;
        if (direction === 'horizontal') {
            const laneY = (index * 250) - 125;
            ctx.fillRect(minX, laneY, maxX - minX, 250);
            if (index > 0) {
                ctx.beginPath(); ctx.moveTo(minX, laneY); ctx.lineTo(maxX, laneY); ctx.stroke();
            }
            ctx.fillStyle = palette.laneBorder;
            ctx.fillRect(minX, laneY, 150, 250);
            ctx.save();
            ctx.translate(minX + 75, laneY + 125);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = palette.laneText;
            ctx.fillText(laneName, 0, 0);
            ctx.restore();
        } else {
            const laneX = (index * 400) - 200;
            ctx.fillRect(laneX, minY, 400, maxY - minY);
            if (index > 0) {
                ctx.beginPath(); ctx.moveTo(laneX, minY); ctx.lineTo(laneX, maxY); ctx.stroke();
            }
            ctx.fillStyle = palette.laneBorder;
            ctx.fillRect(laneX, minY, 400, 50);
            ctx.fillStyle = palette.laneText;
            ctx.fillText(laneName, laneX + 200, minY + 25);
        }
    });
    ctx.restore();
};

const drawVisNetwork = (data, themeId) => {
    currentLanes = data.lanes || null;
    currentLaneDirection = data.laneDirection || 'vertical';

    const container = document.getElementById('preview-container');
    container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.id = 'vis-network-canvas';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    container.appendChild(wrapper);

    const palette = THEME_PALETTES[themeId] || THEME_PALETTES['ocean'];
    
    visNodes = new vis.DataSet(data.nodes.map(n => {
        if (n.shape === 'diamond') {
            return {
                id: n.id,
                level: n.level !== null ? n.level : undefined,
                x: n.x !== null ? n.x : undefined,
                y: n.y !== null ? n.y : undefined,
                shape: 'image',
                image: createDiamondDataURI(n.label, palette),
                shapeProperties: { useImageSize: true },
                originalLabel: n.label
            };
        } else {
            return {
                id: n.id,
                level: n.level !== null ? n.level : undefined,
                x: n.x !== null ? n.x : undefined,
                y: n.y !== null ? n.y : undefined,
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

    visEdges = new vis.DataSet(data.edges.map(e => {
        let nodeFrom = data.nodes.find(n => n.id === e.from);
        let nodeTo = data.nodes.find(n => n.id === e.to);
        
        let forceDir = currentLaneDirection === 'horizontal' ? 'horizontal' : 'vertical';
        let smoothType = 'cubicBezier';
        let roundness = 0.4;

        if (forceDir === 'vertical' && nodeFrom && nodeTo && nodeFrom.y !== undefined && nodeTo.y !== undefined && Math.abs(nodeFrom.y - nodeTo.y) < 20) {
             forceDir = 'horizontal';
             // Workaround vis.js bug where cubicBezier path math fails for exactly horizontal nodes, detaching the label to (0,0)
             if (Math.abs(nodeFrom.y - nodeTo.y) < 1) {
                 smoothType = 'curvedCW';
                 roundness = 0.2;
             }
        }

        let labelText = e.label || '';
        // Add horizontal offset for cross-lane labels to push them inside the lane
        if (labelText && nodeFrom && nodeTo && nodeFrom.lane && nodeTo.lane && nodeFrom.lane !== nodeTo.lane) {
            const lanes = currentLanes || [];
            const fromIdx = lanes.indexOf(nodeFrom.lane);
            const toIdx = lanes.indexOf(nodeTo.lane);
            if (fromIdx !== -1 && toIdx !== -1) {
                if (toIdx < fromIdx) {
                    labelText = labelText + "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";
                } else {
                    labelText = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0" + labelText;
                }
            }
        }
        
        return {
            from: e.from,
            to: e.to,
            label: labelText,
            arrows: 'to',
            color: { color: palette.line },
            font: { 
                align: 'middle', 
                background: 'rgba(0,0,0,0)', // Invisible background box
                color: palette.laneText, 
                strokeWidth: 4, 
                strokeColor: palette.bg, // Halo effect
                size: 13,
                face: 'Inter'
            },
            smooth: { type: smoothType, forceDirection: forceDir, roundness: roundness }
        };
    }));

    const options = {
        layout: {
            hierarchical: data.precalculatedLayout ? false : {
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

    network = new vis.Network(wrapper, { nodes: visNodes, edges: visEdges }, options);

    network.on('beforeDrawing', (ctx) => {
        if (currentLanes && currentLanes.length > 0) {
            const positions = network.getPositions();
            let yVals = Object.values(positions).map(p => p.y);
            let minY = yVals.length ? Math.min(...yVals) - 150 : -150;
            let maxY = yVals.length ? Math.max(...yVals) + 150 : 1000;

            let xVals = Object.values(positions).map(p => p.x);
            let minX = xVals.length ? Math.min(...xVals) - 250 : -250;
            let maxX = xVals.length ? Math.max(...xVals) + 250 : 1000;

            drawSwimlaneBackground(ctx, currentLanes, currentLaneDirection, THEME_PALETTES[themeId] || THEME_PALETTES['ocean'], minX, maxX, minY, maxY);
        }
    });

    // Kunci titik koordinat dan matikan penahan hierarki agar bebas digeser vertikal & horizontal
    network.once('afterDrawing', () => {
        const positions = network.getPositions();
        const updates = Object.keys(positions).map(id => ({
            id: id,
            x: positions[id].x,
            y: positions[id].y
        }));
        
        visNodes.update(updates);
        
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
            renderSamples();
        });
    });

    document.getElementById('btn-render').addEventListener('click', renderCode);

    const modal = document.getElementById('history-modal');
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('btn-history').addEventListener('click', async () => {
        modal.style.display = 'flex';
        const listContainer = document.getElementById('history-list');
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Memuat daftar riwayat...</p>';
        try {
            const res = await apiCall('/flowcharts?limit=50');
            const data = res.data.flowcharts;
            if (data.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Belum ada riwayat tersimpan.</p>';
            } else {
                listContainer.innerHTML = data.map(item => `
                    <div style="padding: 1rem; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; background: var(--bg-main);">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">${item.title}</h4>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(item.created_at).toLocaleString()} • Tema: ${item.theme} • Format: ${item.input_type}</span>
                        </div>
                        <button class="primary btn-load-history" data-id="${item.id}">Buka</button>
                    </div>
                `).join('');

                document.querySelectorAll('.btn-load-history').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.target.textContent = 'Membuka...';
                        try {
                            const id = e.target.dataset.id;
                            const hRes = await apiCall(`/flowcharts/${id}`);
                            const detail = hRes.data;
                            
                            const targetTab = document.querySelector(`.tab[data-format="${detail.input_type}"]`);
                            if (targetTab) targetTab.click();
                            
                            document.getElementById('editor-input').value = detail.input_content;
                            
                            // Update indikator UI Tema tanpa trigger click event
                            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                            const targetTheme = document.querySelector(`.theme-btn[data-theme="${detail.theme}"]`);
                            if (targetTheme) targetTheme.classList.add('active');
                            
                            selectedTheme = detail.theme;
                            
                            // Paksa render ulang skema baru menggantikan canvas yang lama
                            renderCode();
                            
                            modal.style.display = 'none';
                        } catch (err) {
                            showToast('Gagal memuat riwayat', 'error');
                            e.target.textContent = 'Buka';
                        }
                    });
                });
            }
        } catch (e) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--danger); margin-top: 2rem;">Gagal mengambil data dari DB.</p>';
        }
    });

    document.getElementById('btn-save').addEventListener('click', async () => {
        if (!currentMermaidCode) return showToast('Please render a flowchart first', 'error');
        
        const saveBtn = document.getElementById('btn-save');
        const ogText = saveBtn.textContent;

        try {
            const title = prompt('Enter flowchart title:', 'My Flowchart');
            if (title === null) return;

            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

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
        } finally {
            saveBtn.textContent = ogText;
            saveBtn.disabled = false;
        }
    });

    document.getElementById('btn-export-png').addEventListener('click', () => {
        if (!network || !visNodes) return showToast('Please render a flowchart first', 'error');

        const positions = network.getPositions();
        const keys = Object.keys(positions);
        if (keys.length === 0) return showToast('Flowchart is empty', 'error');

        showToast('Generating high-resolution export, please wait...');

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        keys.forEach(id => {
            const box = network.getBoundingBox(id);
            if (box.left < minX) minX = box.left;
            if (box.right > maxX) maxX = box.right;
            if (box.top < minY) minY = box.top;
            if (box.bottom > maxY) maxY = box.bottom;
        });

        if (currentLanes && currentLanes.length > 0) {
            if (currentLaneDirection === 'vertical') {
                minY -= 150;
                maxY += 150;
                minX = Math.min(minX, -200);
                maxX = Math.max(maxX, (currentLanes.length * 400) - 200);
            } else {
                minX -= 250;
                maxX += 250;
                minY = Math.min(minY, -125);
                maxY = Math.max(maxY, (currentLanes.length * 250) - 125);
            }
        }

        const padding = 60;
        const graphW = Math.abs(maxX - minX) + (padding * 2);
        const graphH = Math.abs(maxY - minY) + (padding * 2);

        // Skala 3x lipat untuk kejernihan maksimal resolusi Ultra Tinggi
        const scaleMultiplier = 3; 

        const wrapper = document.getElementById('vis-network-canvas');
        const origWidth = wrapper.style.width;
        const origHeight = wrapper.style.height;
        const origPos = wrapper.style.position;
        const origTop = wrapper.style.top;
        const origLeft = wrapper.style.left;
        
        const oldViewPos = network.getViewPosition();
        const oldScale = network.getScale();

        // Lepaskan kanvas dari ruang tampilan dan renggangkan ukurannya jadi raksasa
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-9999px';
        wrapper.style.left = '-9999px';
        wrapper.style.width = (graphW * scaleMultiplier) + 'px';
        wrapper.style.height = (graphH * scaleMultiplier) + 'px';
        
        network.setSize((graphW * scaleMultiplier) + 'px', (graphH * scaleMultiplier) + 'px');
        network.redraw();
        // Paksa Vis-Network mengatur ulang skala tata letak keseluruhan secara proporsional ke kanvas raksasa
        network.fit({ animation: false });

        setTimeout(() => {
            const canvas = wrapper.querySelector('canvas');
            if (!canvas) {
                // Restore in case of failure
                wrapper.style.width = origWidth;
                wrapper.style.height = origHeight;
                wrapper.style.position = origPos;
                return showToast('Canvas manipulation failed', 'error');
            }

            const link = document.createElement('a');
            link.download = 'flowify-diagram-transparent.png';
            link.href = canvas.toDataURL('image/png'); // Latar belakang transparan bawaan HTML5 Canvas
            link.click();
            
            // Kembalikan seluruh posisi asli untuk pengguna
            wrapper.style.width = origWidth;
            wrapper.style.height = origHeight;
            wrapper.style.position = origPos;
            wrapper.style.top = origTop;
            wrapper.style.left = origLeft;
            network.setSize(origWidth || '100%', origHeight || '100%');
            network.redraw();
            network.moveTo({ position: oldViewPos, scale: oldScale, animation: false });
            
            showToast('Exported Transparent PNG Successfully!');
        }, 500); 
    });
};
