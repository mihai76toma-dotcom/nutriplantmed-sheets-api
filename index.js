import express from "express";
import fetch from "node-fetch";

const app = express();

// Test rapid - pentru a verifica dacă serverul răspunde
app.get("/", (req, res) => {
  res.send("✅ NutriPlantMed Google Sheets API endpoint este activ!");
});

// Endpointul principal care citește datele din Google Sheets
app.get("/get-sheet", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;

    if (!sheet_id || !range) {
      return res.status(400).json({ error: "Lipsesc parametrii obligatorii: sheet_id și range" });
    }

    // 🔑 Introdu aici cheia ta API de la Google Cloud
    const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvz_Ow3twCRMScpRQ";

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${range}?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res.status(404).json({ error: "Nu s-au găsit date în intervalul specificat" });
    }

    res.json({ values: data.values });
  } catch (err) {
    res.status(500).json({ error: "Eroare la preluarea datelor", details: err.message });
  }
});

app.listen(3000, () => console.log("Server NutriPlantMed Sheets API rulează pe portul 3000"));
