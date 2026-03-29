# SOLARGUARD-TR DASHBOARD — V3 MASTER PROMPT
# PART 1: PROJECT SETUP, DESIGN SYSTEM, GLOBAL LAYOUT
# TUA ASTRO HACKATHON 2026
# 10+ PAGES, EACH BUILT SEPARATELY THEN COMBINED

---

## ⛔ CRITICAL RULES — READ BEFORE ANYTHING

1. **DO NOT** generate static HTML. You MUST create a **working Vite + React** application.
2. **DO NOT** use images where 3D/interactive content is required. The globe MUST be Three.js.
3. **DO NOT** hardcode data. Every number, chart, metric MUST come from API fetch or mock data.
4. **EVERY** sidebar link, nav item, and button MUST work and navigate to a real page/view.
5. **EVERY** page described below is a SEPARATE React component with its own route.
6. You are building a MULTI-PAGE application with React Router. Not a single static page.
7. ALL pages share the same TopBar, Sidebar, and BottomTimeline shell.
8. The app MUST run with `npm run dev` and show real interactive content.

---

## PROJECT INITIALIZATION

```bash
npm create vite@latest solarguard-dashboard -- --template react
cd solarguard-dashboard
npm install three @react-three/fiber @react-three/drei recharts framer-motion react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

### vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000' } }
})
```

### index.html — Add Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet"/>
```

### src/index.css
```css
@import "tailwindcss";

/* ══════════════════════════════════════════════════════════ */
/*  SOLARGUARD-TR GLOBAL DESIGN SYSTEM                       */
/* ══════════════════════════════════════════════════════════ */

:root {
  /* SPACE BACKGROUNDS */
  --bg-void: #000004;
  --bg-space: #000008;
  --bg-deep: #05060f;
  --bg-panel: rgba(8, 12, 30, 0.92);
  --bg-card: rgba(255, 255, 255, 0.025);
  --bg-card-hover: rgba(255, 255, 255, 0.055);
  --bg-glass: rgba(0, 255, 240, 0.04);

  /* BORDERS */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-medium: rgba(255, 255, 255, 0.12);
  --border-accent: rgba(0, 255, 240, 0.25);
  --border-glow: rgba(0, 255, 240, 0.5);

  /* PRIMARY ACCENT — CYAN/TEAL NEON */
  --cyan: #00fff0;
  --cyan-dim: #00c4b8;
  --cyan-glow: rgba(0, 255, 240, 0.15);
  --cyan-strong-glow: rgba(0, 255, 240, 0.4);

  /* SECONDARY — ELECTRIC BLUE */
  --blue: #4fc3f7;
  --blue-dim: #0288d1;

  /* SOLAR — ORANGE/AMBER */
  --orange: #ff8c42;
  --amber: #ffb300;
  --orange-glow: rgba(255, 140, 66, 0.2);

  /* DANGER — RED */
  --red: #ff2222;
  --red-dim: #cc1111;
  --red-glow: rgba(255, 34, 34, 0.15);
  --red-strong-glow: rgba(255, 34, 34, 0.5);

  /* SUCCESS — GREEN */
  --green: #00ff88;
  --green-dim: #00cc6a;

  /* AURORA */
  --aurora-green: #00ff88;
  --aurora-purple: #9c27b0;
  --aurora-pink: #e040fb;

  /* TEXT */
  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.35);
  --text-dim: rgba(255, 255, 255, 0.18);

  /* CHART */
  --chart-lstm: #00fff0;
  --chart-xgb: #ff8c42;
  --chart-baseline: #555577;
  --chart-actual: rgba(255, 255, 255, 0.8);
  --chart-confidence: rgba(0, 255, 240, 0.08);

  /* ALERT LEVELS */
  --alert-green: #00ff88;
  --alert-yellow: #ffdc00;
  --alert-orange: #ff8c00;
  --alert-red: #ff2222;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: var(--bg-void);
  color: var(--text-primary);
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

/* ── GLASSMORPHISM ── */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
}
.glass-strong {
  background: rgba(10, 20, 50, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-medium);
}
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  transition: all 0.3s ease;
}
.glass-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-accent);
  box-shadow: 0 0 20px var(--cyan-glow);
}

/* ── STAR FIELD BACKGROUND ── */
.star-field {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 35% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 25% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 65% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 95% 30%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 10% 90%, rgba(0,255,240,0.2) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 50% 50%, rgba(0,255,240,0.15) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 90% 10%, rgba(0,255,240,0.2) 0%, transparent 100%);
  animation: star-drift 60s linear infinite alternate;
}
@keyframes star-drift {
  from { transform: translate(0, 0); }
  to { transform: translate(-8px, 5px); }
}

/* ── SCANLINE OVERLAY ── */
.scanline::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0, 255, 240, 0.015) 2px, rgba(0, 255, 240, 0.015) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* ── ANIMATIONS ── */
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 15px var(--red-glow); }
  50% { box-shadow: 0 0 45px var(--red-strong-glow), 0 0 80px rgba(255,34,34,0.2); }
}
@keyframes pulse-cyan {
  0%, 100% { box-shadow: 0 0 10px var(--cyan-glow); }
  50% { box-shadow: 0 0 30px var(--cyan-strong-glow); }
}
@keyframes glow-text {
  0%, 100% { text-shadow: 0 0 4px currentColor; }
  50% { text-shadow: 0 0 16px currentColor, 0 0 30px currentColor; }
}
@keyframes slide-in-right {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slide-in-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes counter-roll {
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes orbit-marker {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -30; }
}
@keyframes aurora-breathe {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}

.alert-pulse-red { animation: pulse-red 1.5s ease-in-out infinite; }
.alert-pulse-cyan { animation: pulse-cyan 2s ease-in-out infinite; }
.glow-text { animation: glow-text 2s ease-in-out infinite; }
.slide-in-right { animation: slide-in-right 0.4s ease-out; }
.slide-in-up { animation: slide-in-up 0.3s ease-out; }

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--border-accent);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: var(--cyan-dim); }

/* ── DATA TYPOGRAPHY ── */
.font-data { font-family: 'Space Mono', monospace; }
.font-code { font-family: 'JetBrains Mono', monospace; }
.font-display { font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: 0.15em; }

/* ── MATERIAL ICONS ── */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}
.material-filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* ── RISK BAR ── */
.risk-bar {
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  position: relative;
}
.risk-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
}
.risk-green .risk-bar-fill { background: linear-gradient(90deg, #00cc6a, #00ff88); }
.risk-yellow .risk-bar-fill { background: linear-gradient(90deg, #ccaa00, #ffdc00); }
.risk-orange .risk-bar-fill { background: linear-gradient(90deg, #cc7000, #ff8c00); }
.risk-red .risk-bar-fill { background: linear-gradient(90deg, #cc1111, #ff2222); box-shadow: 0 0 8px rgba(255,34,34,0.4); }
```

---

## FILE STRUCTURE (ALL FILES YOU MUST CREATE)

```
src/
├── main.jsx                          ← Vite entry
├── App.jsx                           ← Router + shell layout
├── index.css                         ← Global CSS (above)
│
├── data/
│   └── mockData.js                   ← ALL mock/demo data constants
│
├── hooks/
│   ├── useApiData.js                 ← Fetch from backend with fallback
│   ├── useClock.js                   ← UTC clock updating every second
│   └── useAlertLevel.js              ← Derived alert state
│
├── components/
│   ├── layout/
│   │   ├── TopBar.jsx                ← Global top navigation bar
│   │   ├── Sidebar.jsx               ← Global left sidebar navigation
│   │   └── BottomTimeline.jsx        ← Global bottom event timeline
│   │
│   ├── globe/
│   │   ├── EarthGlobe.jsx            ← Main Three.js globe component
│   │   ├── Earth.jsx                 ← Earth sphere mesh + texture
│   │   ├── Atmosphere.jsx            ← Atmospheric glow ring
│   │   ├── SatelliteOrbits.jsx       ← Orbit paths + moving satellite dots
│   │   ├── GroundMarkers.jsx         ← Lat/lon markers for Turkish assets
│   │   ├── AuroraRings.jsx           ← Polar aurora visualization
│   │   └── GlobeControls.jsx         ← Toggle buttons for globe overlays
│   │
│   ├── charts/
│   │   ├── KpForecastChart.jsx       ← Recharts: LSTM vs XGB vs baseline
│   │   ├── FlareHistoryChart.jsx     ← Recharts: solar flare timeline
│   │   ├── RiskGaugeChart.jsx        ← Recharts: radial risk gauge
│   │   └── ConfidenceChart.jsx       ← Recharts: confidence interval area
│   │
│   ├── cards/
│   │   ├── AlertBadge.jsx            ← Pulsing alert level indicator
│   │   ├── MetricCard.jsx            ← Reusable glassmorphism stat card
│   │   ├── SatelliteRow.jsx          ← Single satellite risk row
│   │   ├── GroundAssetCard.jsx       ← Ground infrastructure risk card
│   │   ├── EventLogEntry.jsx         ← Single event log entry
│   │   └── StarlinkComparison.jsx    ← Before/after comparison card
│   │
│   └── shared/
│       ├── RiskBar.jsx               ← Horizontal risk progress bar
│       ├── StatusDot.jsx             ← Pulsing colored status indicator
│       ├── CounterNumber.jsx         ← Animated rolling number display
│       └── GlassPanel.jsx            ← Reusable glass container
│
├── pages/
│   ├── DashboardPage.jsx             ← PAGE 1: Main orbital view + globe
│   ├── SolarFlaresPage.jsx           ← PAGE 2: Solar flare analysis
│   ├── SatelliteRiskPage.jsx         ← PAGE 3: Turkish satellite fleet
│   ├── PredictionsPage.jsx           ← PAGE 4: ML model predictions
│   ├── TelemetryPage.jsx             ← PAGE 5: Real-time data streams
│   ├── RiskAnalysisPage.jsx          ← PAGE 6: Ground infrastructure
│   ├── EventReplayPage.jsx           ← PAGE 7: Historical event browser
│   ├── SystemLogsPage.jsx            ← PAGE 8: System logs + alerts
│   ├── NotificationsPage.jsx         ← PAGE 9: Alert notification center
│   └── SettingsPage.jsx              ← PAGE 10: Configuration panel
│
└── utils/
    ├── latLonToVec3.js               ← Coordinate conversion for globe
    ├── formatters.js                 ← Number/date formatting utilities
    └── constants.js                  ← App-wide constants
```

---

## App.jsx — ROOT LAYOUT WITH ROUTER

```jsx
// EXACT CODE — copy this structure
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import BottomTimeline from './components/layout/BottomTimeline'
import DashboardPage from './pages/DashboardPage'
import SolarFlaresPage from './pages/SolarFlaresPage'
import SatelliteRiskPage from './pages/SatelliteRiskPage'
import PredictionsPage from './pages/PredictionsPage'
import TelemetryPage from './pages/TelemetryPage'
import RiskAnalysisPage from './pages/RiskAnalysisPage'
import EventReplayPage from './pages/EventReplayPage'
import SystemLogsPage from './pages/SystemLogsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden relative">
        <div className="star-field" />
        <TopBar />
        <Sidebar />
        <main className="ml-[260px] mt-[60px] mb-[64px] h-[calc(100vh-124px)] overflow-hidden relative">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/solar-flares" element={<SolarFlaresPage />} />
            <Route path="/satellite-risk" element={<SatelliteRiskPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
            <Route path="/event-replay" element={<EventReplayPage />} />
            <Route path="/system-logs" element={<SystemLogsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomTimeline />
      </div>
    </BrowserRouter>
  )
}
```

LAYOUT DIMENSIONS (FIXED, DO NOT CHANGE):
- TopBar: 60px height, full width, fixed top, z-50
- Sidebar: 260px width, fixed left, top: 60px to bottom: 64px, z-40
- BottomTimeline: 64px height, full width, fixed bottom, z-50
- Main content: fills remaining space (ml-260, mt-60, mb-64)

---

## TOPBAR — components/layout/TopBar.jsx

HEIGHT: 60px. Full width. Fixed top.
BACKGROUND: rgba(5, 6, 15, 0.85) + backdrop-blur-xl
BORDER-BOTTOM: 1px solid var(--border-accent) — gives a thin cyan line

### LEFT SECTION (flex, items-center, gap-6):
1. **Logo**: Text "SOLARGUARD-TR" in Inter 800, letter-spacing 0.2em, color var(--cyan)
   - Text-shadow: 0 0 12px rgba(0,255,240,0.5)
   - Below: "Güneş Fırtınası Erken Uyarı Sistemi" — 9px, var(--text-muted), uppercase, tracking-widest

### CENTER SECTION (flex, items-center, gap-4):
2. **Alert Badge (AlertBadge component)**:
   - Pill shape, height 36px, px-5
   - LEFT: Material icon "warning" (filled when RED)
   - CENTER: Text varies by level:
     GREEN → "NORMAL" (bg: rgba(0,255,136,0.1), border: var(--alert-green), text: var(--alert-green))
     YELLOW → "DİKKATLİ" (bg: rgba(255,220,0,0.1), border: var(--alert-yellow), text: var(--alert-yellow))
     ORANGE → "UYARI" (bg: rgba(255,140,0,0.1), border: var(--alert-orange), text: var(--alert-orange))
     RED → "KRİTİK" (bg: rgba(255,34,34,0.1), border: var(--alert-red), text: var(--alert-red))
   - When RED: add class alert-pulse-red, text has glow-text animation
   - Font: Space Mono, 11px, bold, uppercase, tracking-wider

3. **Sub-label**: "Son Güncelleme: {timestamp}" — 9px, Space Mono, var(--text-muted)
   - {timestamp} updates every 30 seconds to current UTC time

### RIGHT SECTION (flex, items-center, gap-6):
4. **NASA Connection Status**:
   - Green dot (8px circle, pulsing) + "NASA DONKI: BAĞLI" in 10px Space Mono
   - If API fails: Red dot + "NASA DONKI: ÇEVRİMDIŞI" — red text

5. **UTC Clock**:
   - "UTC {HH:MM:SS}" — Space Mono 14px, var(--cyan)
   - Updates every second via setInterval in useClock hook
   - Separated by thin vertical line (1px, var(--border-subtle), height 30px)

6. **Action Buttons** (flex, gap-2):
   - Notifications bell icon button (badge with count if alerts exist)
   - Fullscreen toggle button (Material icon "fullscreen")
   - Each: 36x36px, rounded-lg, hover: bg var(--bg-card-hover), text var(--cyan)

---

## SIDEBAR — components/layout/Sidebar.jsx

WIDTH: 260px. Fixed left. Top-to-bottom minus TopBar and BottomTimeline.
BACKGROUND: rgba(5, 6, 15, 0.7) + backdrop-blur-lg
BORDER-RIGHT: 1px solid var(--border-subtle)

### TOP: Operator Badge Section (p-5, border-bottom var(--border-subtle))
- 40x40px icon container: border 1px var(--border-accent), rounded-lg, flex center
  - Material icon "shield" in var(--cyan)
- Right of icon:
  - "OPERATÖR" — 10px Space Mono var(--cyan) uppercase tracking-wider
  - "SolarGuard Mission Control" — 9px var(--text-muted) uppercase

### NAVIGATION SECTION (flex-1, overflow-y-auto, py-3):
Label: "ANA MODÜLLER" — 9px Space Mono var(--text-dim) uppercase tracking-[0.3em] px-5 mb-2

**Navigation Items** — each is a NavLink from react-router-dom:
USE EXACT ICONS AND ROUTES:

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| public | Orbital Görünüm | / | Main dashboard with globe |
| wb_sunny | Güneş Patlamaları | /solar-flares | Solar flare analysis |
| satellite_alt | Uydu Risk | /satellite-risk | Turkish satellite fleet |
| insights | Tahminler | /predictions | ML predictions |
| speed | Telemetri | /telemetry | Real-time streams |
| warning | Risk Analizi | /risk-analysis | Ground infrastructure |
| history | Olay Tekrarı | /event-replay | Historical events |
| terminal | Sistem Logları | /system-logs | Logs and alerts |
| notifications | Bildirimler | /notifications | Alert center |
| settings | Ayarlar | /settings | Configuration |

**Each NavLink styling**:
- INACTIVE: text var(--text-muted), py-3, px-5, flex items-center gap-3
  - Icon: 20px, same color
  - Label: 11px Space Mono uppercase
  - Hover: text var(--text-secondary), bg rgba(255,255,255,0.02)
- ACTIVE: text var(--cyan), bg var(--cyan-glow)
  - Left border: 3px solid var(--cyan)
  - Icon color: var(--cyan)
  - Label: 11px Space Mono uppercase bold

### BOTTOM: Quick Stats Section (p-4, border-top var(--border-subtle)):
Four mini metric cards in 2x2 grid:
- "Kp İndeksi" → "6.8" (large, amber)
- "Patlama" → "X8.1" (large, red)
- "M+ Olasılık" → "%73" (large, cyan)
- "CME Hız" → "2100" (large, white, "km/s" suffix in muted)

Each card: glass-card, p-3, text-center
- Label: 8px uppercase var(--text-dim)
- Value: 18px Space Mono bold

---

## BOTTOM TIMELINE — components/layout/BottomTimeline.jsx

HEIGHT: 64px. Full width. Fixed bottom.
BACKGROUND: rgba(5, 6, 15, 0.9) + backdrop-blur-xl
BORDER-TOP: 1px solid var(--orange) at 30% opacity

### LEFT (w-[140px], flex-col center):
- Material icon "history" in var(--orange)
- "OLAY ZAMAN ÇİZGİSİ" — 9px Space Mono orange uppercase

### CENTER (flex-1, flex items-center gap-4, px-4):
**Playback Controls**:
- Skip back button (28px circle, border var(--border-accent))
- Play/Pause button (36px circle, bg var(--cyan), text black)
  - On click: toggles between play_arrow and pause icons
  - Box-shadow: 0 0 15px var(--cyan-strong-glow)
- Skip forward button (same as back)

**Timeline Scrubber**:
- Full remaining width, height 24px, relative
- Track: 2px height line, bg rgba(255,255,255,0.08), centered vertically
- Progress fill: var(--cyan) colored portion, width based on current position
  - Box-shadow: 0 0 8px var(--cyan-glow) on the leading edge
- Handle: 14px circle, white fill, 2px border var(--cyan), cursor: pointer
  - Hover: scale(1.2) transform
  - Position: absolute, left: {percentage}%
- Event markers on track:
  - X-class: 8px red hexagon (or circle with red bg)
  - M-class: 6px orange circle
  - C-class: 4px yellow circle
  - Clicking a marker navigates to that event's time

**Time Labels** (above track, flex justify-between, text 8px Space Mono var(--text-dim)):
- "-72h", "-48h", "-24h", "-12h", "-6h", "CANLI" (cyan, bold)

### RIGHT (w-[200px], flex items-center gap-4):
- "Senkronizasyon" — 9px var(--text-dim)
- Green pulsing dot + "SİSTEM AKTİF" — 9px var(--green) Space Mono
# SOLARGUARD-TR V3 — PART 2: GLOBE + PAGES 1-5

---

## PAGE 1: DASHBOARD (Orbital Görünüm) — pages/DashboardPage.jsx

This is the HERO page. It MUST be the most visually impressive page.
Layout: Two sections side by side.

### LEFT AREA (flex-1, relative, overflow-hidden):
This contains the 3D GLOBE filling the entire area.

### RIGHT PANEL (w-[340px], flex-col, p-4, gap-4, border-left var(--border-subtle)):
Three sections stacked:
1. Kp Forecast mini chart (KpForecastChart — small version, h-[200px])
2. Starlink Comparison Card (StarlinkComparison)
3. Event Log (EventLogEntry list, scrollable, flex-1)

### FLOATING OVERLAYS ON GLOBE (absolute positioned, z-10, pointer-events-none):

**TOP-LEFT (pointer-events-auto)**: Glass panel, 300px wide, p-5
Title: "GÜNEŞ BEKÇİSİ" — 16px Inter 700 var(--cyan) + "TR-77" suffix in muted
Three metric rows:
- "PATLAMA SINIFI" → "{classType}" large text (X8.1 = RED, M = Orange, C = Yellow)
- "Kp İNDEKSİ" → "{kpValue}" + progress bar 0-9
- "CME HIZI" → "{speed} km/s" + "{eta} saat sonra Dünya'ya varış"

**BOTTOM-LEFT (pointer-events-auto)**: Glass panel, 220px wide
"TUA UYDU RİSKİ" title with satellite_alt icon
5-segment risk bar showing overall fleet risk level
"{n} UYDU ETKİLENİYOR" count text

**BOTTOM-CENTER**: Globe control buttons (GlobeControls)
Row of toggle buttons:
- "Yörüngeler" (toggle orbit visibility)
- "Aurora" (toggle aurora rings)
- "CME" (toggle CME visualization)
- "Heatmap" (toggle geomagnetic heatmap)
- "Sıfırla" (reset camera to default position)
Each: glass-card, py-2 px-3, 10px Space Mono, icon + text
Active: border-color var(--cyan), bg var(--cyan-glow)
Inactive: border-color var(--border-subtle)

---

## 3D GLOBE SPECIFICATION — components/globe/EarthGlobe.jsx

**THIS IS THE MOST IMPORTANT COMPONENT IN THE ENTIRE APPLICATION.**
If this doesn't work, the project fails.

### TECHNOLOGY: @react-three/fiber + @react-three/drei
USE THE `<Canvas>` COMPONENT. Do NOT use raw Three.js WebGLRenderer.

```jsx
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Sphere, Line, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
```

### Earth.jsx — The planet sphere
```
- SphereGeometry: radius 1, widthSegments 64, heightSegments 64
- Texture: load from "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
  - Use useTexture() from drei for easy loading
  - FALLBACK if texture fails: MeshPhongMaterial({ color: '#0a3d62', emissive: '#001122' })
- Material: MeshPhongMaterial with map=earthTexture, specular=#333333, shininess=25
- Auto-rotation: useFrame(() => { meshRef.current.rotation.y += 0.0008 })
- The rotation pauses when user drags (OrbitControls handles this automatically)
```

### Atmosphere.jsx — Edge glow
```
- SphereGeometry: radius 1.015, segments 32
- MeshPhongMaterial: color=#4488ff, transparent=true, opacity=0.08, side=THREE.BackSide
- Slightly transparent blue shell creating atmospheric edge glow
- Follows Earth rotation
```

### SatelliteOrbits.jsx — Orbit rings + moving satellite dots
For each Turkish satellite, draw an orbit ring:

**GEO SATELLITES (Türksat-5A at 31°E, Türksat-5B at 42°E):**
- Orbit at equatorial plane (inclination = 0°)
- Scaled radius: 1 + (35786 / 6371 * 0.15) ≈ 1.84 (scaled down to fit view)
  IMPORTANT: GEO orbit is very far — scale to ~1.5 radius for visual clarity
- Line color: var(--cyan) (#00fff0), opacity 0.5, dashed
- Satellite marker: small sphere (radius 0.02) at fixed longitude on the ring
  - Color: cyan, emissive glow
  - GEO sats appear nearly stationary on the ring

**LEO SATELLITES (GÖKTÜRK-1 at 685km, GÖKTÜRK-2 at 529km, BİLSAT-1 at 686km):**
- Orbits at ~98° inclination (sun-synchronous)
- Scaled radius: ~1.1 (close to Earth surface)
- Line color: var(--blue) (#4fc3f7), opacity 0.7, solid
- Satellite marker: small sphere moving along the orbit path
  - Use useFrame to animate position along the circular path
  - GÖKTÜRK-1: orbital period ~98 min → animate at ~3.6°/frame at 60fps for visible motion
  - Show a small trailing glow behind the moving satellite
  - Color: electric blue with white emissive

**ORBIT PATH GENERATION:**
```js
function generateOrbitPoints(radius, inclinationDeg, numPoints = 128) {
  const incRad = (inclinationDeg * Math.PI) / 180
  const points = []
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle) * Math.sin(incRad)
    const z = radius * Math.sin(angle) * Math.cos(incRad)
    points.push(new THREE.Vector3(x, y, z))
  }
  return points
}
```

**On satellite click:** Show Html overlay (drei Html component) with:
- Satellite name (bold, 14px)
- Alert level badge (colored)
- "Yörünge: {LEO/GEO} | İrtifa: {alt} km"
- "Risk Skoru: {score}" with colored bar
- "Etkilenen Hizmetler: {services}"
- "Önerilen Eylem: {action}"

### GroundMarkers.jsx — Turkish asset markers on globe surface
Mark these positions on the globe surface:

```js
const GROUND_ASSETS = [
  { name: "Türksat Gölbaşı TT&C", lat: 39.79, lon: 32.80, color: '#00fff0', risk: 0.95 },
  { name: "TEDAŞ İstanbul Hub", lat: 41.01, lon: 28.98, color: '#ff2222', risk: 0.89 },
  { name: "TEDAŞ Ankara Hub", lat: 39.92, lon: 32.85, color: '#ff8c00', risk: 0.85 },
  { name: "TEDAŞ İzmir Hub", lat: 38.42, lon: 27.13, color: '#ff8c00', risk: 0.72 },
  { name: "TÜBİTAK Ankara", lat: 39.87, lon: 32.78, color: '#4fc3f7', risk: 0.61 },
]
```

**Lat/Lon to 3D position conversion:**
```js
function latLonToVec3(lat, lon, radius = 1.01) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}
```

**Each marker consists of:**
1. Inner dot: sphere radius 0.012, colored by risk level
2. Outer ring: torus radius 0.02, tube 0.002, same color, opacity animated (pulse)
3. On click: show Html popup with asset name, risk score, type, recommended action

### AuroraRings.jsx — Polar aurora visualization
Visible when Kp ≥ 5 (from alert state).

**North Pole Auroras:**
- Ring 1: TorusGeometry at 65°N latitude, color var(--aurora-green), opacity 0.5
- Ring 2: TorusGeometry at 60°N latitude, color var(--aurora-purple), opacity 0.3
- Ring 3: TorusGeometry at 70°N latitude, color var(--aurora-green), opacity 0.2

**South Pole Auroras:** Mirror of north pole rings

**Animation:**
```js
useFrame(({ clock }) => {
  const t = clock.getElapsedTime()
  ring1.current.material.opacity = 0.3 + 0.2 * Math.sin(t * 1.5)
  ring2.current.material.opacity = 0.2 + 0.15 * Math.sin(t * 1.2 + 1)
  ring3.current.material.opacity = 0.15 + 0.1 * Math.sin(t * 0.8 + 2)
})
```

**Material:** AdditiveBlending for glow effect, transparent=true, side=THREE.DoubleSide

### LIGHTING + CAMERA:
```jsx
<Canvas camera={{ position: [0, 0.5, 2.8], fov: 42 }}>
  <ambientLight intensity={0.35} color="#1a1a44" />
  <directionalLight position={[5, 1, 3]} intensity={1.3} color="#ffffff" />
  <pointLight position={[-3, 0, -2]} intensity={0.2} color="#4488ff" />
  <OrbitControls
    enableZoom={true}
    enablePan={false}
    autoRotate={true}
    autoRotateSpeed={0.4}
    minDistance={1.5}
    maxDistance={5}
    zoomSpeed={0.5}
  />
  <Earth />
  <Atmosphere />
  <SatelliteOrbits satellites={satelliteData} />
  <GroundMarkers assets={groundAssets} />
  {kpIndex >= 5 && <AuroraRings kpIndex={kpIndex} />}
</Canvas>
```

---

## PAGE 2: GÜNEŞ PATLAMALARI — pages/SolarFlaresPage.jsx

LAYOUT: Two columns — left 60%, right 40%

### LEFT COLUMN:
**SECTION A: Flare History Chart** (h-[300px])
- Recharts BarChart showing flare events over time
- X-axis: dates (last 90 days)
- Y-axis: flare class numeric (0-5 scale: A=0, B=1, C=2, M=3, X=4)
- Bars colored by class: C=yellow, M=orange, X=red
- Horizontal reference lines at M (3.0, orange dashed) and X (4.0, red dashed)
- Tooltip: date, class type, duration, linked events
- DATA: from /api/recent-flares

**SECTION B: Recent Flare Table** (flex-1, scrollable)
- Table with columns: Tarih/Saat | Sınıf | Süre | Kaynak | CME Bağlantısı | Durum
- Each row: hover highlight, click for detail
- X-class rows: left border 3px red, bg rgba(255,34,34,0.05)
- M-class rows: left border 3px orange
- C-class rows: subtle styling
- Sort by date descending
- Font: JetBrains Mono for data values

### RIGHT COLUMN:
**SECTION C: Current Solar Activity Card** (h-[200px])
- Large display of current/latest flare class
- "Son Patlama: X8.1" — 48px font, red text, glow-text animation
- "01 Şubat 2026 23:44 UTC" — date
- "AR14366 Aktif Bölgesi" — source
- "Süre: 41 dakika" — duration
- Trend indicator: array of last 5 flare dots colored by class

**SECTION D: Solar Cycle Position Card**
- "Güneş Döngüsü 25 — Pik Aktivite Dönemi"
- Visual: simplified sine curve showing cycle 25 position (2019-2030)
- Current position marker on the curve
- "Mevcut Faz: Maksimum yakını (2025-2026)"

**SECTION E: Flare Class Distribution** (Recharts PieChart or horizontal stacked bar)
- Distribution: how many A, B, C, M, X class events in dataset
- Colors matching class colors
- NO PIE CHART — use horizontal stacked bar instead

**SECTION F: CME Association Card**
- "X-class patlamaların %{n}'i CME ile ilişkili"
- "Ortalama CME hızı: {speed} km/s"
- "Dünya'ya ortalama varış süresi: {hours} saat"

---

## PAGE 3: UYDU RISK — pages/SatelliteRiskPage.jsx

LAYOUT: Full width, scrollable

### TOP: Fleet Overview Bar (h-[80px], flex, gap-4)
Five satellite cards in a horizontal row, each showing:
- Satellite name (bold)
- Orbit badge (GEO blue, LEO green)
- Risk score as large number
- Alert level colored dot
- Width: equal, flex-1

### MAIN: Two columns — left 55%, right 45%

**LEFT: Satellite Detail Cards** (stacked, gap-4)
For EACH of the 5 Turkish satellites, create an expanded card:

```
┌─────────────────────────────────────────────────┐
│ 🛰️  TÜRKSAT-5A                    [GEO 35,786 km]│
│ Operatör: Türksat AŞ              Risk: ███████ 78%
│                                                  │
│ Risk Türü: Yüzey Şarjlanması (Surface Charging) │
│ Hizmetler: DTH, Broadband, Devlet İletişimi      │
│ Konum: 31°E Durağan Yörünge                      │
│                                                  │
│ ⚠️ Önerilen Eylem: GEO uyduları için güvenli mod │
│   aktivasyonu                                     │
│                                                  │
│ Risk Katkı Faktörleri:                           │
│  X-ışını etkisi ████████░░ 80%                   │
│  Kp geomagnetik ██████░░░░ 60%                   │
│  Kritiklik ağırlığı ████████░ 95%                │
└─────────────────────────────────────────────────┘
```

- Glass-card background
- Left border: 4px colored by alert level
- Risk bar: animated width fill
- Risk factors: three sub-bars showing contributing factors
- DATA: from /api/turkish-asset-risk → satellite_risks

**RIGHT: Risk Comparison Chart** (Recharts)
- Horizontal bar chart: all 5 satellites, sorted by risk
- Color by alert level
- Reference lines at 0.4 (YELLOW→ORANGE) and 0.7 (ORANGE→RED)
- Below: "Karşılaştırma: Şubat 2022 Starlink Olayı" section (StarlinkComparison card)

---

## PAGE 4: TAHMİNLER — pages/PredictionsPage.jsx

LAYOUT: Full width, two rows

### TOP ROW (h-[380px], flex, gap-4):

**LEFT (flex-1): Kp Forecast Chart — FULL VERSION**
- Recharts AreaChart, large and detailed
- X-axis: 0 to 96 hours, labeled "Saat"
- Y-axis: 0 to 9, labeled "Kp İndeksi"
- Series:
  1. LSTM forecast: solid line, color var(--chart-lstm), strokeWidth 2.5
  2. Confidence band: Area between kp_lower and kp_upper, fill var(--chart-confidence)
  3. XGBoost: dashed line, color var(--chart-xgb), strokeWidth 1.5
  4. Baseline: dotted line, color var(--chart-baseline), strokeWidth 1
- Reference lines (horizontal):
  - Kp=5: yellow dashed, label "Orta Fırtına (G1)"
  - Kp=7: orange dashed, label "Şiddetli Fırtına (G3)"
  - Kp=9: red dashed, label "Ekstrem Fırtına (G5)"
- Vertical line at current hour: white dashed, label "ŞİMDİ"
- Custom tooltip: shows all model values + confidence interval
- Legend: bottom, flex items in a row
- DATA: from /api/forecast-series

**RIGHT (w-[300px]): Model Confidence Panel**
Three probability cards stacked:
- "24 SAAT: %73 M+/X Olasılığı" — large number, red bg if >60%
- "48 SAAT: %61" — orange bg if 40-60%
- "72 SAAT: %49" — yellow bg if 20-40%
Each with:
- Progress ring (circular gauge)
- "Güven Aralığı: ±{ci}%"
- Small trend arrow (up/down)

### BOTTOM ROW (flex-1, flex, gap-4):

**LEFT (flex-1): Model Performance Comparison Table**
```
┌──────────────────────────────────────────────────────────┐
│                    MODEL PERFORMANS METRİKLERİ           │
├────────────────┬──────────────┬──────────────┬───────────┤
│ Metrik         │ Persistence  │ XGBoost      │ LSTM      │
│                │ (Baseline)   │ (İkincil)    │ (Birincil)│
├────────────────┼──────────────┼──────────────┼───────────┤
│ AUC-ROC        │ 0.61         │ 0.74         │ 0.78      │
│ Precision      │ 0.42         │ 0.63         │ 0.71      │
│ Recall         │ 0.55         │ 0.68         │ 0.69      │
│ F1-Score       │ 0.48         │ 0.65         │ 0.70      │
│ Brier Score    │ 0.31         │ 0.22         │ 0.18      │
└────────────────┴──────────────┴──────────────┴───────────┘
```
- Persistence column: red-tinted cells
- LSTM column: green-tinted cells (showing improvement)
- "+28%" improvement badge next to LSTM AUC-ROC

**RIGHT (w-[380px]): Training Info Card**
- "Eğitim Verisi: 54,000 saatlik gözlem"
- "Dönem: 2020-2025 (Strict Temporal Split)"
- "Test Dönemi: Ocak-Mart 2026"
- "Veri Kaynağı: NASA DONKI + NOAA GOES"
- "Leakage Kontrolü: ✅ Zaman bazlı bölme, karıştırma YOK"
- "Model Mimarisi: BiLSTM (64→32) + BatchNorm + Multi-Head Output"

---

## PAGE 5: TELEMETRİ — pages/TelemetryPage.jsx

LAYOUT: Grid of live-updating data streams

### TOP ROW (h-[250px], grid grid-cols-3 gap-4):

**Card 1: Güneş Rüzgarı Hızı**
- Recharts LineChart, real-time look
- X-axis: last 24 hours
- Y-axis: km/s (300-900 range)
- Current value: large display "{speed} km/s"
- Normal range indicator (green band 300-500, yellow 500-700, red 700+)
- Font: JetBrains Mono for all data
- Simulated real-time: add new point every 2 seconds

**Card 2: Plazma Yoğunluğu**
- Similar LineChart
- Y-axis: proton/cm³
- Current value display
- Simulated updates

**Card 3: IMF Bz Bileşeni**
- LineChart with zero-line highlighted
- Negative Bz (southward) = dangerous → red zone below 0
- Positive Bz (northward) = safe → green zone above 0
- "Bz < -10 nT → Şiddetli fırtına tetikleyici"

### MIDDLE ROW (h-[200px], grid grid-cols-4 gap-4):
Four gauge-style cards:

**Gauge 1: X-Işını Akısı**
- Recharts RadialBarChart
- GOES X-ray flux level indicator
- A/B/C/M/X class bands colored
- Current level highlighted

**Gauge 2: Proton Akısı (>10 MeV)**
- Radial gauge
- Threshold at 10 pfu (NOAA S1 level)
- Red zone above 100 pfu

**Gauge 3: Elektron Akısı (>2 MeV)**
- Radial gauge
- GEO electron environment
- Linked to surface charging risk

**Gauge 4: Kp Gerçek Zamanlı**
- Large segmented display (0-9)
- Each segment colored: 0-3 green, 4-5 yellow, 6-7 orange, 8-9 red
- Current value highlighted with glow

### BOTTOM ROW (flex-1, grid grid-cols-2 gap-4):

**Left: ACE/DSCOVR Veri Akışı**
- Terminal-style display (JetBrains Mono, green on black)
- Scrolling data lines:
  ```
  [14:22:08 UTC] SW_V: 548.3 km/s | Np: 4.2 p/cm³ | Bz: -8.7 nT
  [14:22:07 UTC] SW_V: 547.1 km/s | Np: 4.3 p/cm³ | Bz: -8.5 nT
  ```
- Auto-scroll, new line every 1 second
- Color coding: normal=green, warning=yellow, critical=red

**Right: GOES X-ray Flux Timeline**
- Recharts AreaChart
- X-axis: last 72 hours
- Y-axis: logarithmic W/m² (1e-9 to 1e-3)
- Horizontal lines at C, M, X class thresholds
- Area fill: gradient from green→yellow→orange→red
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
