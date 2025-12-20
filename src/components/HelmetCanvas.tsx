import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, MeshDistortMaterial, MeshTransmissionMaterial, useTexture, Sparkles, ContactShadows } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

const Helmet = () => {
  const helmetRef = useRef<THREE.Group>(null);
  const visorRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (helmetRef.current) {
      helmetRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (visorRef.current) {
      const material = visorRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.3}
      floatIntensity={0.5}
    >
      <group ref={helmetRef} scale={2.8} position={[0, -0.3, 0]}>
        {/* Main helmet shell */}
        <mesh castShadow>
          <sphereGeometry args={[1, 128, 128]} />
          <MeshDistortMaterial
            color="#d4ff00"
            metalness={0.95}
            roughness={0.08}
            distort={0.05}
            speed={1.5}
            envMapIntensity={2}
          />
        </mesh>

        {/* Carbon fiber texture layer */}
        <mesh scale={1.005}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.9}
            roughness={0.3}
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Visor - more detailed */}
        <group position={[0, 0.15, 0.75]} rotation={[-0.35, 0, 0]}>
          <mesh ref={visorRef} castShadow>
            <boxGeometry args={[1.35, 0.45, 0.25]} />
            <meshStandardMaterial
              color="#0a0a0a"
              metalness={1}
              roughness={0.05}
              envMapIntensity={3}
              emissive="#d4ff00"
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Visor rim */}
          <mesh position={[0, 0, 0.1]} scale={[1.38, 0.5, 0.1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#d4ff00" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* Top stripe - McLaren papaya */}
        <mesh position={[0, 0.7, 0]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.75, 0.04, 16, 100, Math.PI]} />
          <meshStandardMaterial color="#ff8000" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Side stripes */}
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.02, 0.02, 16, 100]} />
          <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
        </mesh>
        
        <mesh position={[0, 0.2, 0]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[1.015, 0.015, 16, 100]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
        </mesh>

        <mesh position={[0, 0, 0]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[1.01, 0.02, 16, 100]} />
          <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Number 4 decal area (simplified) */}
        <mesh position={[-0.85, 0.3, 0.4]} rotation={[0, -0.8, 0]} scale={0.25}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Air vents */}
        <mesh position={[0, 0.85, 0.3]} rotation={[0.3, 0, 0]} scale={[0.4, 0.1, 0.15]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Chin guard */}
        <mesh position={[0, -0.6, 0.5]} scale={[0.6, 0.3, 0.4]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
};

const ParticleField = () => {
  return (
    <Sparkles
      count={100}
      scale={12}
      size={2}
      speed={0.3}
      opacity={0.3}
      color="#d4ff00"
    />
  );
};

const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      <div className="w-20 h-20 border-2 border-lime/20 rounded-full" />
      <div className="absolute inset-0 w-20 h-20 border-2 border-lime border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const HelmetCanvas = () => {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting setup */}
          <ambientLight intensity={0.4} />
          
          <spotLight
            position={[10, 10, 5]}
            angle={0.2}
            penumbra={1}
            intensity={2}
            color="#d4ff00"
            castShadow
          />
          
          <spotLight
            position={[-10, 5, 5]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            color="#ff8000"
          />
          
          <pointLight position={[-5, -5, -10]} color="#ffffff" intensity={0.5} />
          <pointLight position={[5, 10, 0]} color="#d4ff00" intensity={0.8} />
          
          {/* Rim light */}
          <spotLight
            position={[0, -5, -5]}
            angle={0.5}
            penumbra={0.5}
            intensity={0.5}
            color="#ffffff"
          />
          
          <Helmet />
          <ParticleField />
          
          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
            color="#d4ff00"
          />
          
          <Environment preset="studio" />
          
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default HelmetCanvas;
