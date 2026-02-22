/**
 * Vercel serverless - weather via OpenWeatherMap (if key set) or Open-Meteo (no key)
 */
const WEATHER_API_KEY = (process.env.WEATHER_API_KEY || "").trim();
const USE_OPEN_METEO = !WEATHER_API_KEY;

const WMO_DESC = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Drizzle",
  55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Freezing drizzle",
  61: "Slight rain", 63: "Rain", 65: "Heavy rain", 66: "Light freezing rain",
  67: "Freezing rain", 71: "Slight snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains", 80: "Slight rain showers", 81: "Rain showers", 82: "Heavy rain showers",
  85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
  96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

function wmoToDesc(code) {
  return WMO_DESC[code] || "Unknown";
}

function wmoToOwmIcon(code) {
  const n = Number(code) || 0;
  if (n <= 1) return "01d";
  if (n === 2) return "02d";
  if (n === 3) return "04d";
  if (n === 45 || n === 48) return "50d";
  if (n >= 51 && n <= 67) return n >= 61 ? "10d" : "09d";
  if (n >= 71 && n <= 77) return "13d";
  if (n >= 80 && n <= 82) return "09d";
  if (n >= 85 && n <= 86) return "13d";
  if (n >= 95 && n <= 99) return "11d";
  return "01d";
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "User-Agent": "WeatherDashboard/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    if (a.suburb || a.neighbourhood) return `${a.suburb || a.neighbourhood}, ${a.city || a.town || a.village || a.state || a.country || ""}`.trim();
    if (a.city || a.town || a.village) return `${a.city || a.town || a.village}, ${a.state || a.country || ""}`.trim();
    if (a.state) return `${a.state}, ${a.country || ""}`.trim();
    return data.display_name || null;
  } catch {
    return null;
  }
}

async function fetchWithOpenMeteo(cityOrCoords) {
  let lat, lon, name;
  if (typeof cityOrCoords === "string") {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOrCoords)}&count=1`
    );
    const geo = await geoRes.json();
    const first = geo?.results?.[0];
    if (!first) throw new Error("City not found");
    lat = first.latitude;
    lon = first.longitude;
    name = first.name || cityOrCoords;
  } else {
    lat = cityOrCoords.lat;
    lon = cityOrCoords.lon;
    const place = await reverseGeocode(lat, lon);
    name = place || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API failed");
  const data = await res.json();
  const cur = data.current || {};
  const daily = data.daily || {};
  const codes = daily.weather_code || [];
  const tempsMax = daily.temperature_2m_max || [];
  const tempsMin = daily.temperature_2m_min || [];
  const dates = daily.time || [];
  const curCode = cur.weather_code ?? 0;
  const forecast = Array.from({ length: Math.min(5, dates.length) }, (_, i) => {
    const c = codes[i] ?? curCode;
    return {
      date: dates[i] || "",
      temp: tempsMax[i] ?? tempsMin[i] ?? cur.temperature_2m,
      description: wmoToDesc(c),
      icon: wmoToOwmIcon(c),
    };
  });
  const windKmh = cur.wind_speed_10m ?? 0;
  return {
    name,
    main: { temp: cur.temperature_2m ?? 0, humidity: cur.relative_humidity_2m ?? 0 },
    wind: { speed: Math.round((windKmh / 3.6) * 10) / 10 },
    weather: [{ description: wmoToDesc(curCode), icon: wmoToOwmIcon(curCode) }],
    forecast,
  };
}

function buildOWMWeatherUrl(cityOrCoords) {
  const base = "https://api.openweathermap.org/data/2.5/weather";
  const q = typeof cityOrCoords === "string"
    ? `q=${encodeURIComponent(cityOrCoords)}`
    : `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  return `${base}?${q}&appid=${WEATHER_API_KEY}&units=metric`;
}

function buildOWMForecastUrl(cityOrCoords) {
  const base = "https://api.openweathermap.org/data/2.5/forecast";
  const q = typeof cityOrCoords === "string"
    ? `q=${encodeURIComponent(cityOrCoords)}`
    : `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`;
  return `${base}?${q}&appid=${WEATHER_API_KEY}&units=metric&cnt=40`;
}

async function fetchWithOpenWeatherMap(cityOrCoords) {
  const res = await fetch(buildOWMWeatherUrl(cityOrCoords));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || (res.status === 404 ? "City not found" : "Weather API failed");
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const forecastRes = await fetch(buildOWMForecastUrl(cityOrCoords));
  const forecastData = await forecastRes.json().catch(() => ({}));
  const list = forecastData.list || [];
  const forecast = list
    .filter((_, i) => i % 8 === 0)
    .slice(0, 5)
    .map((item) => ({
      date: item.dt_txt || "",
      temp: item.main?.temp,
      description: item.weather?.[0]?.description || "N/A",
      icon: item.weather?.[0]?.icon || null,
    }));
  return {
    ...data,
    forecast,
  };
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
    const w = USE_OPEN_METEO
      ? await fetchWithOpenMeteo(cityOrCoords)
      : await fetchWithOpenWeatherMap(cityOrCoords);

    const main = w.main || {};
    const wind = w.wind || {};
    const wx = Array.isArray(w.weather) ? w.weather[0] : w.weather || {};
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
    const forecast = w.forecast || [];

    return res.status(201).json({ success: true, weather: record, forecast });
  } catch (e) {
    const status = e.status === 404 ? 404 : e.status === 401 ? 500 : 502;
    return res.status(status).json({
      error: e.message?.includes("City not found") ? "City not found" : "Weather API failed",
      message: e.message,
    });
  }
}
