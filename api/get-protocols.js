// api/get-protocols.js

const apiKey = "AIzaSyCu3CL7WXyLegw_f291saQtjjdpWGxGkgQ"; // aceeași cheie

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
      res.status(404).json({
        error: "Nu s-au găsit date în intervalul specificat.",
      });
      return;
    }

    const rows = data.values;
    const protocols = [];
    let current = null;

    // Structura ta: Afectiune (majuscule) + sub ea MINIM / ACCEPTABIL / IDEAL
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const colA = ((row[0] || "").trim()).toUpperCase();
      const colB = (row[1] || "").trim();

      if (!colA) continue;

      if (colA === "MINIM") {
        if (current) current.minim = colB;
        continue;
      }

      if (colA === "ACCEPTABIL") {
        if (current) current.acceptabil = colB;
        continue;
      }

      if (colA === "IDEAL") {
        if (current) current.ideal = colB;
        continue;
      }

      // Dacă ajungem aici, e o nouă AFECȚIUNE
      current = {
        index: i + 1,         // rândul aproximativ din foaie
        afectiune: colA,      // numele afecțiunii (INFECTII URINARE etc.)
        descriere: colB,      // textul de manifestare din coloana B
        minim: "",
        acceptabil: "",
        ideal: "",
      };

      protocols.push(current);
    }

    res.status(200).json({ protocols });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la preluarea sau procesarea datelor din Google Sheets.",
      details: err.message,
    });
  }
};
