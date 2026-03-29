import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const auroraFrag = `
  uniform float time;
  uniform vec3 colorBase;
  uniform float opacityBase;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    // Generate sweeping vertical streaks resembling auroral curtains
    float noise1 = sin(vUv.x * 40.0 + time * 1.5);
    float noise2 = sin(vUv.x * 90.0 - time * 0.8) * 0.5;
    float staticNoise = hash(vec2(vUv.x * 100.0, floor(time * 15.0))) * 0.15;
    
    // Create sharp bright strikes occasionally
    float flare = pow(sin(vUv.x * 12.0 - time * 2.0) * 0.5 + 0.5, 8.0) * 2.0;

    float streak = max(0.0, noise1 + noise2 + staticNoise + flare);
    
    // Smooth vertical fade (fade out seamlessly at top and bottom)
    float vertFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
    
    // Color gradient: shift from intense neon green to purple/blue at higher altitudes
    vec3 topColor = vec3(0.1, 0.5, 0.9);
    vec3 mixedColor = mix(colorBase, topColor, vUv.y * 1.2);
    
    float alpha = streak * vertFade * opacityBase;
    gl_FragColor = vec4(mixedColor, alpha);
  }
`;

const auroraVert = `
  varying vec2 vUv;
  void main() { 
    vUv = uv; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
  }
`;

function AuroraCurtain({ latitude, color, baseOpacity = 0.5, width = 0.015, height = 0.18 }) {
  const meshRef = useRef()
  const matRef = useRef()
  const ringRadius = Math.cos((latitude * Math.PI) / 180) * 1.015
  const yPos = Math.sin((latitude * Math.PI) / 180) * 1.015

  // Open-ended hollow cylinder acting as a volumetric canvas
  const geometry = useMemo(() => new THREE.CylinderGeometry(ringRadius - width, ringRadius + width, height, 128, 1, true), [ringRadius, width, height])

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorBase: { value: new THREE.Color(color) },
    opacityBase: { value: baseOpacity }
  }), [color, baseOpacity])

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.time.value = state.clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y = state.clock.elapsedTime * 0.03
  })

  // Align cylinder natively to the Y-axis
  const sign = Math.sign(latitude)

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, yPos + (height / 2 * sign), 0]}>
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVert}
        fragmentShader={auroraFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function AuroraRings({ kpIndex = 6, visible = true }) {
  if (!visible || kpIndex <= 0) return null

  // Keep a faint baseline glow so "Aurora" toggle always has visible feedback.
  // Kp >= 5 still appears significantly brighter.
  const intensityMultiplier = Math.max(0.15, Math.min((kpIndex - 2.5) * 0.35, 2.5))

  return (
    <group>
      {/* NORTH POLE */}
      <AuroraCurtain latitude={68} color="#00ffaa" baseOpacity={0.6 * intensityMultiplier} height={0.15} />
      <AuroraCurtain latitude={63} color="#44ff00" baseOpacity={0.3 * intensityMultiplier} height={0.22} width={0.03} />

      {/* SOUTH POLE */}
      <AuroraCurtain latitude={-68} color="#00ffaa" baseOpacity={0.5 * intensityMultiplier} height={0.15} />
      <AuroraCurtain latitude={-63} color="#44ff00" baseOpacity={0.25 * intensityMultiplier} height={0.22} width={0.03} />
    </group>
  )
}
