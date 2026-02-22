/**
 * Update Weather - InsForge Serverless Function
 * PUT - Updates a record by ID, re-fetches weather for new city
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
    if (request.method !== "PUT") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const id = body?.id;
    const city = (body?.city || body?.location || "").trim();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Invalid input", message: "Record ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!city || city.length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid input", message: "City name is required for update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("WEATHER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server error", message: "Weather API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const weatherRes = await fetch(weatherUrl);

    if (!weatherRes.ok) {
      const errData = await weatherRes.json().catch(() => ({}));
      if (weatherRes.status === 404 || errData?.cod === "404") {
        return new Response(
          JSON.stringify({ error: "City not found", message: `No weather data found for "${city}"` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Weather API failed", message: "Could not fetch weather data" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const weatherData = await weatherRes.json();
    const main = weatherData.main || {};
    const wind = weatherData.wind || {};
    const weather = Array.isArray(weatherData.weather) ? weatherData.weather[0] : {};

    const updateData = {
      location: weatherData.name || city,
      temperature: main.temp ?? 0,
      description: weather.description || "N/A",
      humidity: main.humidity ?? 0,
      wind_speed: wind.speed ?? 0,
      icon: weather.icon || null,
    };

    const client = createClient({
      baseUrl: Deno.env.get("INSFORGE_BASE_URL"),
      anonKey: Deno.env.get("ANON_KEY"),
    });

    const { data: updated, error } = await client.database
      .from("Weather")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!updated || updated.length === 0) {
      return new Response(
        JSON.stringify({ error: "Not found", message: "Record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: updated[0] }),
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
