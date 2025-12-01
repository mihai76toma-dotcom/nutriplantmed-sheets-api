import express from "express";
import fetch from "node-fetch";

const app = express();

// 🔑 CHEIA TA GOOGLE SHEETS
const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvZ_Ow3twCRMRScpRQ";

// ================================
// Endpoint de test
// ================================
app.get("/", (req, res) => {
  res.send("✅ NutriPlantMed Google Sheets API este activ pe ruta /api!");
});

// ================================
// Endpoint simplu: /get-sheet
// ================================
app.get("/get-sheet", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;
    if (!sheet_id || !range) {
      return res.status(400).json({ error: "Parametrii 'sheet_id' și 'range' sunt obligatorii." });
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res.status(404).json({ error: "Nu s-au găsit date în intervalul specificat." });
    }

    res.json({ values: data.values });
  } catch (err) {
    res.status(500).json({ error: "Eroare la preluarea datelor din Google Sheets.", details: err.message });
  }
});

// ================================
// Endpoint avansat: /get-protocols
// ================================
app.get("/get-protocols", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;
    if (!sheet_id || !range) {
      return res.status(400).json({ error: "Parametrii 'sheet_id' și 'range' sunt obligatorii." });
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res.status(404).json({ error: "Nu s-au găsit date în intervalul specificat." });
    }

    // Parcurge foaia și grupează afecțiunile
    const rows = data.values;
    const protocols = [];
    let current = null;

    for (const row of rows) {
      const [colA, colB] = row;
      if (!colA) continue;

      const text = colA.trim().toUpperCase();

      if (text && !["MINIM", "ACCEPTABIL", "IDEAL"].includes(text)) {
        // Rând de afecțiune
        if (current) protocols.push(current);
        current = { afectiune: colA.trim(), descriere: colB || "", minim: "", acceptabil: "", ideal: "" };
      } else if (["MINIM", "ACCEPTABIL", "IDEAL"].includes(text) && current) {
        const tip = text.toLowerCase();
        current[tip] = colB || "";
      }
    }

    if (current) protocols.push(current);

    res.json({ protocols });
  } catch (err) {
    res.status(500).json({ error: "Eroare la procesarea protocoalelor.", details: err.message });
  }
});

// ✅ Export Express pentru Vercel
export default app;
