// Centralized TR/EN translation dictionary for SolarGuard-TR dashboard
// Usage: import { useTranslation } from './translations'; const t = useTranslation();

const translations = {
  // ═══════ SIDEBAR ═══════
  'OPERATÖR': { tr: 'OPERATÖR', en: 'OPERATOR' },
  'ANA MODÜLLER': { tr: 'ANA MODÜLLER', en: 'MAIN MODULES' },
  'Orbital Görünüm': { tr: 'Orbital Görünüm', en: 'Orbital View' },
  'Güneş Patlamaları': { tr: 'Güneş Patlamaları', en: 'Solar Flares' },
  'Uydu Risk': { tr: 'Uydu Risk', en: 'Satellite Risk' },
  'Tahminler': { tr: 'Tahminler', en: 'Predictions' },
  'Telemetri': { tr: 'Telemetri', en: 'Telemetry' },
  'Risk Analizi': { tr: 'Risk Analizi', en: 'Risk Analysis' },
  'Sistem Logları': { tr: 'Sistem Logları', en: 'System Logs' },
  'Bildirimler': { tr: 'Bildirimler', en: 'Notifications' },
  'Ayarlar': { tr: 'Ayarlar', en: 'Settings' },

  // ═══════ TOPBAR ═══════
  'Son Güncelleme:': { tr: 'Son Güncelleme:', en: 'Last Update:' },
  'VERİ KAYNAĞI: BAĞLANTI YOK': { tr: 'VERİ KAYNAĞI: BAĞLANTI YOK', en: 'DATA SOURCE: DISCONNECTED' },
  'DONKI + NOAA SDO: AKTİF': { tr: 'DONKI + NOAA SDO: AKTİF', en: 'DONKI + NOAA SDO: ACTIVE' },

  // ═══════ DASHBOARD ═══════
  'Kp TAHMİN GRAFİĞİ': { tr: 'Kp TAHMİN GRAFİĞİ', en: 'Kp FORECAST CHART' },
  'BEKLENEN ETKİ SENARYOSU': { tr: 'BEKLENEN ETKİ SENARYOSU', en: 'EXPECTED IMPACT SCENARIO' },
  'OLAY GEÇMİŞİ': { tr: 'OLAY GEÇMİŞİ', en: 'EVENT HISTORY' },
  'TUA UYDU RİSKİ': { tr: 'TUA UYDU RİSKİ', en: 'TUA SATELLITE RISK' },
  'UYDU ETKİLENİYOR': { tr: 'UYDU ETKİLENİYOR', en: 'SATELLITES AFFECTED' },
  'Bekleyen Etki Verisi Yok': { tr: 'Bekleyen Etki Verisi Yok', en: 'No Impact Data Available' },
  'Sistem Analizi Bekleniyor...': { tr: 'Sistem Analizi Bekleniyor...', en: 'Awaiting System Analysis...' },
  'AI KOMUTAN': { tr: 'AI KOMUTAN', en: 'AI COMMANDER' },
  'Patlama': { tr: 'Patlama', en: 'Flare' },
  'Kp İndeksi': { tr: 'Kp İndeksi', en: 'Kp Index' },
  'M+ Olasılık': { tr: 'M+ Olasılık', en: 'M+ Prob.' },
  'CME Hız': { tr: 'CME Hız', en: 'CME Speed' },

  // ═══════ GLOBE CONTROLS ═══════
  'Aurora': { tr: 'Aurora', en: 'Aurora' },
  'Etki Alanı': { tr: 'Etki Alanı', en: 'Impact Zone' },
  'CME Şoku': { tr: 'CME Şoku', en: 'CME Shock' },
  'Tümü': { tr: 'Tümü', en: 'All' },
  'Türk Uyduları': { tr: 'Türk Uyduları', en: 'Turkish Sats' },
  'Starlink': { tr: 'Starlink', en: 'Starlink' },
  'Navigasyon': { tr: 'Navigasyon', en: 'Navigation' },
  'FİLTRE:': { tr: 'FİLTRE:', en: 'FILTER:' },
  'ZAMAN:': { tr: 'ZAMAN:', en: 'TIME:' },

  // ═══════ SETTINGS ═══════
  'Bağlantı ve Veri Kaynakları': { tr: 'Bağlantı ve Veri Kaynakları', en: 'Connection & Data Sources' },
  'API Durumu': { tr: 'API Durumu', en: 'API Status' },
  'Bağlı': { tr: 'Bağlı', en: 'Connected' },
  'Bağlantı Yok': { tr: 'Bağlantı Yok', en: 'Disconnected' },
  'Uyarı Eşik Değerleri': { tr: 'Uyarı Eşik Değerleri', en: 'Alert Thresholds' },
  'Kp Eşiği': { tr: 'Kp Eşiği', en: 'Kp Threshold' },
  'Flair Sınıfı Eşiği': { tr: 'Flair Sınıfı Eşiği', en: 'Flare Class Threshold' },
  'C Sınıfı Üzeri': { tr: 'C Sınıfı Üzeri', en: 'Above C Class' },
  'M Sınıfı Üzeri': { tr: 'M Sınıfı Üzeri', en: 'Above M Class' },
  'X Işını': { tr: 'X Işını', en: 'X-Ray Only' },
  'Görünüm': { tr: 'Görünüm', en: 'Appearance' },
  'Dil': { tr: 'Dil', en: 'Language' },
  'Globe Kalitesi': { tr: 'Globe Kalitesi', en: 'Globe Quality' },
  'Yüksek': { tr: 'Yüksek', en: 'High' },
  'Düşük': { tr: 'Düşük', en: 'Low' },
  'Animasyonlar': { tr: 'Animasyonlar', en: 'Animations' },
  'Açık': { tr: 'Açık', en: 'On' },
  'Kapalı': { tr: 'Kapalı', en: 'Off' },
  'Scanline Efekti': { tr: 'Scanline Efekti', en: 'Scanline Effect' },
  'Hakkında': { tr: 'Hakkında', en: 'About' },

  // ═══════ SETTINGS TOOLTIPS ═══════
  'tooltip_animations': { 
    tr: 'Sayfa geçişlerindeki ve UI bileşenlerindeki hareket animasyonlarını açar/kapatır. Kapatıldığında performans artar.',
    en: 'Toggles motion animations on page transitions and UI components. Disabling improves performance.'
  },
  'tooltip_scanline': { 
    tr: 'Retro CRT monitör efekti. Açıldığında ekranda yatay tarama çizgileri belirir.',
    en: 'Retro CRT monitor effect. When enabled, horizontal scan lines appear on screen.'
  },
  'tooltip_globe_quality': { 
    tr: 'Globe render kalitesini kontrol eder. Düşük modda daha hızlı, yüksek modda daha detaylı.',
    en: 'Controls globe rendering quality. Low mode is faster, high mode shows more detail.'
  },
  'tooltip_kp_threshold': {
    tr: 'Bu değerin üzerinde Kp indeksi ölçüldüğünde uyarı bildirimi tetiklenir.',
    en: 'Alert notifications trigger when Kp index exceeds this value.'
  },
  'tooltip_flare_threshold': {
    tr: 'Hangi sınıf ve üzerindeki güneş patlamaları için sistemin alarm vereceğini belirler.',
    en: 'Determines which solar flare classes and above will trigger a system alarm.'
  },
  'tooltip_prob_threshold': {
    tr: 'M+ sınıfı patlama olasılığı bu yüzdeyi geçtiğinde risk uyarısı yayınlanır.',
    en: 'A risk alert is issued when the probability of an M+ class flare exceeds this percentage.'
  },

  // ═══════ RISK ANALYSIS ═══════
  'TÜRKİYE KRİTİK ALTYAPI RİSK HARİTASI': { tr: 'TÜRKİYE KRİTİK ALTYAPI RİSK HARİTASI', en: 'TURKEY CRITICAL INFRASTRUCTURE RISK MAP' },
  'Karşılaştırma Senaryoları': { tr: 'Karşılaştırma Senaryoları', en: 'Comparison Scenarios' },
  'Kritik Altyapı Detayları': { tr: 'Kritik Altyapı Detayları', en: 'Critical Infrastructure Details' },
  'Etkilenecek Sistemler': { tr: 'Etkilenecek Sistemler', en: 'Affected Systems' },

  // ═══════ PREDICTIONS ═══════
  'Model Bilgisi': { tr: 'Model Bilgisi', en: 'Model Information' },
  'Güven Aralığı': { tr: 'Güven Aralığı', en: 'Confidence Interval' },

  // ═══════ NOTIFICATIONS ═══════  
  'Bildirim sistemi aktif — veri bekleniyor': { tr: 'Bildirim sistemi aktif — veri bekleniyor', en: 'Notification system active — awaiting data' },
  'Fırtına Uyarısı': { tr: 'Fırtına Uyarısı', en: 'Storm Warning' },
  'CME Yaklaşımı': { tr: 'CME Yaklaşımı', en: 'CME Approach' },
  'Uydu Riski': { tr: 'Uydu Riski', en: 'Satellite Risk' },

  // ═══════ SATELLITE HUD ═══════
  'TÜRK UYDUSU': { tr: 'TÜRK UYDUSU', en: 'TURKISH SATELLITE' },
  'YÖRÜNGE': { tr: 'YÖRÜNGE', en: 'ORBIT' },
  'DURUM': { tr: 'DURUM', en: 'STATUS' },
  'AKTİF': { tr: 'AKTİF', en: 'ACTIVE' },
  'TELEMETRİ BAĞLANTISI': { tr: 'TELEMETRİ BAĞLANTISI', en: 'TELEMETRY LINK' },
  'Veri Bekleniyor': { tr: 'Veri Bekleniyor', en: 'Awaiting Data' },
  'DİYAGNOSTİK ÇALIŞTIR': { tr: 'DİYAGNOSTİK ÇALIŞTIR', en: 'RUN DIAGNOSTICS' },
  'Etkilenecek Sistemler:': { tr: 'Etkilenecek Sistemler:', en: 'Affected Systems:' },

  // ═══════ SYSTEM LOGS ═══════
  'Sistem Takip Logları': { tr: 'Sistem Takip Logları', en: 'System Monitoring Logs' },
}

export function translate(key, lang = 'TR') {
  const entry = translations[key]
  if (!entry) return key
  return lang === 'EN' ? (entry.en || key) : (entry.tr || key)
}

// Hook-compatible helper — use inside components with useSettings
export function createTranslator(lang) {
  return (trText, enText) => {
    // Priority 1: Check if the text is a dictionary key
    const entry = translations[trText]
    if (entry) {
      return lang === 'EN' ? (entry.en || trText) : (entry.tr || trText)
    }
    
    // Priority 2: Use inline fallback arguments
    if (enText !== undefined) {
      return lang === 'EN' ? enText : trText
    }
    
    // Priority 3: Return the original text
    return trText
  }
}

export default translations
