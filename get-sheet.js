// api/get-sheet.js

const apiKey = "AIzaSyA2kHZjeyN26GaeSeAvz_Ow3twCRMScpRQ"; // cheia ta

// CommonJS export pentru Vercel (Node.js)
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
    const response = await fetch(url); // fetch global în Node 18+ (Vercel)
    const data = await response.json();

    if (!data.values) {
      res
        .status(404)
        .json({ error: "Nu s-au găsit date în intervalul specificat." });
      return;
    }

    res.status(200).json({ values: data.values });
  } catch (err) {
    res.status(500).json({
      error: "Eroare la preluarea datelor din Google Sheets.",
      details: err.message,
    });
  }
};
