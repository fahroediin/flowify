const fs = require('fs');
const parser = require('./server/services/parserService');

console.log("=== SWIMLANE TEXT TEST ===");
const textData = parser.parseTextToGraphData(`@direction: TD
@Customer: Submit Purchase Order
@Sales: Proses PO
@Contracts: Cek Order
@Contracts: Apakah Order Valid?
  - Ya: @Legal: Legal Approves
  - Tidak: @Sales: Hubungi Customer
@Fulfillment: Kirim Pesanan
@Fulfillment: Selesai`);
console.log(textData.graph_data.nodes);
console.log(textData.graph_data.edges);
