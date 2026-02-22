/**
 * Vercel serverless - returns empty export (no persistent store)
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = {
    exportedAt: new Date().toISOString(),
    count: 0,
    data: [],
  };
  res.setHeader("Content-Disposition", `attachment; filename="weather-export-${new Date().toISOString().slice(0, 10)}.json"`);
  return res.status(200).json(data);
}
