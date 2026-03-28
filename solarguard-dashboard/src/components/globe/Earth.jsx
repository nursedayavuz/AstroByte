import { useMemo, useRef, useState } from 'react'
import { Sphere, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDir = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform vec3 sunDirection;
  
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;

  void main() {
    vec4 dayColor = texture2D(dayTexture, vUv);
    
    // Core lighting coefficient
    float intensity = dot(vNormalWorld, normalize(sunDirection));
    float blend = smoothstep(-0.10, 0.15, intensity);
    
    // Rayleigh Atmospheric Scattering (Fresnel Edge)
    float fresnel = max(0.0, dot(vViewDir, vNormalWorld));
    float fresnelInverted = clamp(1.0 - fresnel, 0.0, 1.0);
    float atmosphereExp = pow(fresnelInverted, 3.5);
    vec3 atmosphereColor = vec3(0.2, 0.55, 1.0) * atmosphereExp * 1.5 * blend;
    
    // Twilight Terminator (Sunset orange glow at the edge of darkness)
    float twilight = smoothstep(-0.15, 0.1, intensity) - smoothstep(0.0, 0.3, intensity);
    vec3 twilightColor = vec3(0.9, 0.4, 0.1) * twilight * 0.4 * pow(fresnelInverted, 1.5);
    
    // Day side compilation
    vec3 brightDay = dayColor.rgb + atmosphereColor + twilightColor;
    
    // Night side — dark tinted version of the actual texture so landmasses remain visible
    vec3 darkEarth = dayColor.rgb * vec3(0.12, 0.18, 0.25);
    
    // Final composite mix
    vec3 finalColor = mix(darkEarth, brightDay, blend);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Compute real-time sun direction from UTC time
export function getSunDirection(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600

  // Sun latitude (solar declination)
  const sunLat = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180))
  
  // Calculate the Earth longitude that is currently at Noon (facing the sun)
  // At 12:00 UTC, the 0° Meridian (London) faces the sun.
  // We add 180 here to exactly match the texture's native UV seam on the SphereGeometry.
  const noonLon = (12 - hours) * 15 + 180

  // Map this to our 3D globe's native coordinate system (theta/phi Spherical mapping)
  // This physically moves the sun light identical to how ground coordinates map
  const theta = (noonLon + 90) * (Math.PI / 180)
  const phi = (90 - sunLat) * (Math.PI / 180)

  const x = -Math.sin(phi) * Math.cos(theta)
  const y = Math.cos(phi)
  const z = Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z).normalize()
}

function EarthFallback() {
  return (
    <Sphere args={[1, 48, 48]}>
      <meshStandardMaterial
        color="#1a5276"
        emissive="#051525"
        emissiveIntensity={0.3}
        roughness={0.8}
        metalness={0.1}
      />
    </Sphere>
  )
}

function EarthTextured({ dayUrl }) {
  const dayTexture = useTexture(dayUrl)
  const materialRef = useRef()

  const uniforms = useMemo(() => ({
    dayTexture: { value: dayTexture },
    sunDirection: { value: getSunDirection(new Date()) }
  }), [dayTexture])

  // ★ FIX: Update sun direction every frame based on real UTC time
  // This makes the day/night terminator move correctly (darkens from east like real life)
  useFrame(() => {
    if (materialRef.current) {
      const newSunDir = getSunDirection(new Date())
      materialRef.current.uniforms.sunDirection.value.copy(newSunDir)
    }
  })

  return (
    <Sphere args={[1, 64, 64]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </Sphere>
  )
}

export default function Earth() {
  const [useFallback, setUseFallback] = useState(false)
  const dayTextureUrl = "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg"

  if (useFallback) return <EarthFallback />
  
  return (
    <ErrorBoundaryEarth onError={() => setUseFallback(true)}>
      <EarthTextured dayUrl={dayTextureUrl} />
    </ErrorBoundaryEarth>
  )
}

import { Component } from 'react'
class ErrorBoundaryEarth extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() { this.props.onError?.() }
  render() {
    if (this.state.hasError) return <EarthFallback />
    return this.props.children
  }
}
