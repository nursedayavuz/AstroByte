# SOLARGUARD-TR V3 — PART 3: PAGES 6-10, MOCK DATA, API, FINAL INSTRUCTIONS

---

## PAGE 6: RİSK ANALİZİ (Kara Altyapısı) — pages/RiskAnalysisPage.jsx

LAYOUT: Top overview + bottom detail grid

### TOP: Turkey Map Overview (h-[300px])
- Simplified SVG map of Turkey (just outline + major city dots)
- Background: dark, with subtle latitude/longitude grid lines
- Mark each ground asset with pulsing colored dot at correct position:
  - TEDAŞ İstanbul (41.01, 28.98) — dot size proportional to risk
  - TEDAŞ Ankara (39.92, 32.85)
  - TEDAŞ İzmir (38.42, 27.13)
  - Türksat Gölbaşı (39.79, 32.80) — largest dot (highest criticality)
  - TÜBİTAK Ankara (39.87, 32.78)
- Risk colors: GREEN <0.2, YELLOW 0.2-0.4, ORANGE 0.4-0.7, RED >0.7
- Connecting lines between major hubs (dashed, dim)
- Title: "TÜRKİYE KRİTİK ALTYAPI RİSK HARİTASI"
- Animated pulse rings expanding from each marker
- When hovering a dot: show tooltip with name and risk score

### BOTTOM: Asset Detail Grid (grid grid-cols-3 gap-4)

For EACH ground asset, create a detailed card:

**TEDAŞ İstanbul Hub Card:**
```
┌─────────────────────────────────────┐
│ ⚡ TEDAŞ İSTANBUL HUB          RED │
│ Tür: Güç Şebekesi Ana Trafo        │
│ Konum: 41.01°N, 28.98°E            │
│ Kritiklik: %99 (En yüksek)         │
│                                     │
│ GIC Risk Skoru: ████████░░ 0.89     │
│                                     │
│ Tehdit Analizi:                     │
│ • Jeomanyetik İndüklenen Akımlar    │
│ • Trafo doygunluğu riski            │
│ • Şebeke yük dengeleme gerekli      │
│                                     │
│ ⚠️ Uyarı: TEDAŞ operasyon merkezi  │
│   bilgilendirilmeli                 │
└─────────────────────────────────────┘
```

**Türksat Gölbaşı Card (satellite_control type):**
- Special styling: cyan border (this is the satellite control center)
- "TT&C İstasyonu (Telemetry, Tracking & Command)"
- "Tüm Türk uydularının komuta kontrol merkezi"
- Risk: highest criticality (1.0)

**TÜBİTAK Card (research_station type):**
- Blue accent
- "Araştırma İstasyonu"

### RIGHT SIDEBAR: GIC Explanation Panel (w-[280px])
Educational card explaining Geomagnetically Induced Currents:
- "GIC NEDİR?"
- "Şiddetli jeomanyetik fırtınalar sırasında, uzun iletim hatlarında endüklenen DC akımları trafo çekirdeklerini doyuma uğratabilir."
- "Türkiye (37-42°N) orta enlem bölgesindedir. Kp≥6 durumunda risk artar."
- "Referans: Mart 1989 Hydro-Québec çökmesi — 9 saat karanlık"
- Mini infographic showing: Sun → CME → Magnetik Alan → GIC → Trafo

---

## PAGE 7: OLAY TEKRARI — pages/EventReplayPage.jsx

LAYOUT: Full width timeline + event detail panel

### TOP: Interactive Timeline Viewer (h-[250px])
- Full-width horizontal timeline
- Date range: January 1 - March 25, 2026
- Event markers along the timeline:
  - X-class flares: large red hexagons with class label
  - M-class: medium orange circles
  - GST events: purple diamonds below the line
  - CME launches: small cyan triangles above the line
- Zoom controls: zoom in/out on time axis
- Drag to pan through time
- "Play" button: auto-advances through events at configurable speed
- Current selection: highlighted with vertical cyan line

### MIDDLE: Event Detail Panel (flex, gap-4)

**LEFT (flex-1): Selected Event Details**
When an event is clicked on the timeline:
```
┌─────────────────────────────────────────────┐
│ 🔴 X8.1 SINIFI GÜNEŞ PATLAMASI             │
│                                             │
│ Tarih: 01 Şubat 2026, 23:44 UTC            │
│ Kaynak: AR14366 (S17W25)                    │
│ Başlangıç: 23:30 UTC                       │
│ Pik: 23:44 UTC                              │
│ Bitiş: 00:15 UTC (+1 gün)                  │
│ Süre: 45 dakika                             │
│                                             │
│ Bağlı Olaylar:                              │
│  → CME başlatıldı (2100 km/s)              │
│  → SEP proton artışı tespit edildi          │
│  → Kp indeksi 4.2 → 7.2 yükseldi           │
│                                             │
│ SolarGuard-TR Tahmini:                      │
│  ✅ 24 saat önceden %71 olasılık tespit     │
│  ✅ Türksat-5A güvenli mod uyarısı gönderildi│
│  ✅ TEDAŞ İstanbul hub bilgilendirildi      │
└─────────────────────────────────────────────┘
```

**RIGHT (w-[320px]): Key Events List**
Scrollable card list of major events:
```
🔴 01 Şub 23:44 — X8.1 Mega Patlama
🔴 02 Şub 00:31 — X2.8 Ardışık Patlama
🟠 02 Şub 06:00 — Kp=7.2 Jeomanyetik Fırtına
🔴 04 Şub 12:02 — X4.2 Sınıfı Patlama
🟡 18 Oca 17:27 — X1.9 Sınıfı Patlama
🟠 15 Oca 08:15 — M7.3 Sınıfı Patlama
```
Each clickable to load into detail panel

### BOTTOM: Starlink 2022 Comparison Banner
Full-width card with two columns:
- LEFT (red tint): "ŞUBAT 2022: STARLİNK FELAKETİ"
  - "40 uydu atmosferde yanarak yok oldu"
  - "Erken uyarı sistemi YOKTU"
  - "Tahmini kayıp: $50M+"
  - "SpaceX güvenli mod çalıştıramadı"
- RIGHT (green tint): "SOLARGUARD-TR ÇÖZÜMü"
  - "24 saat önceden olay tahmini"
  - "Otomatik güvenli mod uyarısı"
  - "5 Türk uydusu korunabilirdi"
  - "TEDAŞ şebekesi hazırlanabilirdi"
- Center divider: VS icon with lightning bolt

---

## PAGE 8: SİSTEM LOGLARI — pages/SystemLogsPage.jsx

LAYOUT: Terminal-style full-screen log viewer

### TOP BAR (h-[50px]):
- Filter buttons: "Tümü" | "Kritik" | "Uyarı" | "Bilgi" | "Debug"
- Search input: "Log ara..." with magnifying glass icon
- Export button: "Logları İndir (JSON)"
- Auto-scroll toggle: "Otomatik Kaydır" switch

### MAIN: Log Terminal (flex-1, bg black, font JetBrains Mono)
- Background: pure black (#000000)
- Font: JetBrains Mono 12px
- Each log line format:
  ```
  [2026-02-01T23:44:00Z] [CRITICAL] FLR_DETECT: X8.1 sınıfı patlama tespit edildi — AR14366
  [2026-02-01T23:44:01Z] [ALERT]    RISK_CALC: Türksat-5A risk skoru 0.78 → RED seviyesine güncellendi
  [2026-02-01T23:44:02Z] [ALERT]    RISK_CALC: TEDAŞ İstanbul GIC riski 0.89 → RED seviyesine güncellendi
  [2026-02-01T23:44:03Z] [WARNING]  NOTIF_SYS: TEDAŞ operasyon merkezine otomatik uyarı gönderildi
  [2026-02-01T23:44:05Z] [INFO]     API_FETCH: NASA DONKI FLR endpoint yanıt süresi: 342ms
  [2026-02-01T23:44:08Z] [INFO]     MODEL_INF: LSTM tahmin güncellendi — 24h_prob: 0.91, 48h_prob: 0.78
  [2026-02-01T23:44:10Z] [DEBUG]    CACHE_HIT: FLR_2026-01-15_2026-02-14.json yüklendi (12 kayıt)
  ```
- Color coding:
  - CRITICAL: #ff2222 (red)
  - ALERT: #ff8c00 (orange)
  - WARNING: #ffdc00 (yellow)
  - INFO: #00fff0 (cyan)
  - DEBUG: #555555 (gray)
- New entries animate in (slide-in-up)
- Simulate new log entries every 3-5 seconds
- Show at least 50+ log lines

---

## PAGE 9: BİLDİRİMLER — pages/NotificationsPage.jsx

LAYOUT: Left panel (notification list) + Right panel (notification detail)

### LEFT (w-[400px]): Notification List
Scrollable list of notification cards:

Each notification:
```
┌─────────────────────────────────────────┐
│ 🔴 KRİTİK — X8.1 Sınıfı Patlama      │
│ 01 Şub 2026, 23:44 UTC                 │
│ Alıcı: Türksat Operasyon, TEDAŞ, TÜBİTAK│
│ Kanal: API + Simülasyon                 │
│ Durum: ✅ İletildi                      │
└─────────────────────────────────────────┘
```
- Severity badge (colored left border)
- Timestamp
- Recipients
- Delivery channel
- Status: sent/pending/failed

### RIGHT (flex-1): Notification Detail + Simulation

**Notification Preview:**
When a notification is selected, show the full message:
```
═══════════════════════════════════════════
SOLARGUARD-TR OTOMATİK UYARI BİLDİRİMİ
═══════════════════════════════════════════

SEVİYE: KRİTİK (RED)
TARİH: 01 Şubat 2026, 23:44 UTC

OLAY: X8.1 sınıfı güneş patlaması tespit edildi
KAYNAK: Aktif Bölge AR14366 (S17W25)

TAHMİN (SolarGuard-TR LSTM Modeli):
• 24 saat Kp tahmini: 7.2 (Şiddetli Fırtına)
• M+/X olasılığı: %91 (24h), %78 (48h)
• CME varış tahmini: ~16 saat

ETKİLENEN VARLIKLAR:
• Türksat-5A: Risk 0.78 (RED) — Güvenli mod önerilir
• Türksat-5B: Risk 0.74 (RED) — Güvenli mod önerilir
• TEDAŞ İstanbul: GIC riski 0.89 (RED)
• TEDAŞ Ankara: GIC riski 0.85 (RED)

ÖNERİLEN EYLEMLER:
1. GEO uyduları için güvenli mod aktivasyonu
2. TEDAŞ ile yük dengeleme hazırlığı başlatılsın
3. GPS doğruluk uyarısı yayınlansın
4. Havacılık sektörüne HF iletişim uyarısı

Bu bildirim SolarGuard-TR tarafından otomatik
olarak oluşturulmuştur.
═══════════════════════════════════════════
```
- Styled like an email/notification preview
- "Kanal Simülasyonu" section:
  - Email icon + "email@turksat.com.tr" — simulated
  - SMS icon + "+90 312 XXX XXXX" — simulated
  - API icon + "POST /api/alerts/send" — shows JSON payload
- Button: "Bildirimi Tekrar Gönder (Simülasyon)"

---

## PAGE 10: AYARLAR — pages/SettingsPage.jsx

LAYOUT: Single column, card-based settings sections

### SECTION 1: API Yapılandırması
- NASA API Anahtarı: masked input field (shows "DEMO_KEY" or custom)
- API Yenileme Aralığı: dropdown (15s, 30s, 1m, 5m, 15m)
- Backend URL: text input (default: http://localhost:8000)
- Bağlantı durumu: green/red indicator + "Test Et" button

### SECTION 2: Uyarı Eşik Değerleri
- Kp eşikleri: sliders for GREEN→YELLOW (default 4), YELLOW→ORANGE (default 6), ORANGE→RED (default 7)
- Flare class eşikleri: dropdown for alert trigger (C, M, X)
- M+/X olasılık eşiği: slider (default 60%)

### SECTION 3: Bildirim Ayarları
- Email bildirimi: toggle + email input
- SMS bildirimi: toggle + phone input
- API webhook: toggle + URL input
- "Bu bir simülasyondur — gerçek bildirim gönderilmez" disclaimer

### SECTION 4: Görünüm
- Dil: TR/EN toggle (Turkish default)
- Globe kalitesi: Düşük/Orta/Yüksek (affects sphere segments)
- Animasyonlar: toggle on/off
- Scanline efekti: toggle

### SECTION 5: Hakkında
- "SolarGuard-TR v1.0.0"
- "TUA Astro Hackathon 2026"
- "Veri Kaynakları: NASA DONKI, NOAA GOES, Kaggle SWAN-SF"
- "Model: BiLSTM Multi-Output + XGBoost Ensemble"
- GitHub link (placeholder)

---

## MOCK DATA — src/data/mockData.js

THIS FILE MUST CONTAIN ALL FALLBACK DATA. When API is unavailable, everything still works.

```javascript
// ═══════════════════════════════════════════════════
// SOLARGUARD-TR — COMPLETE MOCK DATA
// Used when backend API at localhost:8000 is offline
// ═══════════════════════════════════════════════════

export const ALERT_STATE = {
  level: "RED",
  label_tr: "KRİTİK",
  label_en: "CRITICAL",
  current_flare: "X8.1",
  flare_time: "2026-02-01T23:44:00Z",
  flare_source: "AR14366 (S17W25)",
  kp_current: 6.8,
  kp_forecast_24h: 7.2,
  kp_forecast_48h: 5.8,
  kp_forecast_72h: 4.1,
  prob_mx_24h: 0.73,
  prob_mx_48h: 0.61,
  prob_mx_72h: 0.49,
  cme_speed: 2100,
  cme_eta_hours: 16,
  cme_direction: "Earth-directed",
  solar_cycle: 25,
  solar_cycle_phase: "maximum",
}

export const SATELLITES = [
  { id: "ts5a", name: "Türksat-5A", orbit: "GEO", alt_km: 35786, lon: 31.0, inc: 0, risk: 0.78, level: "RED", risk_type: "surface_charging", operator: "Türksat AŞ", services: ["DTH", "Broadband", "Devlet İletişimi"], criticality: 0.95 },
  { id: "ts5b", name: "Türksat-5B", orbit: "GEO", alt_km: 35786, lon: 42.0, inc: 0, risk: 0.74, level: "RED", risk_type: "surface_charging", operator: "Türksat AŞ", services: ["DTH", "Broadband", "Askeri"], criticality: 0.98 },
  { id: "gk1", name: "GÖKTÜRK-1", orbit: "LEO", alt_km: 685, lon: null, inc: 98.1, risk: 0.52, level: "ORANGE", risk_type: "atmospheric_drag", operator: "Havelsan/MSB", services: ["Askeri Keşif"], criticality: 0.92 },
  { id: "gk2", name: "GÖKTÜRK-2", orbit: "LEO", alt_km: 529, lon: null, inc: 97.6, risk: 0.43, level: "ORANGE", risk_type: "atmospheric_drag", operator: "TÜBİTAK UZAY", services: ["Sivil Gözlem"], criticality: 0.75 },
  { id: "bs1", name: "BİLSAT-1", orbit: "LEO", alt_km: 686, lon: null, inc: 98.1, risk: 0.29, level: "YELLOW", risk_type: "atmospheric_drag", operator: "TÜBİTAK UZAY", services: ["Multispektral Gözlem"], criticality: 0.55 },
]

export const GROUND_ASSETS = [
  { id: "tedas-ist", name: "TEDAŞ İstanbul Hub", lat: 41.01, lon: 28.98, risk: 0.89, level: "RED", type: "power_grid", criticality: 0.99 },
  { id: "tedas-ank", name: "TEDAŞ Ankara Hub", lat: 39.92, lon: 32.85, risk: 0.85, level: "RED", type: "power_grid", criticality: 0.97 },
  { id: "tedas-izm", name: "TEDAŞ İzmir Hub", lat: 38.42, lon: 27.13, risk: 0.72, level: "RED", type: "power_grid", criticality: 0.90 },
  { id: "turksat-gc", name: "Türksat Gölbaşı TT&C", lat: 39.79, lon: 32.80, risk: 0.95, level: "RED", type: "satellite_control", criticality: 1.0 },
  { id: "tubitak-ank", name: "TÜBİTAK Ankara İstasyonu", lat: 39.87, lon: 32.78, risk: 0.61, level: "ORANGE", type: "research_station", criticality: 0.85 },
]

// Generate 96h forecast series (deterministic)
function seededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x) }
export const FORECAST_SERIES = Array.from({ length: 96 }, (_, i) => ({
  hour: i,
  kp_lstm: +Math.max(0, Math.min(9, 3 + 4.2 * Math.exp(-((i-16)**2)/60) + (seededRandom(i*42)-0.5)*0.3)).toFixed(2),
  kp_xgb: +Math.max(0, Math.min(9, 2.8 + 3.9 * Math.exp(-((i-18)**2)/70) + (seededRandom(i*73)-0.5)*0.4)).toFixed(2),
  kp_baseline: +(2.5 + (seededRandom(i*17)-0.5)*0.5).toFixed(2),
  kp_lower: +Math.max(0, 2.5 + 3.5 * Math.exp(-((i-16)**2)/60)).toFixed(2),
  kp_upper: +Math.min(9, 3.5 + 5.0 * Math.exp(-((i-16)**2)/60)).toFixed(2),
}))

export const EVENT_LOG = [
  { id: 1, time: "23:44", date: "01 Şub 2026", severity: "critical", icon: "🔴", title: "X8.1 Sınıfı Patlama Tespit Edildi", desc: "AR14366 bölgesinden devasa patlama. CME başlatıldı.", assets: ["Türksat-5A", "Türksat-5B"] },
  { id: 2, time: "23:50", date: "01 Şub 2026", severity: "warning", icon: "🟠", title: "TEDAŞ Otomatik Uyarı Gönderildi", desc: "İstanbul ve Ankara hub'larına bildirim yapıldı.", assets: ["TEDAŞ İstanbul", "TEDAŞ Ankara"] },
  { id: 3, time: "23:55", date: "01 Şub 2026", severity: "warning", icon: "🟠", title: "Uydu Güvenli Mod Önerisi Yayınlandı", desc: "Türksat-5A ve 5B için güvenli mod prosedürü önerildi.", assets: ["Türksat-5A", "Türksat-5B"] },
  { id: 4, time: "21:00", date: "01 Şub 2026", severity: "moderate", icon: "🟡", title: "M6.7 Sınıfı Patlama Tespit Edildi", desc: "AR14366'dan orta şiddetli patlama.", assets: ["GÖKTÜRK-1"] },
  { id: 5, time: "18:00", date: "01 Şub 2026", severity: "info", icon: "🟢", title: "CME Aktivitesi İzleniyor", desc: "Halo CME tespit edildi, Dünya'ya yönelik.", assets: [] },
  { id: 6, time: "14:30", date: "01 Şub 2026", severity: "info", icon: "🟢", title: "Rutin Telemetri Güncellemesi", desc: "Tüm Türk uyduları nominal operasyonda.", assets: [] },
  { id: 7, time: "09:15", date: "01 Şub 2026", severity: "info", icon: "🟢", title: "LSTM Model Tahmini Güncellendi", desc: "24h tahmin: %41 M+ olasılığı (yükseliyor).", assets: [] },
  { id: 8, time: "00:31", date: "02 Şub 2026", severity: "critical", icon: "🔴", title: "X2.8 Ardışık Patlama", desc: "İkinci X-sınıfı patlama 47 dakika arayla.", assets: ["Türksat-5A"] },
  { id: 9, time: "06:00", date: "02 Şub 2026", severity: "critical", icon: "🔴", title: "Jeomanyetik Fırtına Başladı (Kp=7.2)", desc: "G3 seviyesi şiddetli jeomanyetik fırtına.", assets: ["TEDAŞ İstanbul", "TEDAŞ Ankara", "TEDAŞ İzmir"] },
  { id: 10, time: "12:02", date: "04 Şub 2026", severity: "critical", icon: "🔴", title: "X4.2 Sınıfı Patlama", desc: "Üçüncü büyük patlama, CME hızı 2400 km/s.", assets: ["Türksat-5A", "Türksat-5B", "GÖKTÜRK-1"] },
]

export const MODEL_METRICS = {
  lstm: { auc_roc: 0.78, precision_24h: 0.71, precision_48h: 0.64, precision_72h: 0.57, recall: 0.69, f1: 0.70, brier: 0.18 },
  xgboost: { auc_roc: 0.74, precision: 0.63, recall: 0.68, f1: 0.65 },
  baselines: { persistence_auc: 0.61, climatological_auc: 0.53 },
  improvement: "+28%",
  training: { samples: 54000, period: "2020-2025", split: "Strict Temporal (2025-01-01)", features: 85 },
}

export const RECENT_FLARES = [
  { id: "flr-001", classType: "X8.1", beginTime: "2026-02-01T23:30Z", peakTime: "2026-02-01T23:44Z", endTime: "2026-02-02T00:15Z", sourceLocation: "S17W25", linkedCME: true, linkedSEP: true },
  { id: "flr-002", classType: "X2.8", beginTime: "2026-02-02T00:20Z", peakTime: "2026-02-02T00:31Z", endTime: "2026-02-02T01:05Z", sourceLocation: "S18W28", linkedCME: true, linkedSEP: false },
  { id: "flr-003", classType: "X4.2", beginTime: "2026-02-04T11:50Z", peakTime: "2026-02-04T12:02Z", endTime: "2026-02-04T12:45Z", sourceLocation: "S16W32", linkedCME: true, linkedSEP: true },
  { id: "flr-004", classType: "X1.9", beginTime: "2026-01-18T17:10Z", peakTime: "2026-01-18T17:27Z", endTime: "2026-01-18T18:00Z", sourceLocation: "N12E45", linkedCME: false, linkedSEP: false },
  { id: "flr-005", classType: "M7.3", beginTime: "2026-01-15T08:00Z", peakTime: "2026-01-15T08:15Z", endTime: "2026-01-15T08:40Z", sourceLocation: "S20W10", linkedCME: true, linkedSEP: false },
  { id: "flr-006", classType: "M6.7", beginTime: "2026-02-01T20:45Z", peakTime: "2026-02-01T21:00Z", endTime: "2026-02-01T21:30Z", sourceLocation: "S17W22", linkedCME: false, linkedSEP: false },
  { id: "flr-007", classType: "M4.2", beginTime: "2026-01-28T14:20Z", peakTime: "2026-01-28T14:35Z", endTime: "2026-01-28T15:00Z", sourceLocation: "N08W15", linkedCME: false, linkedSEP: false },
  { id: "flr-008", classType: "M3.1", beginTime: "2026-01-25T06:10Z", peakTime: "2026-01-25T06:22Z", endTime: "2026-01-25T06:50Z", sourceLocation: "S12E30", linkedCME: false, linkedSEP: false },
]

export const SYSTEM_LOGS = Array.from({ length: 80 }, (_, i) => {
  const levels = ['CRITICAL', 'ALERT', 'WARNING', 'INFO', 'INFO', 'INFO', 'DEBUG', 'DEBUG']
  const level = levels[i % levels.length]
  const messages = {
    CRITICAL: ['FLR_DETECT: X8.1 sınıfı patlama tespit edildi — AR14366', 'GST_ALERT: Kp=7.2 şiddetli jeomanyetik fırtına başladı'],
    ALERT: ['RISK_CALC: Türksat-5A risk skoru 0.78 → RED güncellendi', 'NOTIF_SYS: TEDAŞ İstanbul otomatik uyarı gönderildi'],
    WARNING: ['CME_TRACK: Halo CME tespit edildi — hız 2100 km/s', 'DRAG_EST: GÖKTÜRK-1 atmosferik sürükleme %34 artış'],
    INFO: ['API_FETCH: NASA DONKI FLR yanıt 342ms', 'MODEL_INF: LSTM güncellendi — 24h_prob: 0.73'],
    DEBUG: ['CACHE_HIT: FLR_2026-01-15_2026-02-14.json (12 kayıt)', 'WS_PING: Dashboard bağlantısı aktif'],
  }
  const msgList = messages[level] || messages.INFO
  return {
    id: i,
    timestamp: `2026-02-01T${String(23 - Math.floor(i/8)).padStart(2,'0')}:${String(44 - (i%60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}Z`,
    level,
    message: msgList[i % msgList.length],
  }
})

export const NOTIFICATIONS_LIST = [
  { id: 1, severity: "critical", title: "X8.1 Sınıfı Patlama", time: "01 Şub 2026, 23:44 UTC", recipients: ["Türksat Operasyon", "TEDAŞ", "TÜBİTAK"], channel: "API", status: "sent" },
  { id: 2, severity: "critical", title: "Kp=7.2 Fırtına Uyarısı", time: "02 Şub 2026, 06:00 UTC", recipients: ["TEDAŞ İstanbul", "TEDAŞ Ankara"], channel: "API + Email", status: "sent" },
  { id: 3, severity: "warning", title: "GÖKTÜRK-1 Drag Artışı", time: "02 Şub 2026, 08:30 UTC", recipients: ["MSB Operasyon"], channel: "API", status: "sent" },
  { id: 4, severity: "info", title: "Rutin Durum Raporu", time: "01 Şub 2026, 12:00 UTC", recipients: ["Tüm Operatörler"], channel: "Email", status: "sent" },
]
```

---

## API INTEGRATION — src/hooks/useApiData.js

```javascript
import { useState, useEffect } from 'react'
import * as mock from '../data/mockData'

const API_BASE = '/api'  // Vite proxy to localhost:8000

export function useApiData() {
  const [data, setData] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  async function fetchAll() {
    try {
      const [risk, forecast, history, metrics, flares, storms] = await Promise.all([
        fetch(`${API_BASE}/turkish-asset-risk`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/forecast-series`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/space-weather-history`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/model-metrics`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/recent-flares`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/geomagnetic-storms`).then(r => r.ok ? r.json() : null),
      ])
      if (risk && forecast) {
        setData({ risk, forecast, history, metrics, flares, storms })
        setIsLive(true)
        setLastUpdate(new Date())
      }
    } catch (err) {
      console.warn('API offline, using mock data:', err.message)
      setIsLive(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [])

  // Return API data if available, otherwise mock data
  return {
    isLive,
    lastUpdate,
    alertState: mock.ALERT_STATE,
    satellites: data?.risk?.satellite_risks
      ? Object.entries(data.risk.satellite_risks).map(([name, info]) => ({ name, ...info }))
      : mock.SATELLITES,
    groundAssets: data?.risk?.ground_risks
      ? Object.entries(data.risk.ground_risks).map(([name, info]) => ({ name, ...info }))
      : mock.GROUND_ASSETS,
    forecastSeries: data?.forecast || mock.FORECAST_SERIES,
    modelMetrics: data?.metrics || mock.MODEL_METRICS,
    recentFlares: data?.flares || mock.RECENT_FLARES,
    eventLog: mock.EVENT_LOG,
    systemLogs: mock.SYSTEM_LOGS,
    notifications: mock.NOTIFICATIONS_LIST,
    compositeAlertLevel: data?.risk?.composite_alert_level || "RED",
  }
}
```

---

## FINAL ASSEMBLY INSTRUCTIONS

After building ALL pages separately:

1. Each page is a React component that accepts data from useApiData()
2. All pages share the SAME TopBar, Sidebar, BottomTimeline
3. Navigation via react-router-dom NavLink components
4. Active page highlighted in sidebar
5. Globe only renders on DashboardPage (performance — don't render Three.js on other pages)
6. All charts use Recharts with the design system colors
7. All text in Turkish by default
8. Every "Sıfırla" or reset button must work
9. Every toggle must toggle state
10. Animations must be smooth (use framer-motion for page transitions)

## MANDATORY CHECKLIST — VERIFY ALL

- [ ] `npm run dev` starts without errors
- [ ] 3D globe rotates and responds to mouse drag
- [ ] Globe shows Turkish satellite orbits (3 LEO + 2 GEO)
- [ ] Globe shows ground markers at correct Turkish coordinates
- [ ] Aurora rings appear on globe (at least when Kp ≥ 5)
- [ ] All 10 sidebar links navigate to different pages
- [ ] Active sidebar link is highlighted with cyan
- [ ] Alert badge in TopBar pulses red for RED state
- [ ] UTC clock updates every second
- [ ] Kp forecast chart shows LSTM, XGBoost, and baseline lines
- [ ] Confidence band (area) visible on forecast chart
- [ ] All 5 Turkish satellites listed with risk bars
- [ ] All 5 ground assets shown with risk scores
- [ ] Event log has scrollable entries with severity colors
- [ ] Starlink comparison card visible (before/after)
- [ ] System logs page shows terminal-style log entries
- [ ] Notifications page lists alert notifications
- [ ] Settings page has interactive controls
- [ ] Event replay page has timeline with event markers
- [ ] Telemetry page has live-updating simulated data
- [ ] Risk analysis page shows simplified Turkey map with markers
- [ ] Model metrics table shows LSTM vs XGBoost vs Baseline
- [ ] All data falls back to mock when API is offline
- [ ] Dark space theme throughout — NO white backgrounds anywhere
- [ ] Space Mono font used for all data/numbers
- [ ] Glassmorphism panels on all cards

## DO NOT:
- Use images where Three.js or Recharts should be
- Make any page a dead placeholder
- Use default browser fonts
- Show any white or light backgrounds
- Use pie charts (unprofessional)
- Leave console errors
- Break the layout on 1920x1080 screens
