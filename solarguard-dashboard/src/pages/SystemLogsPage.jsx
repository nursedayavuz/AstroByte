import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useSettings } from '../contexts/SettingsContext';
import { createTranslator } from '../utils/translations';

export default function SystemLogsPage({ logsProp = [] }) {
  const { settings } = useSettings()
  const t = createTranslator(settings.language)
  const [localLogs, setLocalLogs] = useState([]);
  const logs = logsProp.length > 0 ? logsProp : localLogs;
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  // Auto-scroll logic via useEffect
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case "INFO": return "var(--cyan)";
      case "WARN": return "var(--amber)";
      case "ERROR": return "var(--red)";
      case "CRITICAL": return "#ff0055";
      case "SYSTEM": return "var(--text-secondary)";
      default: return "var(--text-muted)";
    }
  };

  const clearLogs = () => setLocalLogs([]);

  return (
    <motion.div 
      className="p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: settings.animations ? 0.3 : 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-data text-white mb-1">{t('SİSTEM TAKİP LOGLARI', 'SYSTEM TRACKING LOGS')}</h1>
          <p className="text-xs text-muted font-code">
            {t('Uygulama arka plan işlemleri, AI ajan kararları ve sensör verisi dinleme olayları.', 'Application background processes, AI agent decisions, and sensor data events.')}
          </p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 font-data" style={{ fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ accentColor: 'var(--cyan)' }} />
            {t('Otomatik Kaydır', 'Auto Scroll')}
          </label>
          <button 
            className="glass-card py-2 px-4 flex items-center gap-2 hover:bg-white/5 transition-colors"
            onClick={clearLogs}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_sweep</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{t('Logları Temizle', 'Clear Logs')}</span>
          </button>
        </div>
      </div>

      <div className="glass-panel flex-1 rounded-xl p-1 overflow-hidden flex flex-col border border-white/5 bg-black/40">
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          {logs.map((log) => {
            const isCritical = log.level === 'CRITICAL';
            const color = getLevelColor(log.level);
            
            return (
              <div 
                key={log.id} 
                className="flex items-baseline py-1 hover:bg-white/5 transition-colors font-code"
                style={{ 
                  fontSize: 12, 
                  lineHeight: 1.6,
                  color: isCritical ? '#ffdddd' : 'var(--text-secondary)'
                }}
              >
                <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>
                  [{format(log.time, "HH:mm:ss")}]
                </span>
                <span 
                  style={{ 
                    color: color, 
                    fontWeight: 800, 
                    width: 90, 
                    flexShrink: 0,
                    textShadow: isCritical ? `0 0 8px ${color}` : 'none',
                    animation: isCritical ? 'pulse-cyan 1s ease-in-out infinite' : 'none'
                  }}
                >
                  [{log.level}]
                </span>
                <span style={{ color: 'var(--cyan)', width: 140, flexShrink: 0, opacity: 0.8 }}>
                  [{log.source}]
                </span>
                <span className="flex-1 ml-2">
                  — {log.message}
                </span>
              </div>
            )
          })}
          {logs.length === 0 && (
            <div className="p-8 text-center text-muted font-code italic">
              {t('Terminal log kaydı bulunmuyor.', 'No terminal log records found.')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
