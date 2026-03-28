import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import Turksat5AModel from './Turksat5AModel'
import { latLonToVec3 } from '../../utils/latLonToVec3'

/* ═══════════════════════════════════════════════════════════════
   TURKSAT 5A ORBITAL SYSTEM
   - Places the 3D satellite model at correct GEO position (31°E)
   - Handles click → animated zoom + detail card with live N2YO data
   - Smooth camera transition on select/deselect
   ═══════════════════════════════════════════════════════════════ */

// Turksat 5A orbital parameters
const TURKSAT_5A = {
  noradId: 47306,
  name: 'TÜRKSAT 5A',
  longitude: 31.0,        // 31°E geostationary slot
  altitude_km: 35786,     // GEO altitude
  inclination: 0.017,     // Near-zero for GEO
  earthRadiusKm: 6371,
  manufacturer: 'Airbus Defence & Space',
  bus: 'Eurostar E3000EOR',
  mass_kg: 3500,
  power_kw: 12,
  transponders: '42 Ku-band',
  launchDate: '2021-01-08',
  launchVehicle: 'SpaceX Falcon 9',
  designLife: '15+ yıl',
  orbitType: 'GEO (35,786 km)',
  services: ['TV Yayıncılığı', 'Genişbant İnternet', 'Veri İletişimi'],
  coverage: ['Türkiye', 'Avrupa', 'Orta Doğu', 'Kuzey Afrika', 'Orta Asya'],
  // TLE data for SGP4 propagation (from CelesTrak)
  tle1: '1 47306U 21001A   26086.83784414  .00000135  00000+0  00000+0 0  9992',
  tle2: '2 47306   0.0170 111.8637 0000220 155.3727 250.5490  1.00271728 19150',
}

// ★ VISUAL SCALE: Real GEO = 6.6x Earth radius → compressed to ~1.45x for dashboard visibility
// This keeps the satellite clearly visible near the globe surface
const GEO_VISUAL_RADIUS = 1.45

// Convert GEO longitude to 3D position
function geoToPosition(lonDeg) {
  return latLonToVec3(0, lonDeg, GEO_VISUAL_RADIUS)
}

// Fetch live orbital data from N2YO via a CORS-friendly proxy
async function fetchN2YOData() {
  try {
    // Try CelesTrak for current TLE (no API key needed)
    const tleRes = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=47306&FORMAT=JSON')
    if (tleRes.ok) {
      const tleData = await tleRes.json()
      if (Array.isArray(tleData) && tleData.length > 0) {
        const sat = tleData[0]
        return {
          source: 'CelesTrak',
          epoch: sat.EPOCH,
          inclination: sat.INCLINATION,
          eccentricity: sat.ECCENTRICITY,
          raan: sat.RA_OF_ASC_NODE,
          argOfPericenter: sat.ARG_OF_PERICENTER,
          meanAnomaly: sat.MEAN_ANOMALY,
          meanMotion: sat.MEAN_MOTION,
          period_min: sat.PERIOD ? sat.PERIOD : (1440 / sat.MEAN_MOTION).toFixed(1),
          semimajorAxis: sat.SEMIMAJOR_AXIS || 42164,
          tle1: sat.TLE_LINE1,
          tle2: sat.TLE_LINE2,
          objectName: sat.OBJECT_NAME,
          lastUpdated: new Date().toISOString(),
        }
      }
    }
  } catch (e) {
    console.warn('CelesTrak fetch failed:', e)
  }
  return null
}

// Orbital GEO ring (visual orbit path)
function GeoOrbitRing({ visible }) {
  const points = useMemo(() => {
    const pts = []
    const r = GEO_VISUAL_RADIUS
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(
        r * Math.cos(angle),
        0,
        r * Math.sin(angle)
      ))
    }
    return pts
  }, [])

  if (!visible) return null

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <line geometry={geo}>
      <lineBasicMaterial
        color="#00fff0"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </line>
  )
}

// Subtle tracking indicator at satellite position
function SatelliteBeacon({ position }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const scale = 1 + Math.sin(t * 2.5) * 0.15
    ref.current.scale.set(scale, scale, scale)
    ref.current.material.opacity = 0.6 + Math.sin(t * 2.5) * 0.2
  })

  return (
    <group position={position}>
      {/* Small diamond-shaped indicator */}
      <mesh ref={ref} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.018, 0]} />
        <meshBasicMaterial
          color="#ffcc44"
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// Detail card component (HTML overlay)
function DetailCard({ liveData, onClose, position }) {
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    // Trigger entrance animation
    setAnimClass('turksat-card-enter')
    const timer = setTimeout(() => setAnimClass('turksat-card-visible'), 50)
    return () => clearTimeout(timer)
  }, [])

  const orbitData = liveData || {}
  const now = new Date()
  const uptime = Math.floor((now - new Date(TURKSAT_5A.launchDate)) / (1000 * 60 * 60 * 24))

  return (
    <Html
      position={position}
      style={{ zIndex: 200, pointerEvents: 'auto' }}
      center={false}
    >
      <div
        className={`turksat-detail-card ${animClass}`}
        onWheel={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 340,
          maxHeight: 520,
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(5,8,22,0.96) 0%, rgba(0,20,50,0.96) 100%)',
          border: '1px solid rgba(0, 255, 240, 0.5)',
          borderRadius: 12,
          padding: 0,
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 0 40px rgba(0,255,240,0.15), 0 8px 32px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,255,240,0.03)',
          backdropFilter: 'blur(20px)',
          // Push strictly 160px relative to the 3D anchor so it never overlaps the hologram
          transform: 'translateX(160px) translateY(-50%)',
          opacity: 0,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(0,255,240,0.15)',
          background: 'rgba(5, 8, 22, 0.95)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '0.08em',
                color: '#fff',
                textShadow: '0 0 10px rgba(0,255,240,0.3)',
              }}>
                🛰️ {TURKSAT_5A.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                NORAD: {TURKSAT_5A.noradId} • {TURKSAT_5A.orbitType}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(255,60,60,0.3)'; e.target.style.borderColor = 'rgba(255,60,60,0.5)' }}
              onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
            >✕</button>
          </div>

          {/* Status bar */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 10,
          }}>
            <span style={{
              fontSize: 9,
              padding: '3px 8px',
              background: 'rgba(0,255,136,0.15)',
              border: '1px solid rgba(0,255,136,0.4)',
              borderRadius: 20,
              color: '#00ff88',
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}>● AKTİF</span>
            <span style={{
              fontSize: 9,
              padding: '3px 8px',
              background: 'rgba(0,255,240,0.1)',
              border: '1px solid rgba(0,255,240,0.3)',
              borderRadius: 20,
              color: '#00fff0',
              fontWeight: 600,
            }}>GÜNDE: {uptime}</span>
            <span style={{
              fontSize: 9,
              padding: '3px 8px',
              background: 'rgba(255,140,66,0.1)',
              border: '1px solid rgba(255,140,66,0.3)',
              borderRadius: 20,
              color: '#ff8c42',
              fontWeight: 600,
            }}>31°E SLOT</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
          }}>
            {[
              { label: 'YÖRÜNGE', value: TURKSAT_5A.orbitType, icon: '🌍' },
              { label: 'KOORDİNAT', value: '31.0°E', icon: '📍' },
              { label: 'KÜTLE', value: `${TURKSAT_5A.mass_kg} kg`, icon: '⚖️' },
              { label: 'GÜÇ', value: `${TURKSAT_5A.power_kw} kW`, icon: '⚡' },
              { label: 'ÖMÜR', value: TURKSAT_5A.designLife, icon: '⏱️' },
              { label: 'İTKİ', value: 'Elektrikli', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 8,
                padding: '8px 10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#00fff0', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Transponder & Coverage */}
          <div style={{
            background: 'rgba(0,255,240,0.04)',
            borderRadius: 8,
            padding: 12,
            border: '1px solid rgba(0,255,240,0.12)',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              YAYIN — PAYLOAD
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Transponder</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00fff0', fontFamily: "'Space Mono', monospace" }}>{TURKSAT_5A.transponders}</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Kapsama Alanı</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {TURKSAT_5A.coverage.map((c, i) => (
                <span key={i} style={{
                  fontSize: 9,
                  padding: '2px 8px',
                  background: 'rgba(0,255,240,0.08)',
                  border: '1px solid rgba(0,255,240,0.2)',
                  borderRadius: 4,
                  color: 'rgba(255,255,255,0.7)',
                }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Live Orbital Data */}
          {orbitData.source && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'pulse-beacon 1.5s infinite' }}></span>
                CANLI ORBITAL VERİ — {orbitData.source}
              </div>
              {[
                { label: 'Eğiklik', value: `${Number(orbitData.inclination).toFixed(4)}°` },
                { label: 'Eksantriklik', value: Number(orbitData.eccentricity).toFixed(7) },
                { label: 'Periyot', value: `${Number(orbitData.period_min).toFixed(1)} dk` },
                { label: 'Yarı-Büyük Eksen', value: `${Number(orbitData.semimajorAxis).toFixed(0)} km` },
                { label: 'Epoch', value: orbitData.epoch },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                  <span style={{ color: '#00fff0', fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Manufacturer Info */}
          <div style={{
            background: 'rgba(255,140,66,0.06)',
            borderRadius: 8,
            padding: 12,
            border: '1px solid rgba(255,140,66,0.15)',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              ÜRETİM — PLATFORM
            </div>
            {[
              { label: 'Üretici', value: TURKSAT_5A.manufacturer },
              { label: 'Platform', value: TURKSAT_5A.bus },
              { label: 'Fırlatma', value: `${TURKSAT_5A.launchVehicle} • ${TURKSAT_5A.launchDate}` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ color: '#ff8c42', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Services */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 8,
            padding: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              HİZMETLER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TURKSAT_5A.services.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.8)',
                }}>
                  <span style={{ color: '#00ff88', fontSize: 8 }}>▶</span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* N2YO Link */}
          <a
            href="https://www.n2yo.com/?s=47306"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'block',
              marginTop: 14,
              padding: '10px 0',
              textAlign: 'center',
              background: 'linear-gradient(90deg, rgba(0,255,240,0.1), rgba(0,255,240,0.05))',
              border: '1px solid rgba(0,255,240,0.3)',
              borderRadius: 8,
              color: '#00fff0',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textDecoration: 'none',
              transition: 'all 0.3s',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => { e.target.style.background = 'rgba(0,255,240,0.2)'; e.target.style.boxShadow = '0 0 20px rgba(0,255,240,0.2)' }}
            onMouseOut={(e) => { e.target.style.background = 'linear-gradient(90deg, rgba(0,255,240,0.1), rgba(0,255,240,0.05))'; e.target.style.boxShadow = 'none' }}
          >
            🔗 N2YO.COM — CANLI İZLEME →
          </a>
        </div>
      </div>
    </Html>
  )
}

/* ═══════════════════ MAIN SYSTEM ═══════════════════ */
export default function Turksat5ASystem({ visible = true }) {
  const [isSelected, setIsSelected] = useState(false)
  const [liveData, setLiveData] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const satelliteGroupRef = useRef()
  const lightRef = useRef()
  const animProgress = useRef(0)
  const originalAutoRotate = useRef(null)

  const { camera } = useThree()

  // Original orbital position
  const originalPos = useMemo(() =>
    geoToPosition(TURKSAT_5A.longitude),
    []
  )

  const modelScale = 0.12

  useEffect(() => {
    if (isSelected && !liveData) {
      fetchN2YOData().then(data => {
        if (data) setLiveData(data)
      })
    }
  }, [isSelected, liveData])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    setIsSelected(prev => !prev)
  }, [])

  // Smooth hologram animation
  useFrame((state, delta) => {
    if (!satelliteGroupRef.current) return
    const controls = state.controls

    if (isSelected) {
      // Pause rotation
      if (controls && controls.autoRotate) {
        originalAutoRotate.current = controls.autoRotate
        controls.autoRotate = false
      }
      animProgress.current = Math.min(animProgress.current + delta * 2.0, 1)
    } else {
      // Resume rotation
      if (animProgress.current === 0 && originalAutoRotate.current !== null && controls) {
        controls.autoRotate = originalAutoRotate.current
        originalAutoRotate.current = null
      }
      animProgress.current = Math.max(animProgress.current - delta * 2.0, 0)
    }

    const t = animProgress.current
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // cubic ease

    if (t > 0) {
      // Hologram target position relative to camera
      const cam = state.camera
      const camDir = new THREE.Vector3()
      cam.getWorldDirection(camDir)
      
      const up = cam.up.clone().normalize()
      const right = new THREE.Vector3().crossVectors(camDir, up).normalize()
      
      // Target: 1.2 units in front of camera, clearly to the left (-0.35)
      const targetPos = cam.position.clone()
        .add(camDir.multiplyScalar(1.2))
        .add(right.multiplyScalar(-0.35))
        .add(up.multiplyScalar(0.02))
      
      satelliteGroupRef.current.position.lerpVectors(originalPos, targetPos, ease)
      
      // Scale up when brought to camera (2.5x max)
      const targetScale = 1 + ease * 1.5 
      satelliteGroupRef.current.scale.setScalar(targetScale)

      // Always face the camera pleasantly in Hologram mode, regardless of Earth position
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(targetPos, cam.position, up)
      )
      // Rotate 180 degrees (Math.PI) so its modeled FRONT faces the camera, plus a slight isometric tilt (-0.3)
      targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI - 0.3))
      
      const identityQuat = new THREE.Quaternion()
      satelliteGroupRef.current.quaternion.slerpQuaternions(identityQuat, targetQuat, ease)
      
      // Keep the hologram beautifully illuminated from the camera's perspective
      if (lightRef.current) {
        lightRef.current.position.copy(cam.position)
      }
    } else {
      satelliteGroupRef.current.position.copy(originalPos)
      satelliteGroupRef.current.scale.setScalar(1)
      satelliteGroupRef.current.quaternion.identity()
    }
  })

  if (!visible) return null

  // Anchor exactly at center in 3D. We will rely on CSS/HTML to offset it to the right!
  // This completely prevents it from being affected by 3D rotation issues.
  const cardPosition = [0, 0, 0]

  return (
    <group>
      <GeoOrbitRing visible={true} />

      <group
        ref={satelliteGroupRef}
        position={[originalPos.x, originalPos.y, originalPos.z]}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        {/* Invisible Click Target */}
        <mesh onClick={handleClick}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <Turksat5AModel
          scale={modelScale}
          isSelected={isSelected}
        />

        {/* Hover Label */}
        {isHovered && !isSelected && (
          <Html position={[0, 0.2, 0]} style={{ pointerEvents: 'none' }} center>
            <div style={{
              background: 'rgba(5,8,22,0.92)',
              border: '1px solid rgba(0, 255, 240, 0.4)',
              padding: '6px 12px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
                🛰️ TÜRKSAT 5A
              </div>
              <div style={{ fontSize: 9, color: 'rgba(0,255,240,0.8)', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                GEO • 31°E • Tıkla → Detaylar
              </div>
            </div>
          </Html>
        )}

        {/* Detail Card overlay */}
        {isSelected && (
          <DetailCard
            liveData={liveData}
            onClose={() => setIsSelected(false)}
            position={cardPosition}
          />
        )}
      </group>
    </group>
  )
}


