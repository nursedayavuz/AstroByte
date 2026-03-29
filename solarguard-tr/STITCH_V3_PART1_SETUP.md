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
