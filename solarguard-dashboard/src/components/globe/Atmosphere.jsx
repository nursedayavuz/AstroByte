import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

export default function Atmosphere() {
  return (
    <group>
      {/* Inner atmosphere — subtle blue edge glow */}
      <Sphere args={[1.012, 48, 48]}>
        <meshBasicMaterial
          color="#3388ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
      {/* Outer atmosphere — wider haze */}
      <Sphere args={[1.04, 32, 32]}>
        <meshBasicMaterial
          color="#2266cc"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}
