import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";

function WeatherForm({ onSearch, onLocationError, loading }) {
  const [city, setCity] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (trimmed && !loading) {
      onSearch(trimmed);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onSearch({ lat: latitude, lon: longitude });
      },
      (err) => onLocationError?.(err?.message || "Location access denied or unavailable"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <motion.form
      className="weather-form glass"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="form-row">
        <div className="input-wrap">
          <Search className="input-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            className="form-input"
            disabled={loading}
          />
          {city && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setCity("")}
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="form-btn"
          disabled={!city.trim() || loading}
        >
          {loading ? "Fetching..." : "Search"}
        </button>
      </div>
      <button
        type="button"
        className="location-btn"
        onClick={handleUseLocation}
        disabled={loading}
      >
        <MapPin size={18} />
        Use current location
      </button>
    </motion.form>
  );
}

export default WeatherForm;
