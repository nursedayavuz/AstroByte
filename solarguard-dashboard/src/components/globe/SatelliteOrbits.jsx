import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'sgp4'
import { latLonToVec3 } from '../../utils/latLonToVec3'

const SAT_COLORS = {
  TURKEY: new THREE.Color('#ff2222'),
  STARLINK: new THREE.Color('#3366ff'),
  GPS: new THREE.Color('#00ff88'),
  OTHER: new THREE.Color('#88aaee'),
}

export default function SatelliteOrbits({ visible = true, filter = 'ALL', timeMultiplier = 1, backendEnabled = true }) {
  const meshRef = useRef()
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [globalTles, setGlobalTles] = useState([])

  useEffect(() => {
    if (!backendEnabled) {
      setGlobalTles([])
      return
    }
    fetch('/api/global-tles')
      .then(res => res.json())
      .then(data => setGlobalTles(data))
      .catch(err => console.error("TLE Fetch Error:", err))
  }, [backendEnabled])
  
  // Filter the satellites
  const activeSats = useMemo(() => {
    if (filter === 'ALL') return globalTles
    return globalTles.filter(s => s.category === filter)
  }, [filter, globalTles])

  // Precompute satrecs for SGP4
  const satrecs = useMemo(() => {
    return activeSats.map(sat => {
      try {
        return twoline2satrec(sat.tle1, sat.tle2)
      } catch (e) {
        return null
      }
    })
  }, [activeSats])

  // Prepare color array for InstancedMesh
  const colorArray = useMemo(() => {
    const arr = new Float32Array(activeSats.length * 3)
    activeSats.forEach((sat, i) => {
      const color = SAT_COLORS[sat.category] || SAT_COLORS.OTHER
      color.toArray(arr, i * 3)
    })
    return arr
  }, [activeSats])

  // Simulation time
  const simTimeRef = useRef(new Date().getTime())

  const hoveredObj = hoveredIndex !== null && hoveredIndex !== selectedIndex ? activeSats[hoveredIndex] : null
  const selectedObj = selectedIndex !== null ? activeSats[selectedIndex] : null

  // Calculate Orbit Path for selected satellite (approx 120 mins)
  const orbitPoints = useMemo(() => {
    if (!selectedObj) return []
    try {
      const pts = []
      const satrec = twoline2satrec(selectedObj.tle1, selectedObj.tle2)
      const earthRadiusKm = 6371.0
      const now = new Date().getTime()
      for(let i=0; i<=120; i++) {
        const d = new Date(now + i * 60 * 1000)
        const p = propagate(satrec, d)
        if(p.position && !isNaN(p.position.x)) {
          const pgd = eciToGeodetic(p.position, gstime(d))
          const r = 1 + (pgd.height / earthRadiusKm)
          const phi = (90 - (pgd.latitude * 180 / Math.PI)) * (Math.PI / 180)
          const theta = (pgd.longitude * 180 / Math.PI + 90) * (Math.PI / 180)
          pts.push(new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)))
        }
      }
      return pts
    } catch(e) {
      return []
    }
  }, [selectedObj])

  useFrame((state, delta) => {
    if (!meshRef.current || !visible) return

    // Advance time realistically by default (timeMultiplier = 1)
    // If multiplier is higher, simulation runs faster
    simTimeRef.current += (delta * 1000 * timeMultiplier)
    const date = new Date(simTimeRef.current)

    const dummy = new THREE.Object3D()
    const earthRadiusKm = 6371.0

    for (let i = 0; i < activeSats.length; i++) {
      const satrec = satrecs[i]
      if (!satrec) continue

      const positionAndVelocity = propagate(satrec, date)
      const positionEci = positionAndVelocity.position

      if (!positionEci || isNaN(positionEci.x)) {
        // Skip rendering if tracking is lost or TLE is bad
        dummy.position.set(0, 0, 0)
        dummy.scale.set(0, 0, 0)
      } else {
        // gmst (Greenwich Mean Sidereal Time) for ECI to ECEF (Earth-Centered, Earth-Fixed) 
        // This makes sure satellites rotate correctly relative to the rotating Earth mesh
        const gmst_val = gstime(date)
        const positionGd = eciToGeodetic(positionEci, gmst_val)
        
        const longitude = positionGd.longitude
        const latitude = positionGd.latitude
        const height = positionGd.height

        // Our Earth globe has radius = 1 unit.
        // Scale distance: altKm / earthRadiusKm.
        const r = 1 + (height / earthRadiusKm)

        // latitude/longitude are in radians from eciToGeodetic
        const latDeg = latitude * (180 / Math.PI)
        const lonDeg = longitude * (180 / Math.PI)
        
        // Use the unified standard coordinate mapper
        const mappedPos = latLonToVec3(latDeg, lonDeg, r)
        dummy.position.copy(mappedPos)
        
        // Scale differently: Turkish = huge, others = tiny
        const scale = activeSats[i].category === 'TURKEY' ? 2.5 : 0.8
        dummy.scale.set(scale, scale, scale)
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!visible || activeSats.length === 0) return null

  return (
    <group>
      <instancedMesh
        key={`sats-${activeSats.length}`}
        ref={meshRef}
        args={[null, null, activeSats.length]}
        count={activeSats.length}
        onPointerMove={(e) => {
          e.stopPropagation()
          setHoveredIndex(e.instanceId)
        }}
        onPointerOut={() => setHoveredIndex(null)}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedIndex(e.instanceId === selectedIndex ? null : e.instanceId)
        }}
        onPointerMissed={() => setSelectedIndex(null)}
      >
        <sphereGeometry args={[0.008, 6, 6]}>
          <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
        </sphereGeometry>
        <meshBasicMaterial 
          vertexColors 
          transparent 
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Selected Orbit Line */}
      {orbitPoints.length > 0 && selectedObj && (
        <Line 
          points={orbitPoints} 
          color={SAT_COLORS[selectedObj.category] || SAT_COLORS.OTHER} 
          lineWidth={2}
          transparent 
          opacity={0.4}
        />
      )}

      {/* Tooltip for Hovered Satellite */}
      {hoveredObj && meshRef.current && (
        <Html 
          position={
            // Get position of the instance via scratch matrix
            (() => {
              const mat = new THREE.Matrix4()
              meshRef.current.getMatrixAt(hoveredIndex, mat)
              const pos = new THREE.Vector3().setFromMatrixPosition(mat)
              return pos
            })()
          } 
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(5,6,15,0.9)',
            border: `1px solid #${SAT_COLORS[hoveredObj.category]?.getHexString() || 'fff'}`,
            padding: '4px 8px',
            borderRadius: 4,
            color: '#fff',
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            whiteSpace: 'nowrap',
            transform: 'translate(10px, -50%)',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontWeight: 700 }}>{hoveredObj.name}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 8 }}>{hoveredObj.category}</div>
          </div>
        </Html>
      )}

      {/* Expanded HUD Modal for Clicked Satellite */}
      {selectedObj && meshRef.current && (
        <Html 
          position={
            (() => {
              const mat = new THREE.Matrix4()
              meshRef.current.getMatrixAt(selectedIndex, mat)
              return new THREE.Vector3().setFromMatrixPosition(mat)
            })()
          } 
          style={{ zIndex: 100 }}
        >
          <div className="slide-in-right glass-strong" style={{
            width: 280,
            padding: 16,
            borderRadius: 8,
            border: `1px solid #${SAT_COLORS[selectedObj.category]?.getHexString() || '00fff0'}`,
            boxShadow: `0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(0,255,240,0.2)`,
            color: '#fff',
            transform: 'translate(20px, -50%)',
            pointerEvents: 'auto'
          }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                  {selectedObj.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{selectedObj.category === 'TURKEY' ? 'TÜRK UYDUSU' : selectedObj.category} UYDU</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(null) }} style={{ 
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' 
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            
            {/* Added: Etkilenecek Sistemler / Risk Assessment */}
            <div className="p-3 mb-3 border rounded" style={{ background: 'rgba(255, 34, 34, 0.05)', borderColor: 'rgba(255, 34, 34, 0.3)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>RİSK ANALİZİ & ETKİLENEN SİSTEMLER</div>
              <div className="font-data" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>
                <span style={{ color: 'var(--red)' }}>YÜKSEK RİSK</span> - Kp≥6 Seviyesi
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, listStyle: 'circle' }}>
                {selectedObj.category === 'TURKEY' && <li>Kapsama Alanı Daralması (TV/Radyo)</li>}
                {selectedObj.category === 'GPS' && <li>Navigasyon & Zamanlama Hataları</li>}
                {selectedObj.category === 'STARLINK' && <li>Genişbant Bağlantı Kopması</li>}
                <li>Telemetri RF Sinyal Zayıflaması</li>
                <li>Atmosferik Sürtünme Artışı (Yörünge Kaybı)</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="glass-card p-2">
                <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>YÖRÜNGE</div>
                <div className="font-data" style={{ fontSize: 11 }}>{selectedObj.category === 'TURKEY' ? 'GEO (35,786km)' : selectedObj.category === 'GPS' ? 'MEO (20,200km)' : 'LEO (500-2000km)'}</div>
              </div>
              <div className="glass-card p-2" style={{ border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>DURUM</div>
                <div className="font-data" style={{ fontSize: 11, color: 'var(--green)' }}>
                  AKTİF
                </div>
              </div>
            </div>

            <div className="glass p-2 rounded mb-2" style={{ background: 'rgba(0,255,240,0.05)' }}>
              <div style={{ fontSize: 9, color: 'var(--cyan)' }} className="mb-1 flex items-center justify-between">
                <span>TELEMETRİ BAĞLANTISI</span>
                <span className="font-data" style={{ fontSize: 8 }}>-</span>
              </div>
              <div className="flex justify-between font-code" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
                <span>DURUM:</span> <span style={{ color: 'var(--text-muted)' }}>Veri Bekleniyor</span>
              </div>
            </div>
            
            <button className="w-full mt-2 font-display" style={{
              background: 'rgba(0,255,240,0.1)',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)',
              padding: '6px 0',
              fontSize: 9,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(0,255,240,0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(0,255,240,0.1)'}
            >
              DİYAGNOSTİK ÇALIŞTIR
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
