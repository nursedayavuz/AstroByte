import * as THREE from 'three'

export function latLonToVec3(lat, lon, radius = 1.01) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = lon * (Math.PI / 180)

  // Standard equirectangular mapping applied to Three.js SphereGeometry:
  // Greenwich (lon 0) connects to -Z (u=0.5).
  // +90E connects to -X (u=0.75).
  const x = -radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  const z = -radius * Math.sin(phi) * Math.cos(theta)
  
  return new THREE.Vector3(x, y, z)
}
