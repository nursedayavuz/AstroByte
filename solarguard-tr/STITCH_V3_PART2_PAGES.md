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
