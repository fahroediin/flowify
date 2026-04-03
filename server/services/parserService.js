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

    let lanes = [];
    let laneDirection = 'vertical';

    if (lines.length > 0 && lines[0].trim().toLowerCase().startsWith('@direction:')) {
        let dirConfig = lines.shift().trim().substring(11).trim().toUpperCase();
        if (dirConfig === 'LR' || dirConfig === 'HORIZONTAL') laneDirection = 'horizontal';
    }

    const getNode = (cleanText, forceNew = false, fallbackLane = null) => {
        let key = cleanText.toLowerCase();
        let lane = fallbackLane;
        let actualText = cleanText;

        if (cleanText.includes('@') && cleanText.includes(':')) {
            const firstColon = cleanText.indexOf(':');
            if (firstColon > -1 && cleanText.trim().startsWith('@')) {
                lane = cleanText.substring(1, firstColon).trim();
                actualText = cleanText.substring(firstColon + 1).trim();
                key = actualText.toLowerCase();
                if (!lanes.includes(lane)) lanes.push(lane);
            }
        }

        if (!nodeMap[key] || forceNew) {
            let id = `Node${nodeCounter++}`;
            if (!forceNew) nodeMap[key] = id;
            nodes[id] = { text: actualText, type: 'box', level: null, level_x: null, level_y: null, lane: lane };
            return id;
        } else if (lane && !nodes[nodeMap[key]].lane) {
            nodes[nodeMap[key]].lane = lane;
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
                const firstColon = content.indexOf(':');
                if (firstColon > -1) {
                    let potentialCondition = content.substring(0, firstColon).trim();
                    if (!potentialCondition.startsWith('@')) {
                        condition = potentialCondition;
                        targetText = content.substring(firstColon + 1).trim();
                    }
                }
            }

            let jumpText = "";
            if (targetText.includes('->')) {
                const parts = targetText.split('->');
                targetText = parts[0].trim();
                jumpText = parts.slice(1).join('->').trim();
            }
            
            let targetFallback = nodes[lastTopLevelId] ? nodes[lastTopLevelId].lane : null;
            let targetId = getNode(targetText, false, targetFallback);
            
            if (branchCounter === 1) {
                currentLevel++; 
                if (!nodes[targetId].level || nodes[targetId].level_y === null) {
                    nodes[targetId].level = currentLevel;
                    nodes[targetId].level_y = currentLevel * 200;
                    nodes[targetId].level_x = 0;
                }
            } else {
                // Place at same level as first branch (one below decision), offset right
                if (!nodes[targetId].level || nodes[targetId].level_y === null) {
                    nodes[targetId].level = currentLevel;
                    nodes[targetId].level_x = branchCounter === 2 ? 350 : -350;
                    nodes[targetId].level_y = currentLevel * 200;
                }
            }

            edges.push({ from: lastTopLevelId, to: targetId, label: condition });

            if (jumpText) {
                let jumpFallback = nodes[targetId] ? nodes[targetId].lane : null;
                let jumpId = getNode(jumpText, false, jumpFallback);
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

            let fallbackLane = lastTopLevelId && nodes[lastTopLevelId] ? nodes[lastTopLevelId].lane : null;
            let id = getNode(cleanText, false, fallbackLane);

            // Always assign position from top-level step order.
            // This prevents currentLevel from resetting to an old branch position,
            // which would cause subsequent new nodes to collide with existing ones.
            nodes[id].level = currentLevel;
            nodes[id].level_x = 0;
            nodes[id].level_y = currentLevel * 200;

            if (lastTopLevelId && nodes[lastTopLevelId].type !== 'decision') {
                edges.push({ from: lastTopLevelId, to: id, label: "" });
            }

            if (jumpText) {
                let jumpFallback = nodes[id] ? nodes[id].lane : null;
                let jumpId = getNode(jumpText, false, jumpFallback);
                edges.push({ from: id, to: jumpId, label: "" });
            }

            lastTopLevelId = id;
        }
    });

    let missing = true;
    let iterationLimit = 10;
    let maxLevel = currentLevel + 1;

    while (missing && iterationLimit-- > 0) {
        missing = false;
        Object.keys(nodes).forEach(id => {
            if (!nodes[id].level || nodes[id].level_y === null) {
                let parentEdge = edges.find(e => e.to === id);
                if (parentEdge && nodes[parentEdge.from] && nodes[parentEdge.from].level) {
                    nodes[id].level = nodes[parentEdge.from].level + 1;
                    nodes[id].level_x = nodes[parentEdge.from].level_x;
                    nodes[id].level_y = nodes[parentEdge.from].level_y + 200;
                } else {
                    missing = true;
                }
            }
        });
        
        if (missing && iterationLimit === 1) {
            Object.keys(nodes).forEach(id => {
                if (!nodes[id].level || nodes[id].level_y === null) {
                    nodes[id].level = maxLevel++;
                    nodes[id].level_x = 0;
                    nodes[id].level_y = nodes[id].level * 200;
                }
            });
        }
    }

    // Collision resolution pass: detect and fix overlapping node positions
    const posMap = {};
    Object.keys(nodes).forEach(id => {
        const key = `${nodes[id].level_x},${nodes[id].level_y}`;
        if (!posMap[key]) posMap[key] = [];
        posMap[key].push(id);
    });
    Object.values(posMap).forEach(group => {
        if (group.length > 1) {
            // Spread overlapping nodes horizontally
            group.forEach((id, i) => {
                if (i > 0) {
                    nodes[id].level_x += i * 350;
                }
            });
        }
    });

    let graphData = { nodes: [], edges: edges, precalculatedLayout: true };
    if (lanes.length > 0) {
        graphData.lanes = lanes;
        graphData.laneDirection = laneDirection;
    }

    let mermaid = `flowchart ${laneDirection === 'horizontal' ? 'LR' : 'TD'}\n`;

    const processNode = (id, n) => {
        let shape = n.type === 'decision' ? 'diamond' : 'box';
        
        let finalX = n.level_x;
        let finalY = n.level_y;
        
        if (lanes.length > 0 && n.lane) {
            let laneIndex = lanes.indexOf(n.lane);
            if (laneDirection === 'horizontal') {
                finalX = n.level_y;
                finalY = laneIndex * 250;
            } else {
                 finalX = laneIndex * 400;
                 finalY = n.level_y;
            }
        } else if (lanes.length > 0 && !n.lane) {
            if (laneDirection === 'horizontal') {
                finalX = n.level_y; 
                finalY = lanes.length * 250;
            } else {
                 finalX = lanes.length * 400; 
                 finalY = n.level_y;
            }
        } else if (laneDirection === 'horizontal' && lanes.length === 0) {
             finalX = n.level_y;
             finalY = n.level_x;
        }

        graphData.nodes.push({ id: id, label: n.text, shape: shape, level: n.level, x: finalX, y: finalY, lane: n.lane });

        if (n.type === 'decision') {
            return `        ${id}{"${n.text}"}\n`;
        } else {
            return `        ${id}["${n.text}"]\n`;
        }
    };

    if (lanes.length > 0) {
        lanes.forEach(lane => {
            mermaid += `    subgraph ${lane.replace(/\s+/g, '_')}["${lane}"]\n`;
            Object.keys(nodes).forEach(id => {
                if (nodes[id].lane === lane) {
                    mermaid += processNode(id, nodes[id]);
                }
            });
            mermaid += `    end\n`;
        });
        
        Object.keys(nodes).forEach(id => {
            if (!nodes[id].lane) {
                mermaid += processNode(id, nodes[id]).substring(4);
            }
        });
    } else {
        Object.keys(nodes).forEach(id => {
            mermaid += processNode(id, nodes[id]).substring(4);
        });
    }

    edges.forEach(e => {
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
    let lanes = [];
    let currentLane = null;
    let laneDirection = 'vertical';

    lines.forEach(l => {
        let line = l.trim();
        if (!line) return;
        
        if (line.startsWith('flowchart LR') || line.startsWith('graph LR')) laneDirection = 'horizontal';
        
        if (line.startsWith('subgraph ')) {
            let m = line.match(/subgraph\s+([A-Za-z0-9_]+)(?:\s*\["([^"]+)"\])?/);
            if (m) {
                 currentLane = m[2] || m[1];
                 if (!lanes.includes(currentLane)) lanes.push(currentLane);
            }
            return;
        }
        if (line === 'end') {
            currentLane = null;
            return;
        }

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
                return { id, text, shape, lane: currentLane };
            };

            let n1 = parseNode(left);
            let n2 = parseNode(right);

            if (!nodesMap[n1.id]) {
                nodesMap[n1.id] = { id: n1.id, label: n1.text, shape: n1.shape, lane: currentLane };
                graphData.nodes.push(nodesMap[n1.id]);
            } else if (currentLane && !nodesMap[n1.id].lane) {
                nodesMap[n1.id].lane = currentLane;
            }
            
            if (!nodesMap[n2.id]) {
                nodesMap[n2.id] = { id: n2.id, label: n2.text, shape: n2.shape, lane: currentLane };
                graphData.nodes.push(nodesMap[n2.id]);
            } else if (currentLane && !nodesMap[n2.id].lane) {
                nodesMap[n2.id].lane = currentLane;
            }

            graphData.edges.push({ from: n1.id, to: n2.id, label: label });
        } else {
             let m = line.match(/([A-Za-z0-9_]+)\s*[\[\{\(](?:["']??)([^"\'\]\}\)]+)/);
             if (m && !line.includes('classDef') && !line.includes('style')) {
                 let id = m[1];
                 if (!nodesMap[id]) {
                     nodesMap[id] = { id: id, label: m[2], shape: line.includes('{') ? 'diamond' : 'box', lane: currentLane };
                     graphData.nodes.push(nodesMap[id]);
                 } else if (currentLane && !nodesMap[id].lane) {
                     nodesMap[id].lane = currentLane;
                 }
             }
        }
    });

    graphData.precalculatedLayout = true;
    if (lanes.length > 0) {
        graphData.lanes = lanes;
        graphData.laneDirection = laneDirection;
    }
    
    let inDegree = {};
    graphData.nodes.forEach(n => inDegree[n.id] = 0);
    graphData.edges.forEach(e => inDegree[e.to] = (inDegree[e.to] || 0) + 1);
    
    let roots = graphData.nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    if (roots.length === 0 && graphData.nodes.length > 0) roots.push(graphData.nodes[0].id); 
    
    let visited = new Set();
    let maxLevelVal = 0;
    let nextRootLevel = 1;
    
    if (lanes.length > 0) {
        let visited = new Set();
        const dfs = (id, computedX, startLevel) => {
            if (visited.has(id)) return;
            visited.add(id);
            
            let node = graphData.nodes.find(n => n.id === id);
            if (!node) return;
            
            node.level_x = computedX;
            node.level = startLevel;
            if (startLevel > maxLevelVal) maxLevelVal = startLevel;
            
            let children = graphData.edges.filter(e => e.from === id).map(e => e.to);
            
            children.forEach((childId, index) => {
                 if (index === 0) {
                     dfs(childId, computedX, startLevel + 1);
                 } else {
                     let newX = computedX + (index % 2 !== 0 ? 350 * Math.ceil(index / 2) : -350 * Math.ceil(index / 2));
                     dfs(childId, newX, startLevel);
                 }
            });
        };
        
        roots.forEach(root => {
            dfs(root, 0, nextRootLevel);
            nextRootLevel = maxLevelVal + 1;
        });
    } else {
        let stack = new Set();
        const calculateLevels = (nId, currentLevel) => {
            stack.add(nId);
            let nodeNode = graphData.nodes.find(nx => nx.id === nId);
            if (nodeNode) {
                if (!nodeNode.level || nodeNode.level < currentLevel) {
                     nodeNode.level = currentLevel;
                }
            }
            
            let children = graphData.edges.filter(e => e.from === nId).map(e => e.to);
            children.forEach(childId => {
                if (!stack.has(childId)) {
                     calculateLevels(childId, (nodeNode ? nodeNode.level : currentLevel) + 1);
                }
            });
            stack.delete(nId);
        };

        roots.forEach(root => {
            calculateLevels(root, nextRootLevel);
            let maxCurrent = Math.max(0, ...graphData.nodes.map(n => n.level || 0));
            nextRootLevel = maxCurrent + 1;
        });
        
        let bfsVisited = new Set();
        let queue = [];
        roots.forEach(root => {
            let nd = graphData.nodes.find(n => n.id === root);
            if (nd && nd.level_x === undefined) nd.level_x = 0;
            bfsVisited.add(root);
            queue.push(root);
        });

        while (queue.length > 0) {
            let curId = queue.shift();
            let curNode = graphData.nodes.find(n => n.id === curId);
            let curX = curNode ? (curNode.level_x || 0) : 0;
            
            let childrenIds = graphData.edges.filter(e => e.from === curId).map(e => e.to);
            let unvisitedChildren = childrenIds.filter(cid => !bfsVisited.has(cid));
            
            unvisitedChildren.forEach((childId, idx) => {
                let childNode = graphData.nodes.find(n => n.id === childId);
                if (childNode) {
                    if (unvisitedChildren.length === 1) {
                        childNode.level_x = curX; // Single child: stay centered
                    } else if (idx === 0) {
                        childNode.level_x = curX; // First child: stay centered (main flow)
                    } else {
                        childNode.level_x = curX + (idx * 350); // Other children: go right
                    }
                }
                bfsVisited.add(childId);
                queue.push(childId);
            });
        }
    }

    graphData.nodes.forEach(n => {
        if (n.level_x === undefined || n.level === undefined) {
             n.level_x = 0;
             n.level = nextRootLevel++;
        }
        
        let finalX = n.level_x;
        let finalY = n.level * 200;

        if (lanes.length > 0 && n.lane) {
            let laneIndex = lanes.indexOf(n.lane);
            if (laneDirection === 'horizontal') {
                finalX = n.level * 350; 
                finalY = laneIndex * 250; 
            } else {
                 finalX = laneIndex * 400; 
                 finalY = n.level * 200; 
            }
        } else if (lanes.length > 0 && !n.lane) {
            if (laneDirection === 'horizontal') {
                finalX = n.level * 350; 
                finalY = lanes.length * 250;
            } else {
                 finalX = lanes.length * 400; 
                 finalY = n.level * 200;
            }
        } else if (laneDirection === 'horizontal' && lanes.length === 0) {
             finalX = n.level * 350;
             finalY = n.level_x;
        }

        n.x = finalX;
        n.y = finalY;
    });

    return graphData;
};
