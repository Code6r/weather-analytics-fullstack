import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronRight } from "lucide-react";
import { getExportUrl } from "../api";

function HistoryPanel({ history, onSelect, onDelete }) {
  if (!history?.length) return null;

  return (
    <motion.section
      className="history-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="history-header">
        <h3 className="history-title">Search History</h3>
        <a
          href={getExportUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="export-link"
        >
          Export JSON
        </a>
      </div>
      <ul className="history-list">
        <AnimatePresence mode="popLayout">
          {history.map((item) => (
            <motion.li
              key={item.id}
              className="history-item glass"
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                className="history-item-btn"
                onClick={() => onSelect(item.location)}
              >
                <span className="history-location">{item.location}</span>
                <span className="history-temp">{Math.round(item.temperature ?? 0)}°</span>
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                className="history-delete"
                onClick={() => onDelete(item.id)}
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

export default HistoryPanel;
