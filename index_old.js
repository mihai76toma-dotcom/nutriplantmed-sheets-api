import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 CHEIA TA GOOGLE SHEETS (INLOCUIESTE CU A TA)
const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvz_Ow3twCRMScpRQ";

// ===============================
// Endpoint de test – verificare API
// ===============================
app.get("/", (req, res) => {
  res.send("✅ VERSIUNE NOUA API – test Mihai");
});

// ===============================
// Endpoint simplu – citește orice foaie
// GET /get-sheet?sheet_id=...&range=Foaie!A1:Z50
// ===============================
app.get("/get-sheet", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;

    if (!sheet_id || !range) {
      return res
        .status(400)
        .json({ error: "Parametrii 'sheet_id' și 'range' sunt obligatorii." });
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(
      range
    )}?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res
        .status(404)
        .json({ error: "Nu s-au găsit date în intervalul specificat." });
    }

    res.json({ values: data.values });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la preluarea datelor din Google Sheets.",
      details: err.message,
    });
  }
});

// ===============================
// Endpoint principal – /get-protocols
// Structură pentru foaia cu protocoale:
// - rând cu AFECȚIUNE (majuscule) în coloana A
// - sub ea rânduri cu A = MINIM / ACCEPTABIL / IDEAL,
//   iar produsele în coloana B
//
// GET /get-protocols?sheet_id=...&range=Suplimente%20recomandate!A1:Z300
// ===============================
app.get("/test-protocols", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;

    if (!sheet_id || !range) {
      return res
        .status(400)
        .json({ error: "Parametrii 'sheet_id' și 'range' sunt obligatorii." });
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(
      range
    )}?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res.status(404).json({ error: "Nu s-au găsit date în foaie." });
    }

    const values = data.values;
    const protocols = [];
    let currentCondition = null;

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const colAraw = (row[0] || "").trim();
      const colA = colAraw.toUpperCase();

      // Detectează afecțiuni: text în coloana A, cu litere mari, diferit de MINIM/ACCEPTABIL/IDEAL
      if (
        colA &&
        !["MINIM", "ACCEPTABIL", "IDEAL"].includes(colA) &&
        colA === colAraw.toUpperCase()
      ) {
        currentCondition = {
          index: i + 1,
          afectiune: colAraw,
          descriere: (row[1] || "").trim(),
          minim: "",
          acceptabil: "",
          ideal: "",
        };
        protocols.push(currentCondition);
      } else if (currentCondition) {
        // Rândurile MINIM / ACCEPTABIL / IDEAL
        if (colA === "MINIM") {
          currentCondition.minim = (row[1] || "").trim();
        } else if (colA === "ACCEPTABIL") {
          currentCondition.acceptabil = (row[1] || "").trim();
        } else if (colA === "IDEAL") {
          currentCondition.ideal = (row[1] || "").trim();
        }
      }
    }

    res.json({ protocols });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la procesarea protocoalelor.",
      details: err.message,
    });
  }
});

// ===============================
// Pornire server (pt rulare locală)
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server NutriPlantMed API pornit pe portul ${PORT}`);
});


