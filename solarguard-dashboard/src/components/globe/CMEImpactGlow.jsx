import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getSunDirection } from './Earth'

/**
 * Renders a glowing impact area on the sun-facing side of the Earth
 * to simulate incoming CME plasma or solar wind compression.
 */
const cmeFrag = `
  uniform float time;
  uniform vec3 colorBase;
  uniform float intensity;
  varying vec2 vUv;
  
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  
  void main() {
    // Under this setup, vUv.y = 0 at the impact pole, vUv.y = 1 at the dissipating edge
    float dist = vUv.y; 
    
    // Radial outgoing plasma ripples
    float ripple = sin(dist * 35.0 - time * 6.0) * 0.5 + 0.5;
    
    // Angular breaking (vUv.x wraps around the pole 0 to 2*PI)
    float angularNoise = sin(vUv.x * 12.0 + time * 1.5) * 0.5 + 0.5;
    
    // High frequency boiling plasma details
    float boil = hash(vUv * 80.0 + time * 4.0) * 0.25;
    
    float plasma = (ripple * angularNoise) + boil;
    
    // Smooth fade out at the edges so it blends into space
    float edgeFade = smoothstep(1.0, 0.4, dist);
    
    // Bright super-heated core at the exact impact point
    float coreGlow = smoothstep(0.25, 0.0, dist) * 2.5;

    float alpha = (plasma + coreGlow) * edgeFade * (intensity * 0.12);
    
    // Core gets hot white/yellow, edges stay base red/orange
    vec3 hotColor = mix(colorBase, vec3(1.0, 0.8, 0.4), coreGlow * 0.5 + plasma * 0.3);
    
    gl_FragColor = vec4(hotColor, alpha);
  }
`;

const cmeVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export default function CMEImpactGlow({ active = false, intensity = 6.0, color = "#ff2211" }) {
  const glowRef = useRef()
  const matRef = useRef()

  // Front-facing (Sun-facing) bow shock hemisphere
  const glowGeo = useMemo(() => new THREE.SphereGeometry(1.045, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2.3), [])

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorBase: { value: new THREE.Color(color) },
    intensity: { value: 0 }
  }), [color])

  useFrame(({ clock }) => {
    if (!glowRef.current || !matRef.current) return
    const t = clock.getElapsedTime()
    
    // Animate shader properties
    matRef.current.uniforms.time.value = t
    
    // Smoothly interpolate intensity target (scale based on 0-9 Kp backend scale)
    const targetIntensity = active ? intensity : 0
    matRef.current.uniforms.intensity.value += (targetIntensity - matRef.current.uniforms.intensity.value) * 0.1

    // Fetch the real-time astronomical orientation of the Sun relative to the Earth mesh
    const sunDir = getSunDirection(new Date())
    const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunDir)
    glowRef.current.quaternion.copy(targetQ)
    
    // Subtle rotation around the sun axis to break pattern repetition
    glowRef.current.rotateOnAxis(new THREE.Vector3(0, 1, 0), t * -0.05)
  })

  return (
    <group>
      <mesh ref={glowRef} geometry={glowGeo}>
        <shaderMaterial
          ref={matRef}
          vertexShader={cmeVert}
          fragmentShader={cmeFrag}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
