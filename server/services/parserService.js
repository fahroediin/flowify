exports.parseTextToMermaid = (text) => {
    return exports.parseTextToGraphData(text).mermaid_code;
};

exports.parseTextToGraphData = (text) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    
    let nodes = {}; 
    let edges = []; 
    let nodeMap = {}; 
    let nodeCounter = 1;

    let lastTopLevelId = null;
    let currentLevel = 0;
    let branchCounter = 0;

    const getNode = (cleanText, forceNew = false) => {
        let key = cleanText.toLowerCase();
        if (!nodeMap[key] || forceNew) {
            let id = `Node${nodeCounter++}`;
            if (!forceNew) nodeMap[key] = id;
            nodes[id] = { text: cleanText, type: 'box', level: null, x: null, y: null };
            return id;
        }
        return nodeMap[key];
    };

    lines.forEach(originalLine => {
        const isIndented = /^\s+/.test(originalLine);
        let line = originalLine.trim();

        if (isIndented && lastTopLevelId) {
            branchCounter++;
            nodes[lastTopLevelId].type = 'decision';
            let content = line.replace(/^[-*]\s*/, '').replace(/"/g, "'");
            let condition = "";
            let targetText = content;

            if (content.includes(':')) {
                const parts = content.split(':');
                condition = parts[0].trim();
                targetText = parts.slice(1).join(':').trim();
            }

            let jumpText = "";
            if (targetText.includes('->')) {
                const parts = targetText.split('->');
                targetText = parts[0].trim();
                jumpText = parts.slice(1).join('->').trim();
            }
            
            let targetId = getNode(targetText);
            
            // Smart Level Allocation
            if (branchCounter === 1) {
                currentLevel++; // Cabang utama turun ke bawah (Level selanjutnya)
                if (!nodes[targetId].level || nodes[targetId].x === null) {
                    nodes[targetId].level = currentLevel;
                    nodes[targetId].x = 0;
                    nodes[targetId].y = currentLevel * 200;
                }
            } else {
                // Cabang ekstra disebarkan ke samping (Level statis sebaris decision)
                if (!nodes[targetId].level || nodes[targetId].x === null) {
                    nodes[targetId].level = nodes[lastTopLevelId].level;
                    nodes[targetId].x = branchCounter === 2 ? 350 : -350;
                    nodes[targetId].y = nodes[lastTopLevelId].y;
                }
            }

            edges.push({ from: lastTopLevelId, to: targetId, label: condition });

            if (jumpText) {
                let jumpId = getNode(jumpText);
                edges.push({ from: targetId, to: jumpId, label: "" });
            }
        } else {
            branchCounter = 0;
            currentLevel++;
            
            let cleanText = line.replace(/^(\d+\.|-|\*)\s*/, '').replace(/"/g, "'");
            let jumpText = "";
            if (cleanText.includes('->')) {
                const parts = cleanText.split('->');
                cleanText = parts[0].trim();
                jumpText = parts.slice(1).join('->').trim();
            }

            let id = getNode(cleanText);

            if (!nodes[id].level || nodes[id].x === null) {
                nodes[id].level = currentLevel;
                nodes[id].x = 0;
                nodes[id].y = currentLevel * 200;
            } else {
                currentLevel = nodes[id].level;
            }

            if (lastTopLevelId && nodes[lastTopLevelId].type !== 'decision') {
                edges.push({ from: lastTopLevelId, to: id, label: "" });
            }

            if (jumpText) {
                let jumpId = getNode(jumpText);
                edges.push({ from: id, to: jumpId, label: "" });
            }

            lastTopLevelId = id;
        }
    });

    // Post-process to guarantee ALL nodes have an assigned level to prevent Vis-Network Crash.
    // Jump targets that are never explicitly defined in the main flow list will lack levels.
    let missing = true;
    let iterationLimit = 10;
    let maxLevel = currentLevel + 1;

    while (missing && iterationLimit-- > 0) {
        missing = false;
        Object.keys(nodes).forEach(id => {
            if (!nodes[id].level || nodes[id].x === null) {
                // Try to infer from parent
                let parentEdge = edges.find(e => e.to === id);
                if (parentEdge && nodes[parentEdge.from] && nodes[parentEdge.from].level) {
                    nodes[id].level = nodes[parentEdge.from].level + 1;
                    nodes[id].x = nodes[parentEdge.from].x;
                    nodes[id].y = nodes[parentEdge.from].y + 200;
                } else {
                    missing = true;
                }
            }
        });
        
        // Final fallback if they're isolated or caught in a resolution loop
        if (missing && iterationLimit === 1) {
            Object.keys(nodes).forEach(id => {
                if (!nodes[id].level || nodes[id].x === null) {
                    nodes[id].level = maxLevel++;
                    nodes[id].x = 0;
                    nodes[id].y = nodes[id].level * 200;
                }
            });
        }
    }

    let graphData = { nodes: [], edges: edges, precalculatedLayout: true };
    let mermaid = 'flowchart TD\n';

    Object.keys(nodes).forEach(id => {
        let n = nodes[id];
        let shape = n.type === 'decision' ? 'diamond' : 'box';
        graphData.nodes.push({ id: id, label: n.text, shape: shape, level: n.level, x: n.x, y: n.y });

        if (n.type === 'decision') {
            mermaid += `    ${id}{"${n.text}"}\n`;
        } else {
            mermaid += `    ${id}["${n.text}"]\n`;
        }
    });

    edges.forEach(e => {
        graphData.edges.push({ from: e.from, to: e.to, label: e.label });

        if (e.label) {
            mermaid += `    ${e.from} -->|${e.label}| ${e.to}\n`;
        } else {
            mermaid += `    ${e.from} --> ${e.to}\n`;
        }
    });

    return { mermaid_code: mermaid, graph_data: graphData };
};

exports.parseMermaidToGraphData = (code) => {
    let graphData = { nodes: [], edges: [] };
    let nodesMap = {};
    const lines = code.split('\n');

    lines.forEach(l => {
        let line = l.trim();
        if (!line || line.startsWith('flowchart') || line.startsWith('graph')) return;
        
        const arrowSplit = line.split(/-->/);
        
        if (arrowSplit.length === 2) {
            let left = arrowSplit[0].trim();
            let right = arrowSplit[1].trim();
            let label = "";
            if (right.startsWith('|')) {
                let endBracket = right.indexOf('|', 1);
                if (endBracket > -1) {
                    label = right.substring(1, endBracket).trim();
                    right = right.substring(endBracket + 1).trim();
                }
            }

            const parseNode = (str) => {
                let id = str;
                let text = str;
                let shape = 'box';
                let m = str.match(/([A-Za-z0-9_]+)\s*[\[\{\(](?:["']??)([^"\'\]\}\)]+)/);
                if (m) {
                    id = m[1];
                    text = m[2];
                    if (str.includes('{')) shape = 'diamond';
                }
                return { id, text, shape };
            };

            let n1 = parseNode(left);
            let n2 = parseNode(right);

            if (!nodesMap[n1.id]) {
                nodesMap[n1.id] = true;
                graphData.nodes.push({ id: n1.id, label: n1.text, shape: n1.shape });
            }
            if (!nodesMap[n2.id]) {
                nodesMap[n2.id] = true;
                graphData.nodes.push({ id: n2.id, label: n2.text, shape: n2.shape });
            }
            graphData.edges.push({ from: n1.id, to: n2.id, label: label });
        } else {
             let m = line.match(/([A-Za-z0-9_]+)\s*[\[\{\(](?:["']??)([^"\'\]\}\)]+)/);
             if (m && !line.includes('classDef') && !line.includes('style')) {
                 let id = m[1];
                 if (!nodesMap[id]) {
                     nodesMap[id] = true;
                     let shape = line.includes('{') ? 'diamond' : 'box';
                     graphData.nodes.push({ id: id, label: m[2], shape: shape });
                 }
             }
        }
    });

    return graphData;
};
