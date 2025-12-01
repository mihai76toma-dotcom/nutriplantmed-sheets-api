// api/get-protocols.js

const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvz_Ow3twCRMScpRQ"; // aceeași cheie

module.exports = async function handler(req, res) {
  const { sheet_id, range } = req.query;

  if (!sheet_id || !range) {
    res
      .status(400)
      .json({ error: "Parametrii 'sheet_id' și 'range' sunt obligatorii." });
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      res
        .status(404)
        .json({ error: "Nu s-au găsit date în intervalul specificat." });
      return;
    }

    const rows = data.values;
    const protocols = [];
    let current = null;

    for (const row of rows) {
      const colA = (row[0] || "").trim();
      const colB = (row[1] || "").trim();
      if (!colA) continue;

      const upper = colA.toUpperCase();

      // Rând de AFECȚIUNE (nu MINIM/ACCEPTABIL/IDEAL)
      if (upper && !["MINIM", "ACCEPTABIL", "IDEAL"].includes(upper)) {
        if (current) protocols.push(current);
        current = {
          afectiune: colA,
          descriere: colB,
          minim: "",
          acceptabil: "",
          ideal: "",
        };
      } else if (current && ["MINIM", "ACCEPTABIL", "IDEAL"].includes(upper)) {
        if (upper === "MINIM") current.minim = colB;
        if (upper === "ACCEPTABIL") current.acceptabil = colB;
        if (upper === "IDEAL") current.ideal = colB;
      }
    }

    if (current) protocols.push(current);

    res.status(200).json({ protocols });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la procesarea protocoalelor.",
      details: err.message,
    });
  }
};
