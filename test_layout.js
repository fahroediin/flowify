const fs = require('fs');
const parser = require('./server/services/parserService');

function printNodes(nodes) {
    if(Array.isArray(nodes)) {
        nodes.forEach(n => {
            console.log(`id: ${n.id}, text: ${n.label || n.text}, shape: ${n.shape}, level_x: ${n.level_x}, level_y: ${n.level_y}, level: ${n.level}`);
        });
    } else {
        Object.keys(nodes).forEach(id => {
            const n = nodes[id];
            console.log(`id: ${id}, text: ${n.text}, type: ${n.type}, level_x: ${n.level_x}, level_y: ${n.level_y}, level: ${n.level}`);
        });
    }
}

console.log("=== MERMAID TEST ===");
const mermaidData = parser.parseMermaidToGraphData(`flowchart TD
A[Mulai Proses E-KYC] --> B[Buka Kamera]
B --> C[Deteksi Wajah Awal]
C --> D[Instruksi Hadap Depan]
D --> E{Apakah Wajah Valid?}
E -->|Ya| F[Simpan Gambar Depan]
E -->|Tidak| G[Tampilkan Error]
G --> D`);
printNodes(mermaidData.nodes);

console.log("\n=== TEXT TEST ===");
const textData = parser.parseTextToGraphData(`1. Mulai Proses E-KYC
2. Buka Kamera
3. Deteksi Wajah Awal
4. Instruksi Hadap Depan
5. Apakah Wajah Valid?
  - Ya: Simpan Gambar Depan -> Instruksi Hadap Kiri
  - Tidak: Tampilkan Error -> Instruksi Hadap Depan`);
printNodes(textData.graph_data.nodes);
