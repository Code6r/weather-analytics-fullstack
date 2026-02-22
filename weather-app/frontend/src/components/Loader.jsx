import { motion } from "framer-motion";
import { CloudRain } from "lucide-react";

function Loader() {
  return (
    <motion.div
      className="loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="loader-icon-wrap"
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <CloudRain size={48} className="loader-icon" />
      </motion.div>
      <motion.div
        className="loader-dots"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span />
        <span />
        <span />
      </motion.div>
    </motion.div>
  );
}

export default Loader;
