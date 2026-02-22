/**
 * Local mock server for development WITHOUT InsForge.
 * Uses Node's built-in http module (no Express).
 * Replace with InsForge functions for production.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const http = require("http");

const PORT = process.env.PORT || 5000;
const WEATHER_API_KEY = (process.env.WEATHER_API_KEY || "").trim();

const store = [];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function buildWeatherUrl(cityOrCoords) {
  const base = "https://api.openweathermap.org/data/2.5/weather";
  const q = typeof cityOrCoords === "string"
    ? `q=${encodeURIComponent(cityOrCoords)}`
    : `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  return `${base}?${q}&appid=${WEATHER_API_KEY}&units=metric`;
}

function buildForecastUrl(cityOrCoords) {
  const base = "https://api.openweathermap.org/data/2.5/forecast";
  const q = typeof cityOrCoords === "string"
    ? `q=${encodeURIComponent(cityOrCoords)}`
    : `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  return `${base}?${q}&appid=${WEATHER_API_KEY}&units=metric&cnt=40`;
}

async function fetchWeather(cityOrCoords) {
  if (!WEATHER_API_KEY) throw new Error("WEATHER_API_KEY not set");
  const url = buildWeatherUrl(cityOrCoords);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || (res.status === 404 ? "City not found" : "Weather API failed");
    console.error("[Weather API]", res.status, data?.cod, msg);
    const err = new Error(msg);
    err.status = res.status;
    err.cod = data?.cod;
    throw err;
  }
  return data;
}

async function fetchForecast(cityOrCoords) {
  if (!WEATHER_API_KEY) return [];
  const res = await fetch(buildForecastUrl(cityOrCoords));
  if (!res.ok) return [];
  const data = await res.json();
  return (data.list || []).filter((_, i) => i % 8 === 0).slice(0, 5).map((item) => ({
    date: item.dt_txt,
    temp: item.main?.temp,
    description: item.weather?.[0]?.description,
    icon: item.weather?.[0]?.icon,
  }));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function send(res, status, data, headers = {}) {
  const h = { ...corsHeaders, "Content-Type": "application/json", ...headers };
  res.writeHead(status, h);
  res.end(JSON.stringify(data));
}

const routes = {
  "POST /functions/createWeather": async (req, res, body) => {
    const city = (body?.city || body?.location || "").trim();
    const lat = body?.lat;
    const lon = body?.lon;
    const hasCity = city && city.length >= 2;
    const hasCoords = typeof lat === "number" && typeof lon === "number";
    if (!hasCity && !hasCoords) {
      return send(res, 400, { error: "Invalid input", message: "City or coordinates required" });
    }
    const cityOrCoords = hasCity ? city : { lat, lon };
    if (!WEATHER_API_KEY) {
      return send(res, 500, { error: "Server error", message: "WEATHER_API_KEY not set" });
    }
    try {
      const w = await fetchWeather(cityOrCoords);
      const main = w.main || {};
      const wind = w.wind || {};
      const wx = Array.isArray(w.weather) ? w.weather[0] : {};
      const record = {
        id: crypto.randomUUID(),
        location: w.name || (hasCity ? city : `${lat.toFixed(2)},${lon.toFixed(2)}`),
        temperature: main.temp ?? 0,
        description: wx.description || "N/A",
        humidity: main.humidity ?? 0,
        wind_speed: wind.speed ?? 0,
        icon: wx.icon || null,
        createdAt: new Date().toISOString(),
      };
      store.unshift(record);
      const forecast = await fetchForecast(cityOrCoords);
      send(res, 201, { success: true, weather: record, forecast });
    } catch (e) {
      const status = e.status === 404 ? 404 : (e.status === 401 ? 500 : 502);
      send(res, status, {
        error: e.message === "City not found" ? "City not found" : "Weather API failed",
        message: e.message,
      });
    }
  },
  "GET /functions/getWeather": async (req, res) => {
    send(res, 200, { success: true, data: store });
  },
  "PUT /functions/updateWeather": async (req, res, body) => {
    const id = body?.id;
    const city = (body?.city || body?.location || "").trim();
    if (!id || !city || city.length < 2) {
      return send(res, 400, { error: "Invalid input", message: "ID and city required" });
    }
    if (!WEATHER_API_KEY) {
      return send(res, 500, { error: "Server error", message: "WEATHER_API_KEY not set" });
    }
    const idx = store.findIndex((r) => r.id === id);
    if (idx < 0) return send(res, 404, { error: "Not found", message: "Record not found" });
    try {
      const w = await fetchWeather(city);
      const main = w.main || {};
      const wind = w.wind || {};
      const wx = Array.isArray(w.weather) ? w.weather[0] : {};
      store[idx] = {
        ...store[idx],
        location: w.name || city,
        temperature: main.temp ?? 0,
        description: wx.description || "N/A",
        humidity: main.humidity ?? 0,
        wind_speed: wind.speed ?? 0,
        icon: wx.icon || null,
      };
      send(res, 200, { success: true, data: store[idx] });
    } catch (e) {
      send(res, e.message === "City not found" ? 404 : 502, {
        error: e.message === "City not found" ? "City not found" : "Weather API failed",
        message: e.message,
      });
    }
  },
  "DELETE /functions/deleteWeather": async (req, res, body, searchParams) => {
    const id = searchParams.get("id") || body?.id;
    if (!id) return send(res, 400, { error: "Invalid input", message: "ID required" });
    const idx = store.findIndex((r) => r.id === id);
    if (idx < 0) return send(res, 404, { error: "Not found" });
    store.splice(idx, 1);
    send(res, 200, { success: true, message: "Record deleted" });
  },
  "GET /functions/exportWeather": async (req, res) => {
    const data = {
      exportedAt: new Date().toISOString(),
      count: store.length,
      data: store,
    };
    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="weather-export-${new Date().toISOString().slice(0, 10)}.json"`,
    });
    res.end(JSON.stringify(data, null, 2));
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method || "GET";
  const key = `${method} ${path}`;

  if (method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  const handler = routes[key];
  if (!handler) {
    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  let body = {};
  if (method !== "GET") {
    body = await parseBody(req);
  }

  try {
    await handler(req, res, body, url.searchParams);
  } catch (e) {
    send(res, 500, { error: "Internal error", message: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
  if (!WEATHER_API_KEY) console.warn("Warning: WEATHER_API_KEY not set. Add it to .env for weather data.");
});
