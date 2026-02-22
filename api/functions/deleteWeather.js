/**
 * Vercel serverless - no-op (no persistent store)
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({ success: true, message: "Record deleted" });
}
