import { motion } from "framer-motion";

const ICON_BASE = "https://openweathermap.org/img/wn";

function formatDate(str) {
  if (!str) return "";
  try {
    const d = new Date(str);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return str;
  }
}

function ForecastGrid({ forecast }) {
  if (!forecast?.length) return null;

  return (
    <motion.div
      className="forecast-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h3 className="forecast-title">5-Day Forecast</h3>
      <div className="forecast-grid">
        {forecast.map((day, i) => (
          <motion.div
            key={day.date || i}
            className="forecast-card glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * i }}
            whileHover={{ y: -2 }}
          >
            <div className="forecast-date">{formatDate(day.date)}</div>
            {day.icon && (
              <img
                src={`${ICON_BASE}/${day.icon}@2x.png`}
                alt={day.description}
                className="forecast-icon"
              />
            )}
            <div className="forecast-temp">{Math.round(day.temp ?? 0)}°</div>
            <div className="forecast-desc">{day.description || ""}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default ForecastGrid;
