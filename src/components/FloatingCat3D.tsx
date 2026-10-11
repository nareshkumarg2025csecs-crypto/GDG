import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingCat3DProps {
  position?: [number, number, number];
  scale?: number;
}

export const FloatingCat3D = ({ position = [3.0, -0.2, -2.0], scale = 0.88 }: FloatingCat3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/gdg-cat.glb');

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const c = box.getCenter(new THREE.Vector3());
    clone.position.set(-c.x, -box.min.y, -c.z);
    return clone;
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t * 0.55) * 0.22;
      groupRef.current.position.y = Math.sin(t * 0.55) * 0.22;
      groupRef.current.position.z = Math.sin(t * 0.35) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.35;
      groupRef.current.rotation.z = Math.sin(t * 0.45) * 0.08;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.3} rotationIntensity={0.08} floatIntensity={0.35}>
        <group ref={groupRef} scale={[scale, scale, scale]}>
          <primitive object={model} />
        </group>
      </Float>
    </group>
  );
};

export default FloatingCat3D;
