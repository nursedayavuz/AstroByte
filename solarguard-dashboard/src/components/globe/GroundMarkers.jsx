import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { latLonToVec3 } from '../../utils/latLonToVec3'

function Marker({ asset }) {
  const ringRef = useRef()
  const [hovered, setHovered] = useState(false)
  const pos = latLonToVec3(asset.lat, asset.lon, 1.01)
  const riskColors = { RED: '#ff2222', ORANGE: '#ff8c00', YELLOW: '#ffdc00', GREEN: '#00ff88' }
  const color = riskColors[asset.level] || '#00fff0'

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.3 + 0.2 * Math.sin(clock.getElapsedTime() * 2)
    }
  })

  return (
    <group position={pos}>
      <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.02, 0.002, 8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      {hovered && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(5,6,15,0.95)',
            border: `1px solid ${color}`,
            borderRadius: 8,
            padding: '8px 12px',
            minWidth: 160,
            backdropFilter: 'blur(16px)',
            fontFamily: "'Space Mono', monospace",
            color: '#fff',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{asset.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Risk: {(asset.risk * 100).toFixed(0)}%<br/>
              Kritiklik: %{Math.round(asset.criticality * 100)}<br/>
              Konum: {asset.lat}°N, {asset.lon}°E
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function GroundMarkers({ assets = [] }) {
  return (
    <group>
      {assets.map(asset => <Marker key={asset.id} asset={asset} />)}
    </group>
  )
}
