import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, AdaptiveDpr, Stars } from '@react-three/drei'
import Earth from './Earth'
import Atmosphere from './Atmosphere'
import SatelliteOrbits from './SatelliteOrbits'
import GroundMarkers from './GroundMarkers'
import AuroraRings from './AuroraRings'
import GeomagneticHeatmap from './GeomagneticHeatmap'
import CMEImpactGlow from './CMEImpactGlow'
import Turksat5ASystem from './Turksat5ASystem'
import GenericSatelliteSystem from './GenericSatelliteSystem'

const SATELLITE_CONFIGS = [
  {
    icon: '🛰️', name: 'GÖKTÜRK-1', noradId: 41875, orbitType: 'LEO (680 km)',
    modelUrl: '/models/gokturk1.glb', modelScale: 0.15, rotationOffset: Math.PI,
    isGeo: false, launchDate: '2016-12-05', launchVehicle: 'Vega',
    manufacturer: 'Telespazio / TAI', designLife: '7+ yıl', mission: 'Askeri Yüksek Çözünürlüklü Gözlem',
    payload: '0.8m Optik Sensör', status: 'AKTİF',
    statusColor: '#00ff88', statusColorBg: 'rgba(0,255,136,0.15)', statusColorBorder: '1px solid rgba(0,255,136,0.4)',
    mass_kg: 1060,
    tle1: '1 41875U 16073A   26087.18735498  .00000461  00000+0  99516-4 0  9994',
    tle2: '2 41875  98.1335 343.0931 0001365  79.9970 280.1386 14.62768216496982'
  },
  {
    icon: '🛰️', name: 'GÖKTÜRK-2', noradId: 39030, orbitType: 'LEO (685 km)',
    modelUrl: '/models/gokturk2.glb', modelScale: 0.15, rotationOffset: Math.PI,
    isGeo: false, launchDate: '2012-12-18', launchVehicle: 'Long March 2D',
    manufacturer: 'TÜBİTAK UZAY / TAI', designLife: '5+ yıl', mission: 'Yüksek Çözünürlüklü Gözlem',
    payload: '2.5m Optik Sensör', status: 'AKTİF',
    statusColor: '#00ff88', statusColorBg: 'rgba(0,255,136,0.15)', statusColorBorder: '1px solid rgba(0,255,136,0.4)',
    mass_kg: 400,
    tle1: '1 39030U 12073A   26087.17763351  .00000341  00000+0  57111-4 0  9990',
    tle2: '2 39030  97.6882 288.6447 0000892  98.6722 261.4589 14.75457022712562'
  },
  {
    icon: '📡', name: 'TÜRKSAT 5B', noradId: 50212, orbitType: 'GEO (35,786 km)',
    modelUrl: '/models/turksat5b.glb', modelScale: 0.12, rotationOffset: Math.PI,
    isGeo: true, longitude: 42.0, launchDate: '2021-12-19', launchVehicle: 'Falcon 9',
    manufacturer: 'Airbus Defence & Space', designLife: '15+ yıl', mission: 'Genişbant Haberleşme',
    payload: 'Ka-band (50+ Gbps), Ku-band', status: 'AKTİF',
    statusColor: '#00ff88', statusColorBg: 'rgba(0,255,136,0.15)', statusColorBorder: '1px solid rgba(0,255,136,0.4)',
    mass_kg: 4500,
    tle1: '1 50212U 21126A   26086.98263286  .00000127  00000+0  00000+0 0  9996',
    tle2: '2 50212   0.0777 334.7540 0005271   0.8908 245.4894  1.00271900 15483'
  },
  {
    icon: '🔬', name: 'BİLSAT-1', noradId: 27943, orbitType: 'LEO (686 km)',
    modelUrl: '/models/bilsat.glb', modelScale: 0.15, rotationOffset: Math.PI,
    isGeo: false, launchDate: '2003-09-27', launchVehicle: 'Kosmos-3M',
    manufacturer: 'TÜBİTAK UZAY / SSTL', designLife: '15+ yıl', mission: 'Ar-Ge / Gözlem',
    payload: 'Çok Bantlı Optik', status: 'PASİF',
    statusColor: '#ff4444', statusColorBg: 'rgba(255,68,68,0.15)', statusColorBorder: '1px solid rgba(255,68,68,0.4)',
    mass_kg: 129,
    tle1: '1 39030U 12073A   26087.17763351  .00000341  00000+0  57111-4 0  9990',
    tle2: '2 39030  97.6882 288.6447 0000892  98.6722 261.4589 14.75457022712562'
  }
]

// Ensures metallic GLTF models are brilliantly lit from the user's perspective
function GlobalHeadlight() {
  const lightRef = useRef()
  useFrame(({ camera }) => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position)
    }
  })
  return <directionalLight ref={lightRef} intensity={3.5} color="#ffffff" />
}

export default function EarthGlobe({ satellites = [], groundAssets = [], kpIndex = 6, toggles = {}, swarmFilter = 'ALL', timeMultiplier = 1, backendEnabled = true }) {
  const [key, setKey] = useState(0)
  const canvasRef = useRef()

  // Handle WebGL context loss and restore
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleContextLost = (event) => {
      event.preventDefault()
      console.warn('WebGL context lost, attempting to restore...')
    }

    const handleContextRestored = () => {
      console.log('WebGL context restored, remounting canvas...')
      setKey(prev => prev + 1)
    }

    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [])

  return (
    <div
      role="img"
      aria-label="3D Dünya küre görselleştirmesi — Türk uyduları ve yer istasyonları"
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas
        key={key}
        ref={canvasRef}
        camera={{ position: [0, 0.5, 2.8], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Otomatik DPR ayarı — düşük GPU'larda kaliteyi düşürür */}
        <AdaptiveDpr pixelated />

        {/* === LIGHTING ===
            Our Earth shader handles its own sun/darkness math, so standard lights do NOT affect the globe!
            Because of this, we can safely blast a strong pure-white ambient light here to keep all 
            our 3D satellite models (GLTF/Procedural) perfectly visible and "lit up" everywhere. */}
        <ambientLight intensity={1.5} color="#ffffff" />
        <GlobalHeadlight />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.15}
          minDistance={1.5}
          maxDistance={8}
          zoomSpeed={0.6}
          dampingFactor={0.08}
          enableDamping={true}
        />

        <Stars radius={150} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />

        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        <Atmosphere />
        <SatelliteOrbits visible={toggles.orbits !== false} filter={swarmFilter} timeMultiplier={timeMultiplier} backendEnabled={backendEnabled} />
        <GroundMarkers assets={groundAssets} />
        <AuroraRings kpIndex={toggles.aurora ? (kpIndex || 0) : 0} visible={toggles.aurora !== false} />
        <GeomagneticHeatmap active={toggles.heatmap === true} kpIndex={toggles.heatmap ? (kpIndex || 0) : 0} />
        <CMEImpactGlow active={toggles.cme === true} intensity={toggles.cme ? (kpIndex || 0) : 0} />

        {/* === TURKSAT 5A 3D Satellite Model at GEO 31°E === */}
        <Turksat5ASystem visible={toggles.orbits !== false} />
        <Suspense fallback={null}>
          {SATELLITE_CONFIGS.map(cfg => (
             <GenericSatelliteSystem key={cfg.noradId} config={cfg} visible={toggles.orbits !== false} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  )
}
