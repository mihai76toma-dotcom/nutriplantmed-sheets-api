// api/get-sheet.js

const apiKey = "AIzaSyCu3CL7WXyLegw_f291saQtjjdpWGxGkgQ"; // cheia ta

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

// dacă Google trimite o eroare, o returnăm așa cum e
if (data.error) {
  return res.status(response.status || 500).json(data);
}

// altfel, trimitem TOT ce primim (ca să vedem exact structura)
return res.status(200).json(data);

  } catch (err) {
    res.status(500).json({
      error: "Eroare la preluarea datelor din Google Sheets.",
      details: err.message,
    });
  }
};
