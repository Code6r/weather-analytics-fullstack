import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WeatherForm from "./components/WeatherForm";
import WeatherCard from "./components/WeatherCard";
import ForecastGrid from "./components/ForecastGrid";
import HistoryPanel from "./components/HistoryPanel";
import Loader from "./components/Loader";
import {
  createWeather,
  getWeatherHistory,
  deleteWeather,
} from "./api";

function getSuggestion(weather) {
  if (!weather) return null;
  const temp = weather.temperature;
  const desc = (weather.description || "").toLowerCase();
  if (temp > 30) return "Stay hydrated";
  if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("storm")) {
    return "Carry umbrella";
  }
  if (temp < 15) return "Wear warm clothes";
  return null;
}

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getWeatherHistory();
      setHistory(data);
    } catch (err) {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = async (cityOrCoords) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast([]);
    try {
      const res = await createWeather(cityOrCoords);
      setWeather(res.weather || res);
      setForecast(res.forecast || []);
      loadHistory();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch weather";
      setError(msg);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await deleteWeather(id);
      loadHistory();
      if (weather?.id === id) {
        setWeather(null);
        setForecast([]);
      }
    } catch (err) {
      loadHistory();
    }
  };

  const suggestion = getSuggestion(weather);

  return (
    <div className="app">
      <div className="app-bg" />
      <main className="main">
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="title">Weather Dashboard</h1>
          <p className="subtitle">Real-time weather & 5-day forecast</p>
        </motion.header>

        <WeatherForm onSearch={handleSearch} loading={loading} />

        {loading && (
          <div className="loader-wrap">
            <Loader />
          </div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && weather && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <WeatherCard weather={weather} suggestion={suggestion} />
            {forecast.length > 0 && (
              <ForecastGrid forecast={forecast} />
            )}
          </motion.div>
        )}

        <HistoryPanel
          history={history}
          onSelect={(item) => handleSearch(typeof item === "string" ? item : item.location)}
          onDelete={handleDeleteHistory}
        />
      </main>

      <footer className="footer">
        <span>Developer: Mahathi</span>
        <span>PM Accelerator – Built with React & InsForge</span>
      </footer>
    </div>
  );
}

export default App;
