# SOLARGUARD-TR DASHBOARD — V2 PROMPT (WORKING APP)

## ⚠️ CRITICAL INSTRUCTION FOR AI AGENT

**DO NOT generate static HTML.** You MUST create a **working React application** using Vite.
The previous attempt produced a dead mockup with images instead of a real 3D globe. That is UNACCEPTABLE.

**YOU MUST:**
1. Initialize a Vite + React project
2. Install real dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `recharts`, `framer-motion`
3. Use TailwindCSS v3 via PostCSS (NOT CDN script tag)
4. Build a REAL interactive Three.js globe that ROTATES, has REAL satellite orbits, and REAL markers
5. Every panel, button, chart, and sidebar must be FUNCTIONAL React components with state
6. The app must fetch data from `http://localhost:8000/api/*` endpoints with fallback to mock data

**If you cannot install packages, at minimum create a single `index.html` using ES module imports from CDN (`https://esm.sh/`) for React, Three.js, and Recharts — but it MUST be a working React app with real JavaScript logic, NOT just HTML/CSS.**

---

## PROJECT SETUP (Vite + React)

```bash
npm create vite@latest solarguard-dashboard -- --template react
cd solarguard-dashboard
npm install three @react-three/fiber @react-three/drei recharts framer-motion
npm install -D tailwindcss @tailwindcss/vite
```

Tailwind config in `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 }
})
```

In `index.css` add:
```css
@import "tailwindcss";
```

---

## APP ARCHITECTURE (Files to Create)

```
src/
├── App.jsx              ← Root layout (top bar, sidebar, main area, bottom strip)
├── index.css            ← Tailwind + custom CSS (star field, glassmorphism, animations)
├── main.jsx             ← Entry point (already exists from Vite)
├── data/
│   └── mockData.js      ← All mock/demo data constants
├── components/
│   ├── TopBar.jsx        ← Alert level, clock, NASA status
│   ├── Sidebar.jsx       ← Turkish satellites list, ground assets, metrics cards
│   ├── Globe.jsx         ← THREE.JS EARTH GLOBE (most important component)
│   ├── RightPanel.jsx    ← Prediction chart + event log + Starlink comparison
│   ├── BottomTimeline.jsx ← Event timeline scrubber
│   ├── AlertBadge.jsx    ← Pulsing alert level indicator
│   └── KpChart.jsx       ← Recharts area chart for Kp forecast
```

---

## DESIGN SYSTEM

### Color Variables (use in Tailwind config AND inline styles):
```
--bg-space: #000008
--bg-panel: rgba(10, 15, 40, 0.85)
--bg-card: rgba(255, 255, 255, 0.03)
--cyan-primary: #00fff0
--electric-blue: #4fc3f7
--solar-orange: #ff8c42
--solar-red: #ff4444
--aurora-green: #00ff88
--aurora-purple: #9c27b0
```

### Fonts (import from Google Fonts in index.html):
```
Inter (body text), Space Mono (data/numbers), JetBrains Mono (code/logs)
```

### Glassmorphism Panel CSS Class:
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

---

## COMPONENT SPECIFICATIONS

### 1. Globe.jsx — THE HERO COMPONENT (Three.js)

This is the MOST IMPORTANT component. It must be a REAL 3D interactive globe.

```jsx
// USE @react-three/fiber Canvas + @react-three/drei helpers
// This is React Three Fiber — declarative Three.js

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useState, useMemo } from 'react'

// EARTH SPHERE:
// - Use a SphereGeometry with 64 segments
// - Apply NASA Blue Marble texture from: https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg
// - If texture fails → use dark blue material (#0a3d62) as fallback
// - Auto-rotate at 0.001 rad/frame, pause on user drag
// - OrbitControls for mouse interaction (drag to rotate, scroll to zoom)

// ATMOSPHERE GLOW:
// - Slightly larger sphere (radius 1.02), transparent blue, BackSide rendering
// - Opacity 0.1, creates edge-glow effect

// SATELLITE ORBITS (draw as Line loops):
// GEO orbit (Türksat-5A, 5B): equatorial ring at scaled radius
//   - Color: #00fff0 (cyan), opacity 0.6, dashed
// LEO orbits (GÖKTÜRK-1, GÖKTÜRK-2, BİLSAT-1): inclined rings at ~98°
//   - Color: #4fc3f7 (electric blue)
// Animate a small sphere along each orbit path to represent the satellite

// GROUND MARKERS:
// Convert lat/lon to 3D position using:
//   phi = (90 - lat) * PI/180
//   theta = lon * PI/180
//   x = R * sin(phi) * cos(theta)
//   y = R * cos(phi)
//   z = R * sin(phi) * sin(theta)
//
// Turkish assets to mark:
//   Türksat Gölbaşı (39.79, 32.80) → cyan
//   TEDAŞ İstanbul (41.01, 28.98) → red (if risk > 0.7)
//   TEDAŞ Ankara (39.92, 32.85) → orange
//   TÜBİTAK Ankara (39.87, 32.78) → blue
// Each marker: small sphere + pulsing ring animation

// AURORA (when Kp >= 5):
// Torus rings around north pole at ~65° and ~60° latitude
// Green (#00ff88) and purple (#9c27b0)
// Animated opacity (sin wave)
// Additive blending for glow effect

// LIGHTING:
// AmbientLight(0x222244, 0.5) for base
// DirectionalLight(0xffffff, 1.2) from right side (represents sun)
```

**CRITICAL: Use `@react-three/fiber` `<Canvas>` component, NOT raw Three.js.** The Canvas handles the render loop, camera, and scene automatically. Use `useFrame` for animations.

Example structure:
```jsx
function EarthGlobe({ alertLevel, satellites }) {
  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <ambientLight intensity={0.4} color="#222244" />
      <directionalLight position={[5, 0, 3]} intensity={1.2} />
      <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
      <Earth />
      <Atmosphere />
      <SatelliteOrbits satellites={satellites} />
      <GroundMarkers />
      {alertLevel === 'RED' && <AuroraRings />}
    </Canvas>
  )
}
```

### 2. TopBar.jsx

```
Height: 60px, full width, fixed top
Background: rgba(0,0,0,0.6) + backdrop-blur-xl
Border-bottom: 1px solid rgba(0,255,240,0.2)

Left: "SOLARGUARD-TR" logo text (cyan, bold, letter-spacing wide)
Center: Alert level badge (GREEN/YELLOW/ORANGE/RED) — use AlertBadge component
  RED state: pulsing box-shadow animation, text "KRİTİK"
Right: UTC clock (updating every second via setInterval), NASA DONKI status dot
```

### 3. Sidebar.jsx (LEFT PANEL, 280px wide)

```
Fixed left, below TopBar, full height
Background: rgba(0,0,0,0.4) + backdrop-blur

SECTION 1: "UZAY HAVASI" (Space Weather Metrics)
  4 glassmorphism cards stacked:

  Card 1 — GÜNEŞ PATLAMASI: Show "X8.1" in large cyan text
  Card 2 — Kp İNDEKSİ: Show "6.8" with gradient progress bar (0-9 scale)
  Card 3 — M+/X OLASILIGI: Three pill badges
    "24H: %73" (red bg), "48H: %61" (orange bg), "72H: %49" (yellow bg)
  Card 4 — CME DURUMU: Speed "2,100 km/s", ETA countdown

SECTION 2: "TÜRK UZAY VARLIKLARIMIZ" (Turkish Satellite Fleet)
  List each satellite as a row:
    [icon] [name] [orbit badge "GEO"/"LEO"] [risk bar] [status dot]
    Risk bar: horizontal, colored by level, animated width
    Clicking a satellite should log to console (or highlight on globe)

SECTION 3: "KARA ALTYAPISI" (Ground Infrastructure)
  TEDAŞ İstanbul, Ankara, İzmir + Türksat Gölbaşı + TÜBİTAK
  Each with risk score and colored status indicator
```

### 4. RightPanel.jsx (RIGHT PANEL, 320px wide)

```
SECTION 1: "48-96 SAAT TAHMİN PENCERESİ"
  USE RECHARTS AreaChart (NOT a fake SVG path):
    X-axis: hours 0-96
    Y-axis: Kp index 0-9
    Data series:
      - LSTM forecast: solid cyan line + confidence band (Area between kp_lower and kp_upper)
      - XGBoost: dashed orange line
      - Baseline: dashed gray line
    Reference lines at Kp=5 (yellow), Kp=7 (orange), Kp=9 (red)
    Tooltip on hover showing exact values

SECTION 2: "MODEL BAŞARIMI"
  2x2 grid of metric cards:
    AUC-ROC: 0.78 (large font)
    Improvement: Persistence 0.61 → LSTM 0.78 (+28%)
    Accuracy: 24h: 71% | 48h: 64% | 72h: 57%
    Training: 54,000 hourly observations

SECTION 3: "OLAY AKIŞI" (Event Feed)
  Scrollable log, newest first:
    🔴 01 Şub 23:44 UTC — X8.1 Sınıfı Patlama
    🟠 01 Şub 23:50 UTC — Otomatik TEDAŞ uyarısı
    🟡 01 Şub 21:00 UTC — M6.7 Sınıfı Patlama
    🟢 01 Şub 18:00 UTC — CME izleniyor, risk YEŞİL
  New entries slide in with animation

SECTION 4: STARLINK COMPARISON CARD
  Left (red): "Şubat 2022: 40 Starlink uydusu yitirildi, Erken uyarı yoktu"
  Right (green): "SolarGuard-TR ile: 24 saat önceden tahmin, Güvenli mod aktivasyonu"
```

### 5. BottomTimeline.jsx

```
Full width, 80px height, fixed bottom
Interactive timeline slider for Jan-Mar 2026
Event markers: colored dots (X=red hexagon, M=orange circle, C=yellow dot)
Play/Pause button for auto-replay demo
Scrubber handle (draggable)
```

---

## MOCK DATA (src/data/mockData.js)

```javascript
export const MOCK_ALERT = {
  level: "RED",
  label_tr: "KRİTİK",
  current_flare: "X8.1",
  flare_time: "2026-02-01T23:44:00Z",
  kp_forecast_24h: 7.2,
  kp_forecast_48h: 5.8,
  kp_forecast_72h: 4.1,
  prob_mx_24h: 0.73,
  prob_mx_48h: 0.61,
  prob_mx_72h: 0.49,
  cme_speed: 2100,
  cme_eta_hours: 16,
};

export const SATELLITES = [
  { name: "Türksat-5A", orbit: "GEO", alt_km: 35786, risk: 0.78, level: "RED", lon: 31.0 },
  { name: "Türksat-5B", orbit: "GEO", alt_km: 35786, risk: 0.74, level: "RED", lon: 42.0 },
  { name: "GÖKTÜRK-1", orbit: "LEO", alt_km: 685, risk: 0.52, level: "ORANGE", inc: 98.1 },
  { name: "GÖKTÜRK-2", orbit: "LEO", alt_km: 529, risk: 0.43, level: "ORANGE", inc: 97.6 },
  { name: "BİLSAT-1", orbit: "LEO", alt_km: 686, risk: 0.29, level: "YELLOW", inc: 98.1 },
];

export const GROUND_ASSETS = [
  { name: "TEDAŞ İstanbul", lat: 41.01, lon: 28.98, risk: 0.89, type: "power_grid" },
  { name: "TEDAŞ Ankara", lat: 39.92, lon: 32.85, risk: 0.85, type: "power_grid" },
  { name: "TEDAŞ İzmir", lat: 38.42, lon: 27.13, risk: 0.72, type: "power_grid" },
  { name: "Türksat Gölbaşı TT&C", lat: 39.79, lon: 32.80, risk: 0.95, type: "control" },
  { name: "TÜBİTAK Ankara", lat: 39.87, lon: 32.78, risk: 0.61, type: "research" },
];

export const FORECAST_SERIES = Array.from({ length: 96 }, (_, i) => ({
  hour: i,
  kp_lstm: +(Math.max(0, Math.min(9, 3 + 4.2 * Math.exp(-((i-16)**2)/60) + (Math.random()-0.5)*0.3))).toFixed(2),
  kp_xgb: +(Math.max(0, Math.min(9, 2.8 + 3.9 * Math.exp(-((i-18)**2)/70) + (Math.random()-0.5)*0.4))).toFixed(2),
  kp_baseline: +(2.5 + (Math.random()-0.5)*0.5).toFixed(2),
  kp_lower: +(Math.max(0, 2.5 + 3.5 * Math.exp(-((i-16)**2)/60))).toFixed(2),
  kp_upper: +(Math.min(9, 3.5 + 5.0 * Math.exp(-((i-16)**2)/60))).toFixed(2),
}));

export const EVENT_LOG = [
  { time: "23:44", date: "01 Şub", severity: "critical", title: "X8.1 Sınıfı Patlama Tespit Edildi", desc: "AR14366 bölgesinden devasa patlama.", assets: "Türksat-5A, 5B" },
  { time: "23:50", date: "01 Şub", severity: "warning", title: "TEDAŞ Otomatik Uyarı Gönderildi", desc: "İstanbul ve Ankara hub'larına bildirim.", assets: "TEDAŞ" },
  { time: "21:00", date: "01 Şub", severity: "moderate", title: "M6.7 Sınıfı Patlama", desc: "Orta şiddetli patlama tespit edildi.", assets: "GÖKTÜRK-1" },
  { time: "18:00", date: "01 Şub", severity: "info", title: "CME Aktivitesi İzleniyor", desc: "Risk seviyesi yeşil.", assets: "-" },
  { time: "14:30", date: "01 Şub", severity: "info", title: "Rutin Telemetri Güncellemesi", desc: "Tüm sistemler normal.", assets: "-" },
];

export const MODEL_METRICS = {
  lstm_auc: 0.78,
  persistence_auc: 0.61,
  improvement: "+28%",
  accuracy_24h: 71,
  accuracy_48h: 64,
  accuracy_72h: 57,
  training_samples: 54000,
  training_period: "2020-2025",
};
```

---

## API INTEGRATION

```javascript
// src/hooks/useApiData.js
const API_BASE = "http://localhost:8000/api";

export function useApiData() {
  const [data, setData] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [risk, forecast, history, metrics] = await Promise.all([
          fetch(`${API_BASE}/turkish-asset-risk`).then(r => r.json()),
          fetch(`${API_BASE}/forecast-series`).then(r => r.json()),
          fetch(`${API_BASE}/space-weather-history`).then(r => r.json()),
          fetch(`${API_BASE}/model-metrics`).then(r => r.json()),
        ]);
        setData({ risk, forecast, history, metrics });
      } catch (err) {
        console.warn("API unavailable, using mock data", err);
        setUsingMock(true);
        // Fall back to imported mock data
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return { data, usingMock };
}
```

---

## ANIMATIONS (CSS + React)

```css
/* Star field background */
.star-field {
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 50% 40%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 100%);
  /* Repeat pattern with 200+ points */
}

/* Alert pulse for RED state */
@keyframes alert-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(255,34,34,0.3); }
  50% { box-shadow: 0 0 40px rgba(255,34,34,0.7); }
}
.alert-red { animation: alert-pulse 1.5s ease-in-out infinite; }

/* Orbit dash animation */
@keyframes orbit-dash {
  to { stroke-dashoffset: -20; }
}
```

---

## CRITICAL REQUIREMENTS CHECKLIST

You MUST implement ALL of these. If even ONE is missing, the project fails:

- [x] Working Vite + React project that runs with `npm run dev`
- [x] Real Three.js 3D Earth globe using @react-three/fiber (NOT an image)
- [x] Globe rotates automatically and responds to mouse drag
- [x] Turkish satellite orbit lines drawn on globe
- [x] Ground asset markers on globe at correct lat/lon
- [x] Aurora ring visualization around poles
- [x] Recharts AreaChart with LSTM/XGBoost/baseline Kp forecast lines
- [x] Alert level badge with pulsing animation for RED state
- [x] UTC clock updating every second
- [x] Turkish satellite fleet list with risk bars
- [x] Ground infrastructure risk cards
- [x] Event log with colored severity indicators
- [x] Starlink 2022 comparison card
- [x] Bottom timeline with play/pause controls
- [x] API fetch with automatic fallback to mock data
- [x] Dark space theme with glassmorphism panels
- [x] Inter + Space Mono fonts loaded

## DO NOT:
- Use static images for the globe
- Generate only HTML without JavaScript logic
- Produce a single HTML file with CDN Tailwind script tag (use Vite build)
- Leave any component as non-functional placeholder
- Use pie charts (they look amateur)
- Use default browser fonts

---

END OF V2 PROMPT
