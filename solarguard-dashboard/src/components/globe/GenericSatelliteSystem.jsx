import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'sgp4'
import { latLonToVec3 } from '../../utils/latLonToVec3'

// Preload standard Earth radius (km)
const EARTH_RADIUS_KM = 6371

// Fetch live orbital data from Celestrak via Norad ID
async function fetchTLEData(noradId) {
  try {
    const tleRes = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=JSON`)
    if (tleRes.ok) {
      const tleData = await tleRes.json()
      if (Array.isArray(tleData) && tleData.length > 0) {
        const sat = tleData[0]
        return {
          source: 'CelesTrak',
          epoch: sat.EPOCH,
          inclination: sat.INCLINATION,
          eccentricity: sat.ECCENTRICITY,
          period_min: sat.PERIOD || (1440 / sat.MEAN_MOTION).toFixed(1),
          semimajorAxis: sat.SEMIMAJOR_AXIS,
          tle1: sat.TLE_LINE1,
          tle2: sat.TLE_LINE2,
          objectName: sat.OBJECT_NAME,
        }
      }
    }
  } catch (e) {
    console.warn(`CelesTrak fetch failed for ${noradId}:`, e)
  }
  return null
}

function DetailCard({ liveData, config, onClose, position }) {
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    setAnimClass('turksat-card-enter')
    const timer = setTimeout(() => setAnimClass('turksat-card-visible'), 50)
    return () => clearTimeout(timer)
  }, [])

  const orbitData = liveData || {}
  const now = new Date()
  const uptime = Math.floor((now - new Date(config.launchDate)) / (1000 * 60 * 60 * 24))

  return (
    <Html position={position} style={{ zIndex: 200, pointerEvents: 'auto' }} center={false}>
      <div
        className={`turksat-detail-card ${animClass}`}
        onWheel={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 340, maxHeight: 520, overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(5,8,22,0.96) 0%, rgba(0,20,50,0.96) 100%)',
          border: '1px solid rgba(0, 255, 240, 0.5)', borderRadius: 12, padding: 0,
          color: '#fff', fontFamily: "'Inter', sans-serif",
          boxShadow: '0 0 40px rgba(0,255,240,0.15), 0 8px 32px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,255,240,0.03)',
          backdropFilter: 'blur(20px)',
          transform: 'translateX(160px) translateY(-50%)', opacity: 0,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          position: 'sticky', top: 0, zIndex: 10, padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(0,255,240,0.15)', background: 'rgba(5, 8, 22, 0.95)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.08em', color: '#fff', textShadow: '0 0 10px rgba(0,255,240,0.3)' }}>
                {config.icon || '🛰️'} {config.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                NORAD: {config.noradId} • {config.orbitType}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(255,60,60,0.3)'; e.target.style.borderColor = 'rgba(255,60,60,0.5)' }}
              onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
            >✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 9, padding: '3px 8px', background: config.statusColorBg, border: config.statusColorBorder, borderRadius: 20, color: config.statusColor, fontWeight: 700, letterSpacing: '0.1em' }}>
              ● {config.status}
            </span>
            <span style={{ fontSize: 9, padding: '3px 8px', background: 'rgba(0,255,240,0.1)', border: '1px solid rgba(0,255,240,0.3)', borderRadius: 20, color: '#00fff0', fontWeight: 600 }}>
              GÜNDE: {uptime}
            </span>
            <span style={{ fontSize: 9, padding: '3px 8px', background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.3)', borderRadius: 20, color: '#ff8c42', fontWeight: 600 }}>
              {config.isGeo ? `${config.longitude}°E SLOT` : 'LEO (Dinamik)' }
            </span>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'YÖRÜNGE', value: config.orbitType, icon: '🌍' },
              { label: 'KÜTLE', value: `${config.mass_kg} kg`, icon: '⚖️' },
              { label: 'GÖREV', value: config.mission, icon: '🎯' },
              { label: 'ÖMÜR', value: config.designLife, icon: '⏱️' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#00fff0', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,255,240,0.04)', borderRadius: 8, padding: 12, border: '1px solid rgba(0,255,240,0.12)', marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              KAPASİTE — PAYLOAD
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Faydalı Yük</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#00fff0', fontFamily: "'Space Mono', monospace" }}>{config.payload}</span>
            </div>
          </div>

          {orbitData.source && (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'pulse-beacon 1.5s infinite' }}></span>
                CANLI ORBITAL VERİ — {orbitData.source}
              </div>
              {[
                { label: 'Eğiklik (Inclination)', value: `${Number(orbitData.inclination).toFixed(4)}°` },
                { label: 'Eksantriklik', value: Number(orbitData.eccentricity).toFixed(7) },
                { label: 'Periyot', value: `${Number(orbitData.period_min).toFixed(1)} dk` },
                { label: 'Yarı-Büyük Eksen', value: `${Number(orbitData.semimajorAxis).toFixed(0)} km` },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                  <span style={{ color: '#00fff0', fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: 'rgba(255,140,66,0.06)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,140,66,0.15)' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              ÜRETİM — PLATFORM
            </div>
            {[
              { label: 'Üretici', value: config.manufacturer },
              { label: 'Fırlatma', value: `${config.launchVehicle} • ${config.launchDate}` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ color: '#ff8c42', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
          
          <a
            href={`https://www.n2yo.com/?s=${config.noradId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'block', marginTop: 14, padding: '10px 0', textAlign: 'center', background: 'linear-gradient(90deg, rgba(0,255,240,0.1), rgba(0,255,240,0.05))', border: '1px solid rgba(0,255,240,0.3)', borderRadius: 8, color: '#00fff0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none', transition: 'all 0.3s', cursor: 'pointer' }}
          >
            🔗 N2YO.COM — CANLI İZLEME →
          </a>
        </div>
      </div>
    </Html>
  )
}


export default function GenericSatelliteSystem({ config, visible = true }) {
  const [isSelected, setIsSelected] = useState(false)
  const [liveData, setLiveData] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const satelliteGroupRef = useRef()
  const animProgress = useRef(0)
  const originalAutoRotate = useRef(null)

  const { camera } = useThree()
  const gltf = useGLTF(config.modelUrl)

  // Forcefully normalize any chaotic .glb sizes / off-center pivots!
  const normalizedModel = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    
    // Shift mesh so origin is precisely centered
    scene.position.x = -center.x
    scene.position.y = -center.y
    scene.position.z = -center.z

    const wrapper = new THREE.Group()
    wrapper.add(scene)
    // Scale down so the largest bounding dimension is exactly 1.0 unit
    wrapper.scale.setScalar(1 / maxDim)
    return wrapper
  }, [gltf.scene])

  const [satPosition, setSatPosition] = useState(new THREE.Vector3(0,0,0))
  const lockedPos = useRef(new THREE.Vector3())

  useEffect(() => {
    fetchTLEData(config.noradId).then(data => {
      if (data) setLiveData(data)
    })
  }, [config.noradId])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    setIsSelected(prev => !prev)
  }, [])

  // Propagate real-time orbit mathematically via SGP4 if TLE available
  useFrame((state, delta) => {
    if (!satelliteGroupRef.current) return
    const controls = state.controls

    // Calculate real satellite physics mapping
    let currentOrbitPos = new THREE.Vector3()
    
    const activeTle1 = liveData?.tle1 || config.tle1
    const activeTle2 = liveData?.tle2 || config.tle2
    
    if (config.isGeo && !activeTle1) {
       currentOrbitPos.copy(latLonToVec3(0, config.longitude, 1.45))
    } else if (activeTle1 && activeTle2) {
       try {
         const now = new Date()
         const satrec = twoline2satrec(activeTle1, activeTle2)
         const posVel = propagate(satrec, now)
         if (posVel && posVel.position !== false) {
            const gmst_val = gstime(now)
            const gd = eciToGeodetic(posVel.position, gmst_val)
            
            let r = 1 + (gd.height / EARTH_RADIUS_KM)
            if (!config.isGeo && gd.height < 2000) {
               r = 1.05 + (gd.height / EARTH_RADIUS_KM) * 2.0 
            } else if (config.isGeo) {
               r = 1.45 
            }
            
            const latDeg = gd.latitude * (180 / Math.PI)
            const lonDeg = gd.longitude * (180 / Math.PI)
            currentOrbitPos.copy(latLonToVec3(latDeg, lonDeg, r))
         }
       } catch (err) {
         // Fallback if TLE parsing crashes completely due to malformed string
         const offsetPhase = config.noradId * 0.1 + state.clock.getElapsedTime() * 0.0011
         currentOrbitPos.set(
           1.15 * Math.cos(offsetPhase),
           1.15 * Math.sin(offsetPhase * 1.5) * 0.5,
           1.15 * Math.sin(offsetPhase)
         )
       }
    } else {
       // FALLBACK for LEOs if API hasn't loaded / Failed
       // Prevent stacking by pseudo-randomizing position via noradId
       // Realistic LEO speed ~90 minutes/orbit -> 0.0011 rad/sec
       const offsetPhase = config.noradId * 0.1 + state.clock.getElapsedTime() * 0.0011
       currentOrbitPos.set(
         1.15 * Math.cos(offsetPhase),
         1.15 * Math.sin(offsetPhase * 1.5) * 0.5,
         1.15 * Math.sin(offsetPhase)
       )
    }

    if (isSelected) {
      if (controls && controls.autoRotate) {
        originalAutoRotate.current = controls.autoRotate
        controls.autoRotate = false
      }
      animProgress.current = Math.min(animProgress.current + delta * 2.0, 1)
    } else {
      if (animProgress.current === 0 && originalAutoRotate.current !== null && controls) {
        controls.autoRotate = originalAutoRotate.current
        originalAutoRotate.current = null
      }
      animProgress.current = Math.max(animProgress.current - delta * 2.0, 0)
      lockedPos.current.copy(currentOrbitPos) // Update origin
    }

    const t = animProgress.current
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 

    if (t > 0) {
      const cam = state.camera
      const camDir = new THREE.Vector3()
      cam.getWorldDirection(camDir)
      
      const up = cam.up.clone().normalize()
      const right = new THREE.Vector3().crossVectors(camDir, up).normalize()
      
      const targetPos = cam.position.clone()
        .add(camDir.multiplyScalar(1.2))
        .add(right.multiplyScalar(-0.35))
        .add(up.multiplyScalar(0.02))
      
      satelliteGroupRef.current.position.lerpVectors(lockedPos.current, targetPos, ease)
      
      // We know normalizedModel is exactly 1 unit big. Scale it to match our UI expectations perfectly.
      const targetScale = config.modelScale * (1 + ease * 3.5) 
      satelliteGroupRef.current.scale.setScalar(targetScale)

      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(targetPos, cam.position, up)
      )
      targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), config.rotationOffset || Math.PI))
      targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2)) // isometric tilt
      
      const baseQuat = new THREE.Quaternion() 
      satelliteGroupRef.current.quaternion.slerpQuaternions(baseQuat, targetQuat, ease)
      
    } else {
      satelliteGroupRef.current.position.copy(lockedPos.current)
      satelliteGroupRef.current.scale.setScalar(config.modelScale)
      satelliteGroupRef.current.quaternion.identity()
      
      // Removed the continuous rapid spin on Y axis so they stay stable while orbiting
      // Force them to simply orient 'upwards' away from globe core:
      const upDir = lockedPos.current.clone().normalize()
      const forwardDir = new THREE.Vector3(0, 1, 0).cross(upDir).normalize()
      if (forwardDir.lengthSq() > 0.0001) {
         satelliteGroupRef.current.quaternion.setFromRotationMatrix(
           new THREE.Matrix4().lookAt(lockedPos.current, new THREE.Vector3(), upDir)
         )
         // Correct orientation so it looks tangential
         satelliteGroupRef.current.rotateX(-Math.PI/2)
      }
    }
  })

  if (!visible) return null

  return (
    <group>
      <group
        ref={satelliteGroupRef}
      >
        <mesh 
          onClick={handleClick}
          onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
          onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
        >
          <sphereGeometry args={[config.isGeo ? 1.0 : 2.0, 16, 16]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} transparent opacity={0} />
        </mesh>

        <primitive object={normalizedModel} />

        {isHovered && !isSelected && (
          <Html position={[0, 0.4, 0]} style={{ pointerEvents: 'none' }} center>
            <div style={{
              background: 'rgba(5,8,22,0.92)', border: '1px solid rgba(0, 255, 240, 0.4)',
              padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                {config.icon || '🛰️'} {config.name}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(0,255,240,0.8)', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                {config.orbitType} • {config.noradId}
              </div>
            </div>
          </Html>
        )}

        {isSelected && (
          <DetailCard
            liveData={liveData}
            config={config}
            onClose={() => setIsSelected(false)}
            position={[0, 0, 0]}
          />
        )}
      </group>
    </group>
  )
}
