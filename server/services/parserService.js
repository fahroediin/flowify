// Basic parser for numbered list text to mermaid flowchart TD.
exports.parseTextToMermaid = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let mermaid = 'flowchart TD\n';
    let nodes = [];
    let edges = [];
    let nodeCounter = 1;

    // Simple sequential parsing assuming each line is a step.
    // For more complex nested lists, we'd need a real text parser.
    // Note: We'll implement a basic parser that connects line N to line N + 1.
    
    lines.forEach((line, index) => {
        // Strip numbers like "1. ", "2. ", "- "
        let cleanText = line.replace(/^(\d+\.|-|\*)\s*/, '').replace(/"/g, "'");
        
        // Let's create node names like Node1, Node2
        let nodeId = `Node${nodeCounter++}`;
        nodes.push(`${nodeId}["${cleanText}"]`);
        
        if (index > 0) {
            let prevNodeId = `Node${nodeCounter - 2}`;
            edges.push(`    ${prevNodeId} --> ${nodeId}`);
        }
    });

    nodes.forEach(n => {
        mermaid += `    ${n}\n`;
    });
    
    edges.forEach(e => {
        mermaid += `${e}\n`;
    });

    return mermaid;
};
