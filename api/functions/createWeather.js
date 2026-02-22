/**
 * Vercel serverless function - fetches weather from OpenWeatherMap
 */
const WEATHER_API_KEY = (process.env.WEATHER_API_KEY || "").trim();

function buildWeatherUrl(cityOrCoords) {
  const base = "https://api.openweathermap.org/data/2.5/weather";
  const q =
    typeof cityOrCoords === "string"
      ? `q=${encodeURIComponent(cityOrCoords)}`
      : `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  return `${base}?${q}&appid=${WEATHER_API_KEY}&units=metric`;
}

function buildForecastUrl(cityOrCoords) {
  const base = "https://api.openweathermap.org/data/2.5/forecast";
  const q =
    typeof cityOrCoords === "string"
      ? `q=${encodeURIComponent(cityOrCoords)}`
      : `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  return `${base}?${q}&appid=${WEATHER_API_KEY}&units=metric&cnt=40`;
}

async function fetchWeather(cityOrCoords) {
  if (!WEATHER_API_KEY) throw new Error("WEATHER_API_KEY not configured in Vercel. Add it in Project Settings → Environment Variables.");
  const res = await fetch(buildWeatherUrl(cityOrCoords));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || (res.status === 404 ? "City not found" : "Weather API failed");
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function fetchForecast(cityOrCoords) {
  if (!WEATHER_API_KEY) return [];
  const res = await fetch(buildForecastUrl(cityOrCoords));
  if (!res.ok) return [];
  const data = await res.json();
  return (data.list || [])
    .filter((_, i) => i % 8 === 0)
    .slice(0, 5)
    .map((item) => ({
      date: item.dt_txt,
      temp: item.main?.temp,
      description: item.weather?.[0]?.description,
      icon: item.weather?.[0]?.icon,
    }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const city = (body?.city || body?.location || "").trim();
    const lat = body?.lat;
    const lon = body?.lon;
    const hasCity = city && city.length >= 2;
    const hasCoords = typeof lat === "number" && typeof lon === "number";

    if (!hasCity && !hasCoords) {
      return res.status(400).json({
        error: "Invalid input",
        message: "City or coordinates required",
      });
    }

    const cityOrCoords = hasCity ? city : { lat, lon };
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

    const forecast = await fetchForecast(cityOrCoords);
    return res.status(201).json({ success: true, weather: record, forecast });
  } catch (e) {
    const status = e.status === 404 ? 404 : e.status === 401 ? 500 : 502;
    return res.status(status).json({
      error: e.message?.includes("City not found") ? "City not found" : "Weather API failed",
      message: e.message,
    });
  }
}
