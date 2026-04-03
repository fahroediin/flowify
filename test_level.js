
let graphData = { nodes: [], edges: [] };
let roots = ['A'];
graphData.nodes = [
  {id: 'A'}, {id: 'B'}, {id: 'C'}, {id: 'D'}
];
graphData.edges = [
  {from: 'A', to: 'B'},
  {from: 'A', to: 'C'}, // C should be same level as A? Wait, but A is decision.
  {from: 'C', to: 'D'} 
];

// simulate calculateLevels
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
    children.forEach((childId, idx) => {
        if (!stack.has(childId)) {
             let inc = (children.length > 1 && idx > 0) ? 0 : 1;
             calculateLevels(childId, (nodeNode ? nodeNode.level : currentLevel) + inc);
        }
    });
    stack.delete(nId);
};
calculateLevels('A', 1);
console.log(graphData.nodes);
