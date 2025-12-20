import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Environment, MeshDistortMaterial } from '@react-three/drei';
import { Suspense } from 'react';

const Helmet = () => {
  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <group scale={2.5} position={[0, -0.5, 0]}>
        {/* Helmet base */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#d4ff00"
            metalness={0.8}
            roughness={0.2}
            distort={0.1}
            speed={2}
          />
        </mesh>
        
        {/* Visor */}
        <mesh position={[0, 0.1, 0.8]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.2, 0.4, 0.2]} />
          <meshStandardMaterial
            color="#111111"
            metalness={0.9}
            roughness={0.1}
            opacity={0.9}
            transparent
          />
        </mesh>

        {/* Accent stripes */}
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.02, 0.02, 16, 100]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        <mesh position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[1.01, 0.015, 16, 100]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
    </Float>
  );
};

const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-lime border-t-transparent rounded-full animate-spin" />
  </div>
);

const HelmetCanvas = () => {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            color="#d4ff00"
          />
          <pointLight position={[-10, -10, -10]} color="#ffffff" intensity={0.5} />
          
          <Helmet />
          
          <Environment preset="studio" />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default HelmetCanvas;
