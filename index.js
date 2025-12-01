import express from "express";
import fetch from "node-fetch";

const app = express();

// ---------------------------
//  Endpoint test (home)
// ---------------------------
app.get("/", (req, res) => {
  res.send("✅ NutriPlantMed Google Sheets API endpoint este activ!");
});

// =====================================
//  /get-sheet  (varianta brută, neschimbată)
//  primește: ?sheet_id=...&range=Foaie!A1:F200
//  întoarce: { values: [ [row1], [row2], ... ] }
// =====================================
app.get("/get-sheet", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;

    if (!sheet_id || !range) {
      return res
        .status(400)
        .json({ error: "Lipsesc parametrii obligatorii: sheet_id și range" });
    }

    // 🔑 AICI PUI CHEIA TA API DE LA GOOGLE CLOUD
    const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvz_Ow3twCRMScpRQ";

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(
      range
    )}?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res
        .status(404)
        .json({ error: "Nu s-au găsit date în intervalul specificat" });
    }

    res.json({ values: data.values });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la preluarea datelor",
      details: err.message,
    });
  }
});

// =====================================
//  /get-protocols
//  pentru foaia "PROTOCOALE DE TRATAMENT"
//  structura: AFECȚIUNE pe un rând,
//             apoi rânduri MINIM / ACCEPTABIL / IDEAL sub ea
//
//  primește: ?sheet_id=...&range=PROTOCOALE%20DE%20TRATAMENT!A1:Z300
//  întoarce:
//  {
//    protocols: [
//      {
//        index: 200,               // rândul foilor (aproximativ)
//        afectiune: "INFECTII URINARE",
//        descriere: "... text din coloana C/D ...",
//        minim: "produse MINIM",
//        acceptabil: "produse ACCEPTABIL",
//        ideal: "produse IDEAL"
//      },
//      ...
//    ]
//  }
// =====================================
app.get("/get-protocols", async (req, res) => {
  try {
    const { sheet_id, range } = req.query;

    if (!sheet_id || !range) {
      return res
        .status(400)
        .json({ error: "Lipsesc parametrii obligatorii: sheet_id și range" });
    }

    // 🔑 AICI PUI ACEEAȘI CHEIE API CA MAI SUS
    const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvz_Ow3twCRMScpRQ";

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(
      range
    )}?key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.values || data.values.length === 0) {
      return res
        .status(404)
        .json({ error: "Nu s-au găsit rânduri de date în intervalul specificat" });
    }

    const rows = data.values;
    const protocols = [];

    // Funcție ajutătoare: verifică dacă un label este MINIM/ACCEPTABIL/IDEAL
    const isLevelRow = (label) => {
      if (!label) return false;
      const up = label.trim().toUpperCase();
      return up === "MINIM" || up === "ACCEPTABIL" || up === "IDEAL";
    };

    let i = 0;
    while (i < rows.length) {
      const row = rows[i];
      const labelRaw = (row[0] || "").trim();
      const labelUp = labelRaw.toUpperCase();

      // Sărim peste rânduri complet goale
      const isEmptyRow = row.every((cell) => !cell || String(cell).trim() === "");
      if (isEmptyRow) {
        i++;
        continue;
      }

      // Sărim peste categorii de tipul "AFECTIUNI URO-GENITALE"
      const hasContentInCOrD =
        (row[2] && row[2].trim() !== "") || (row[3] && row[3].trim() !== "");
      if (!isLevelRow(labelRaw) && !hasContentInCOrD) {
        // este cel mai probabil un header de categorie -> ignorăm
        i++;
        continue;
      }

      // Dacă e rând de tip MINIM/ACCEPTABIL/IDEAL care NU are o afecțiune deasupra,
      // îl ignorăm (nu ar trebui să se întâmple, dar să fim siguri)
      if (isLevelRow(labelRaw)) {
        i++;
        continue;
      }

      // Aici avem un rând cu AFECȚIUNE propriu-zisă
      const afectiune = labelRaw; // coloana A
      const descriere =
        ((row[2] || "") + " " + (row[3] || "")).trim(); // coloanele C și D, lipite

      const protocol = {
        index: i + 1, // index uman (Google Sheets începe rândurile de la 1)
        afectiune,
        descriere,
        minim: "",
        acceptabil: "",
        ideal: "",
      };

      // Ne uităm pe rândurile următoare după MINIM / ACCEPTABIL / IDEAL
      let j = i + 1;
      while (j < rows.length) {
        const next = rows[j];
        const nextLabel = (next[0] || "").trim();
        const nextUp = nextLabel.toUpperCase();

        if (!isLevelRow(nextLabel)) {
          // am ieșit din blocul acestei afecțiuni
          break;
        }

        // textul cu produse este, în foaia ta, în special în coloana C (și uneori D).
        const produseText =
          ((next[2] || "") + " " + (next[3] || "")).trim();

        if (nextUp === "MINIM") {
          protocol.minim = produseText;
        } else if (nextUp === "ACCEPTABIL") {
          protocol.acceptabil = produseText;
        } else if (nextUp === "IDEAL") {
          protocol.ideal = produseText;
        }

        j++;
      }

      protocols.push(protocol);
      i = j; // sărim direct după blocul acestei afecțiuni
    }

    res.json({ protocols });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la preluarea protocoalelor",
      details: err.message,
    });
  }
});

// -------------------------------------
// Pornire server (pentru rulare locală)
// Vercel ignoră acest listen și rulează ca serverless,
// dar local îți permite să testezi cu `node index.js`.
// -------------------------------------
app.listen(3000, () => {
  console.log("Server NutriPlantMed Sheets API rulează pe portul 3000");
});


