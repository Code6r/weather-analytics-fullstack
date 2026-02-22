/**
 * Delete Weather - InsForge Serverless Function
 * DELETE - Deletes a record by ID
 */
import { createClient } from "npm:@insforge/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function (request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method !== "DELETE") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id") || (await request.json().catch(() => ({})))?.id;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Invalid input", message: "Record ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient({
      baseUrl: Deno.env.get("INSFORGE_BASE_URL"),
      anonKey: Deno.env.get("ANON_KEY"),
    });

    const { error } = await client.database.from("Weather").delete().eq("id", id);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Record deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
