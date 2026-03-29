import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Creates a semi-transparent heat-map overlay over land masses (or specific latitudes)
 * to represent GIC (Geomagnetically Induced Current) risk areas.
 */
export default function GeomagneticHeatmap({ active = false, kpIndex = 6.0 }) {
  const meshRef = useRef()

  // We use a slightly oversized sphere to wrap the Earth
  const geometry = useMemo(() => new THREE.SphereGeometry(1.015, 64, 64), [])

  // Custom shader material to draw heat bands specifically around mid-to-high latitudes
  // which are most affected by GICs (like power grids in Canada, northern US, Europe, and Turkey).
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        kpLevel: { value: kpIndex },
        isActive: { value: active ? 1.0 : 0.0 },
        colorHot: { value: new THREE.Color("#ff2222") },
        colorWarm: { value: new THREE.Color("#ff8c00") }
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float kpLevel;
        uniform float isActive;
        uniform vec3 colorHot;
        uniform vec3 colorWarm;
        varying vec3 vPosition;
        
        // Simplex noise function for organic heatmap look
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          if (isActive < 0.5) {
             gl_FragColor = vec4(0.0);
             return;
          }
          
          // vPosition is essentially the normal vector on a sphere at origin
          vec3 normal = normalize(vPosition);
          
          // Latitude mapping (y ranges from -1 to 1)
          float lat = abs(normal.y);
          
          // Risk area logic: High risk at 45° to 75° latitudes (approx 0.7 to 0.96)
          // Turkey is around ~39-42 N, which is ~0.62 to 0.67
          float riskBand = smoothstep(0.4, 0.7, lat) - smoothstep(0.85, 0.95, lat);
          
          // Mid-latitude bump (Turkey, Southern Europe, US)
          float midLatRisk = smoothstep(0.5, 0.65, lat) - smoothstep(0.65, 0.7, lat);
          
          // Combine risk bands and scale with Kp Level (0-9)
          float intensity = (riskBand * 1.5 + midLatRisk * 0.8) * (kpLevel / 9.0);
          
          // Add organic noise so it looks like plasma disruption, not perfect bands
          float n = snoise(normal * 3.0 + time * 0.1);
          intensity *= (0.7 + 0.3 * n);
          
          // Fade edges of the sphere (fresnel)
          float viewDot = dot(normal, vec3(0.0, 0.0, 1.0)); // Approximating view vector
          float fresnel = pow(1.0 - abs(viewDot), 2.0);
          
          if (intensity < 0.1) {
             gl_FragColor = vec4(0.0);
             return;
          }
          
          vec3 color = mix(colorWarm, colorHot, smoothstep(0.3, 0.8, intensity));
          float alpha = intensity * 0.4 * (1.0 - fresnel * 0.5);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [kpIndex, active])

  useFrame(({ clock }) => {
    if (material) {
      material.uniforms.time.value = clock.getElapsedTime();
      material.uniforms.kpLevel.value = kpIndex;
      material.uniforms.isActive.value = active ? 1.0 : 0.0;
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  )
}
