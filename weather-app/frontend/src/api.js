import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export async function createWeather(cityOrCoords) {
  const body =
    typeof cityOrCoords === "string"
      ? { city: cityOrCoords }
      : { lat: cityOrCoords.lat, lon: cityOrCoords.lon };
  const { data } = await api.post("/functions/createWeather", body);
  return data;
}

export async function getWeatherHistory() {
  const { data } = await api.get("/functions/getWeather");
  return data?.data || [];
}

export async function updateWeather(id, city) {
  const { data } = await api.put("/functions/updateWeather", { id, city });
  return data?.data;
}

export async function deleteWeather(id) {
  await api.delete(`/functions/deleteWeather?id=${id}`);
}

export function getExportUrl() {
  return `${BASE_URL}/functions/exportWeather`;
}
