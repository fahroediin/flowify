// Basic parser for numbered list text to mermaid flowchart TD.
exports.parseTextToMermaid = (text) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    
    let nodes = {}; // id => { text, type }
    let edges = []; // { from, to, label }
    let nodeMap = {}; // lowercase cleanText => id
    let nodeCounter = 1;

    let lastTopLevelId = null;

    const getNode = (cleanText, forceNew = false) => {
        let key = cleanText.toLowerCase();
        // Fallback or explicit new node check
        if (!nodeMap[key] || forceNew) {
            let id = `Node${nodeCounter++}`;
            if (!forceNew) nodeMap[key] = id;
            nodes[id] = { text: cleanText, type: 'box' };
            return id;
        }
        return nodeMap[key];
    };

    lines.forEach(originalLine => {
        const isIndented = /^\s+/.test(originalLine);
        let line = originalLine.trim();

        if (isIndented && lastTopLevelId) {
            // It's a branch/condition for the previous top level node
            nodes[lastTopLevelId].type = 'decision';
            
            // Remove leading dash or bullets
            let content = line.replace(/^[-*]\s*/, '').replace(/"/g, "'");
            
            let condition = "";
            let targetText = content;

            // Extract Condition -> "- Label: Target Node"
            if (content.includes(':')) {
                const parts = content.split(':');
                condition = parts[0].trim();
                targetText = parts.slice(1).join(':').trim();
            }

            // Extract Jump -> "Target Node -> Jump Node"
            let jumpText = "";
            if (targetText.includes('->')) {
                const parts = targetText.split('->');
                targetText = parts[0].trim();
                jumpText = parts.slice(1).join('->').trim();
            }
            
            // Resolve Target Node
            let targetId = getNode(targetText);
            edges.push({ from: lastTopLevelId, to: targetId, label: condition });

            // Resolve Jump Node
            if (jumpText) {
                // Determine if we should force creating a new node instead of reusing.
                // The plan said: "Saran saya adalah membuat menjadi Node Baru agar tidak error"
                // Actually, if we want to jump to an existing node, looking it up in `nodeMap` is the whole point!
                // But if it doesn't exist, getNode creates it automatically as a new node. This fits the plan perfectly.
                let jumpId = getNode(jumpText);
                edges.push({ from: targetId, to: jumpId, label: "" });
            }
        } else {
            // Top level step
            let cleanText = line.replace(/^(\d+\.|-|\*)\s*/, '').replace(/"/g, "'");
            
            let jumpText = "";
            if (cleanText.includes('->')) {
                const parts = cleanText.split('->');
                cleanText = parts[0].trim();
                jumpText = parts.slice(1).join('->').trim();
            }

            let id = getNode(cleanText);

            // Connect automatically if the last top level node was NOT a decision node.
            // If it was a decision node, we assume its branches connect manually (via ->) to the next steps.
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

    let mermaid = 'flowchart TD\n';
    Object.keys(nodes).forEach(id => {
        let n = nodes[id];
        if (n.type === 'decision') {
            mermaid += `    ${id}{"${n.text}"}\n`;
        } else {
            mermaid += `    ${id}["${n.text}"]\n`;
        }
    });

    edges.forEach(e => {
        if (e.label) {
            mermaid += `    ${e.from} -->|${e.label}| ${e.to}\n`;
        } else {
            mermaid += `    ${e.from} --> ${e.to}\n`;
        }
    });

    return mermaid;
};
