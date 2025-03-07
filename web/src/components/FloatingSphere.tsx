'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'

function AnimatedSphere() {
  const meshRef = useRef<any>()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    meshRef.current.distort = 0.4 + Math.sin(time) * 0.2
    meshRef.current.rotation.x = time * 0.05
    meshRef.current.rotation.y = time * 0.08
  })

  return (
    <group>
      {/* Inner sphere */}
      <Sphere ref={meshRef} args={[0.8, 64, 64]}>
        <MeshDistortMaterial
          color="#F59E0B"
          attach="material"
          distort={0.4}
          speed={3}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.7}
        />
      </Sphere>
      
      {/* Outer sphere */}
      <Sphere args={[1.2, 64, 64]}>
        <MeshWobbleMaterial
          color="#3B82F6"
          attach="material"
          factor={0.4}
          speed={2}
          roughness={0}
          metalness={0.8}
          transparent
          opacity={0.2}
        />
      </Sphere>
    </group>
  )
}

export default function FloatingSphere() {
  return (
    <div className="absolute right-0 top-20 w-[500px] h-[500px] opacity-90">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#F59E0B" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3B82F6" />
        <AnimatedSphere />
      </Canvas>
    </div>
  )
} 