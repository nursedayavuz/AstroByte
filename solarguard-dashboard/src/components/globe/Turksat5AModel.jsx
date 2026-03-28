import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════════
   TURKSAT 5A  —  Procedural 3D Model
   Based on the SolidWorks render images:
     - Gold/yellow rectangular satellite body ("bus")
     - 2 large solar panel wings (4 panels each side)
     - 4-5 parabolic dish antennas
     - Turkish flag on the body
     - Thruster nozzles at bottom
   ═══════════════════════════════════════════════════════════════ */

// Solar panel grid texture generated procedurally
function createSolarPanelTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Deep blue base
  ctx.fillStyle = '#1a2a6c'
  ctx.fillRect(0, 0, 256, 256)

  // Grid cells
  const cellSize = 32
  for (let x = 0; x < 256; x += cellSize) {
    for (let y = 0; y < 256; y += cellSize) {
      // Cell border (silver frame)
      ctx.strokeStyle = '#8899bb'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2)

      // Inner cell gradient (dark blue silicon)
      const grd = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize)
      grd.addColorStop(0, '#0d1b4a')
      grd.addColorStop(0.5, '#1a3a7c')
      grd.addColorStop(1, '#0d1b4a')
      ctx.fillStyle = grd
      ctx.fillRect(x + 3, y + 3, cellSize - 6, cellSize - 6)

      // Subtle reflective line
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(x + 4, y + cellSize / 2)
      ctx.lineTo(x + cellSize - 4, y + cellSize / 2)
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

// Turkish flag texture
function createFlagTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 80
  const ctx = canvas.getContext('2d')

  // Red background
  ctx.fillStyle = '#e30a17'
  ctx.fillRect(0, 0, 128, 80)

  // White crescent
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(52, 40, 18, 0, Math.PI * 2)
  ctx.fill()

  // Red inner circle for crescent
  ctx.fillStyle = '#e30a17'
  ctx.beginPath()
  ctx.arc(57, 40, 15, 0, Math.PI * 2)
  ctx.fill()

  // White star
  ctx.fillStyle = '#ffffff'
  const cx = 72, cy = 40, r = 8
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const method = i === 0 ? 'moveTo' : 'lineTo'
    ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
  ctx.closePath()
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

// Gold foil material (MLI - Multi-Layer Insulation)
function GoldBody() {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.22, 0.18, 0.16]} />
      <meshStandardMaterial
        color="#c8a832"
        metalness={0.7}
        roughness={0.3}
        emissive="#3d2e00"
        emissiveIntensity={0.15}
      />
    </mesh>
  )
}

// Turkish flag decal on body
function FlagDecal() {
  const flagTexture = useMemo(() => createFlagTexture(), [])

  return (
    <mesh position={[0, -0.02, 0.081]}>
      <planeGeometry args={[0.06, 0.038]} />
      <meshBasicMaterial map={flagTexture} transparent />
    </mesh>
  )
}

// "TURKSAT" text as a raised panel
function TurksatLabel() {
  return (
    <mesh position={[0, 0.04, 0.081]}>
      <planeGeometry args={[0.1, 0.015]} />
      <meshBasicMaterial color="#d4a012" />
    </mesh>
  )
}

// Single solar panel wing (4 segments)
function SolarWing({ side = 1 }) {
  const panelTexture = useMemo(() => createSolarPanelTexture(), [])
  const segments = 4
  const panelWidth = 0.12
  const panelHeight = 0.14
  const gap = 0.008
  const armLength = 0.04

  return (
    <group position={[side * (0.11 + armLength), 0, 0]}>
      {/* Deployment arm */}
      <mesh position={[side * (-armLength / 2), 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, armLength * 2, 6]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.003, 0.003, armLength * 2, 6]} />
        </mesh>
      </mesh>

      {/* Panel segments */}
      {Array.from({ length: segments }).map((_, i) => (
        <group key={i} position={[side * (i * (panelWidth + gap)), 0, 0]}>
          {/* Panel frame */}
          <mesh>
            <boxGeometry args={[panelWidth, panelHeight, 0.004]} />
            <meshStandardMaterial
              color="#cccccc"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Solar cells */}
          <mesh position={[0, 0, 0.003]}>
            <planeGeometry args={[panelWidth - 0.008, panelHeight - 0.008]} />
            <meshStandardMaterial
              map={panelTexture}
              metalness={0.3}
              roughness={0.5}
              emissive="#0a1a4a"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* Cross struts */}
      {Array.from({ length: segments - 1 }).map((_, i) => (
        <mesh key={`strut-${i}`} position={[side * ((i + 0.5) * (panelWidth + gap)), 0, -0.003]}>
          <boxGeometry args={[0.003, panelHeight * 0.9, 0.002]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Parabolic dish antenna
function DishAntenna({ position, scale = 1, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Dish bowl */}
      <mesh rotation={[Math.PI * 0.1, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshStandardMaterial
          color="#d0d0d0"
          metalness={0.6}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Feed horn / support strut */}
      <mesh position={[0, 0.025, -0.02]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.05, 6]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Feed Horn tip */}
      <mesh position={[0, 0.05, -0.035]}>
        <coneGeometry args={[0.005, 0.012, 6]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Thruster nozzle
function Thruster({ position }) {
  return (
    <group position={position}>
      <mesh>
        <coneGeometry args={[0.008, 0.02, 8]} />
        <meshStandardMaterial
          color="#cc9922"
          metalness={0.8}
          roughness={0.2}
          emissive="#aa6600"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* nozzle rim */}
      <mesh position={[0, -0.01, 0]}>
        <torusGeometry args={[0.008, 0.002, 6, 8]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// Small component details on the body
function BodyDetails() {
  return (
    <group>
      {/* Camera / sensor unit */}
      <group position={[-0.08, -0.04, 0.081]}>
        <mesh>
          <boxGeometry args={[0.02, 0.015, 0.008]} />
          <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* lens */}
        <mesh position={[0, 0, 0.005]}>
          <circleGeometry args={[0.004, 12]} />
          <meshStandardMaterial color="#113322" emissive="#00ff44" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Antenna connections / waveguide ports */}
      {[-0.05, 0.05].map((x, i) => (
        <mesh key={i} position={[x, -0.091, 0.03]}>
          <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Side radiator panels */}
      {[1, -1].map((s, i) => (
        <mesh key={`rad-${i}`} position={[0, 0, s * 0.081]}>
          <planeGeometry args={[0.2, 0.16]} />
          <meshStandardMaterial
            color="#c4a428"
            metalness={0.6}
            roughness={0.4}
            emissive="#2a1e00"
            emissiveIntensity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ═══════════════════ MAIN MODEL ═══════════════════ */
export default function Turksat5AModel({ scale = 1, isSelected = false }) {
  const groupRef = useRef()

  // Subtle floating animation
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.05
    // Gentle hover bob
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.002
  })

  return (
    <group
      ref={groupRef}
      scale={[scale, scale, scale]}
    >
      {/* Satellite Body */}
      <GoldBody />
      <FlagDecal />
      <TurksatLabel />
      <BodyDetails />

      {/* Solar Panel Wings */}
      <SolarWing side={1} />
      <SolarWing side={-1} />

      {/* Dish Antennas — matching the render positions */}
      {/* Top antennas */}
      <DishAntenna position={[-0.04, 0.1, -0.02]} scale={1.2} rotation={[-0.3, 0, 0.1]} />
      <DishAntenna position={[0.04, 0.1, 0.02]} scale={1.0} rotation={[-0.2, 0.3, -0.1]} />

      {/* Bottom-front antennas */}
      <DishAntenna position={[-0.06, -0.08, 0.06]} scale={0.9} rotation={[0.4, -0.2, 0]} />
      <DishAntenna position={[0.06, -0.08, 0.06]} scale={1.1} rotation={[0.3, 0.2, 0]} />

      {/* Large rear antenna */}
      <DishAntenna position={[0.07, 0.02, -0.06]} scale={1.3} rotation={[-0.1, 0.8, 0]} />

      {/* Thrusters at bottom */}
      <Thruster position={[-0.03, -0.1, -0.05]} />
      <Thruster position={[0.03, -0.1, -0.05]} />
      <Thruster position={[0, -0.1, -0.06]} />




      {/* Ambient point light for self-illumination */}
      <pointLight
        position={[0, 0, 0.15]}
        intensity={0.3}
        distance={0.8}
        color="#ffdd88"
      />
    </group>
  )
}
