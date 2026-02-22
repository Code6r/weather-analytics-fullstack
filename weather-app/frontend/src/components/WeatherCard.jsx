import { motion } from "framer-motion";
import { Droplets, Wind, Cloud } from "lucide-react";

const ICON_BASE = "https://openweathermap.org/img/wn";

function WeatherCard({ weather, suggestion }) {
  const temp = weather?.temperature ?? 0;
  const desc = weather?.description || "N/A";
  const humidity = weather?.humidity ?? 0;
  const windSpeed = weather?.wind_speed ?? 0;
  const icon = weather?.icon;
  const location = weather?.location || "";

  return (
    <motion.div
      className="weather-card glass"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="weather-card-header">
        <h2 className="weather-location">{location}</h2>
        {icon && (
          <img
            src={`${ICON_BASE}/${icon}@2x.png`}
            alt={desc}
            className="weather-icon"
          />
        )}
      </div>

      <div className="weather-temp-wrap">
        <span className="weather-temp">{Math.round(temp)}</span>
        <span className="weather-unit">°C</span>
      </div>

      <p className="weather-desc">{desc}</p>

      <div className="weather-stats">
        <div className="weather-stat">
          <Droplets size={20} className="stat-icon" />
          <span>{humidity}%</span>
          <small>Humidity</small>
        </div>
        <div className="weather-stat">
          <Wind size={20} className="stat-icon" />
          <span>{windSpeed} m/s</span>
          <small>Wind</small>
        </div>
      </div>

      {suggestion && (
        <motion.div
          className="weather-suggestion"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Cloud size={18} />
          <span>{suggestion}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default WeatherCard;
