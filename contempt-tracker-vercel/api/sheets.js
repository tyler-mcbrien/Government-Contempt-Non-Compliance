// Vercel Serverless Function — proxies Google Sheets API requests
// so the API key never reaches the browser.

const SHEET_ID = "1CFRm9LAKhq_ghwyE1c0bqQgii0QYKQuA9XR5G2NzRGg";
const SHEET_NAME = "Mega List";

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`;

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    // Cache for 5 minutes at the edge, 1 minute in browser
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: "Failed to fetch from Google Sheets" });
  }
}
