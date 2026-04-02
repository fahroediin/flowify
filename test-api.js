const loginData = { email: 'testuser@example.com', password: 'testpassword' };
const fs = require('fs');

async function testApi() {
  console.log("=== API Test Start ===");
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    
    if (!loginRes.ok) {
        console.error("Login failed:", await loginRes.text());
        return;
    }
    const loginJson = await loginRes.json();
    const token = loginJson.data.token;
    console.log("1. Login OK, token received.");

    // 2. Parse Text
    const parseRes = await fetch('http://localhost:3000/api/flowcharts/parse', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        input_type: 'text', 
        content: `1. Halaman Utama
2. Validasi Member?
  - Ya: Member Area
  - Tidak: Hobi -> Halaman Utama
3. Selesai` 
      })
    });
    const parseJson = await parseRes.json();
    console.log("2. Parse OK:");
    console.log(parseJson.data.mermaid_code);

    // 3. Render Mermaid
    const renderRes = await fetch('http://localhost:3000/api/flowcharts/render', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ mermaid_code: parseJson.data.mermaid_code, theme: 'ocean' })
    });
    const renderJson = await renderRes.json();
    console.log("3. Render OK:", renderJson.data?.svg ? "SVG generated" : await renderRes.text());

    // 4. Save Flowchart
    const saveRes = await fetch('http://localhost:3000/api/flowcharts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        title: "Test API Flow",
        input_type: "text",
        input_content: "1. Hello\n2. World",
        mermaid_code: parseJson.data.mermaid_code,
        theme: "ocean",
        svg_output: renderJson.data.svg
      })
    });
    const saveJson = await saveRes.json();
    const id = saveJson.data.id;
    console.log("4. Save OK, ID:", id);

    // 5. Delete Flowchart
    const deleteRes = await fetch(`http://localhost:3000/api/flowcharts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteJson = await deleteRes.json();
    console.log("5. Delete OK:", deleteJson.success);

  } catch(e) {
    console.error("Test failed with exception:", e);
  }
}

testApi();
