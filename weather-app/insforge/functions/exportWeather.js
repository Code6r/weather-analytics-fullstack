/**
 * Export Weather - InsForge Serverless Function
 * GET - Returns all stored data as JSON (for download)
 */
import { createClient } from "npm:@insforge/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function (request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient({
      baseUrl: Deno.env.get("INSFORGE_BASE_URL"),
      anonKey: Deno.env.get("ANON_KEY"),
    });

    const { data, error } = await client.database
      .from("Weather")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      count: (data || []).length,
      data: data || [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="weather-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: err?.message || "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
