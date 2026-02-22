/**
 * Create Weather - InsForge Serverless Function
 * POST - Accepts city, fetches from OpenWeatherMap, stores in DB
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
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const city = (body?.city || body?.location || "").trim();
    const lat = body?.lat;
    const lon = body?.lon;

    const hasCity = city && city.length >= 2;
    const hasCoords = typeof lat === "number" && typeof lon === "number";

    if (!hasCity && !hasCoords) {
      return new Response(
        JSON.stringify({ error: "Invalid input", message: "City name or coordinates (lat, lon) required" }),
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

    const q = hasCity ? `q=${encodeURIComponent(city)}` : `lat=${lat}&lon=${lon}`;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?${q}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${q}&appid=${apiKey}&units=metric&cnt=40`;

    const [weatherRes, forecastRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);

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

    const record = {
      location: weatherData.name || (hasCity ? city : `${lat},${lon}`),
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

    const { data: inserted, error } = await client.database
      .from("Weather")
      .insert([record])
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let forecast = [];
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      if (Array.isArray(forecastData.list)) {
        forecast = forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5).map((item) => ({
          date: item.dt_txt,
          temp: item.main?.temp,
          description: item.weather?.[0]?.description,
          icon: item.weather?.[0]?.icon,
        }));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        weather: inserted?.[0] || record,
        forecast,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
