// api/get-protocols.js

// 🔑 CHEIA TA Google Sheets
const apiKey = "AIzaSyCu3CL7WXyLegw_f291saQtjjdpWGxGkgQ";

// mic helper: curăță textul (spații duble, spații la început/sfârșit)
function normalizeText(str) {
  if (!str) return "";
  return String(str).replace(/\s+/g, " ").trim();
}

// facem un "slug" prietenos pentru căutare (fără diacritice, doar litere/cifre)
function makeSlug(str) {
  return normalizeText(str)
    .toLowerCase()
    .normalize("NFD")                   // sparge diacriticele
    .replace(/[\u0300-\u036f]/g, "")    // scoate diacriticele
    .replace(/[^a-z0-9]+/g, "-")        // orice nu e litera/cifră devine "-"
    .replace(/^-+|-+$/g, "");           // scoatem - de la început/sfârșit
}

module.exports = async function handler(req, res) {
  const { sheet_id, range } = req.query;

  if (!sheet_id || !range) {
    return res
      .status(400)
      .json({ error: "Parametrii 'sheet_id' și 'range' sunt obligatorii." });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      return res.status(404).json({
        error: "Nu s-au găsit date în intervalul specificat.",
        details: data,
      });
    }

    const rows = data.values;
    const protocols = [];
    let current = null;

    for (const row of rows) {
      const colA = normalizeText(row[0] || "");
      const colB = normalizeText(row[1] || "");

      // rând gol – ignorăm
      if (!colA && !colB) continue;

      const upperA = colA.toUpperCase();

      // ============================
      // 1) rând cu AFECȚIUNE nouă
      // ============================
      if (upperA && upperA !== "MINIM" && upperA !== "ACCEPTABIL" && upperA !== "IDEAL") {
        // închidem protocolul anterior, dacă există
        if (current) {
          protocols.push(current);
        }

        current = {
          index: protocols.length + 1,
          afectiune: normalizeText(colA),
          descriere: normalizeText(colB),
          minim: "",
          acceptabil: "",
          ideal: "",
          slug: makeSlug(colA),
        };
        continue;
      }

      // dacă încă nu avem "current", nu avem ce completa
      if (!current) continue;

      // ==================================
      // 2) rând MINIM / ACCEPTABIL / IDEAL
      // ==================================
      if (upperA === "MINIM") {
        current.minim = normalizeText(
          [current.minim, colB].filter(Boolean).join(" ")
        );
        continue;
      }

      if (upperA === "ACCEPTABIL") {
        current.acceptabil = normalizeText(
          [current.acceptabil, colB].filter(Boolean).join(" ")
        );
        continue;
      }

      if (upperA === "IDEAL") {
        current.ideal = normalizeText(
          [current.ideal, colB].filter(Boolean).join(" ")
        );
        continue;
      }

      // ==================================
      // 3) rânduri de continuare pentru descriere
      //    (coloana A goală, dar B are text)
      // ==================================
      if (!colA && colB) {
        current.descriere = normalizeText(
          [current.descriere, colB].filter(Boolean).join(" ")
        );
      }
    }

    // adăugăm ultimul protocol dacă există
    if (current) {
      protocols.push(current);
    }

    // ==================================
    // 4) curățare finală:
    //    - scoatem rândurile fără afectiune
    //    - normalizăm din nou textele, just in case
    // ==================================
    const cleaned = protocols
      .filter((p) => p.afectiune) // scoatem titlurile de grup gen "APARAT CARDIO-VASCULAR"
      .map((p, idx) => ({
        index: idx + 1,
        afectiune: normalizeText(p.afectiune),
        slug: makeSlug(p.afectiune),
        descriere: normalizeText(p.descriere),
        minim: normalizeText(p.minim),
        acceptabil: normalizeText(p.acceptabil),
        ideal: normalizeText(p.ideal),
      }));

    return res.status(200).json({ protocols: cleaned });
  } catch (err) {
    return res.status(500).json({
      error: "Eroare la preluarea datelor din Google Sheets.",
      details: err.message,
    });
  }
};
