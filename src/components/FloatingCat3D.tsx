import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useTexture, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingCat3DProps {
  position?: [number, number, number];
  scale?: number;
}

export const FloatingCat3D = ({ position = [3.0, -0.2, -2.0], scale = 0.88 }: FloatingCat3DProps) => {
  const innerRef = useRef<THREE.Mesh>(null);
  
  // Load the crisp HD original 2D cat mascot texture
  const catTexture = useTexture('/gdg-cat.png');

  useEffect(() => {
    catTexture.colorSpace = THREE.SRGBColorSpace;
    catTexture.minFilter = THREE.LinearMipmapLinearFilter;
    catTexture.magFilter = THREE.LinearFilter;
    catTexture.generateMipmaps = true;
    catTexture.anisotropy = 16;
    catTexture.needsUpdate = true;
  }, [catTexture]);

  // Zero-gravity space physics: smooth circular drift in space while ALWAYS facing the viewers
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (innerRef.current) {
      // 1. Move in a smooth 0-gravity circular path in the space plane
      innerRef.current.position.x = Math.cos(t * 0.55) * 0.22;
      innerRef.current.position.y = Math.sin(t * 0.55) * 0.22;
      innerRef.current.position.z = Math.sin(t * 0.35) * 0.08;

      // 2. Rotate in a 2D circle (gentle roll tilt / steering tilt like floating in space)
      innerRef.current.rotation.z = Math.sin(t * 0.45) * 0.12;
      
      // Strictly 0 for yaw and pitch: never rotates front-to-back, always faces us
      innerRef.current.rotation.x = 0;
      innerRef.current.rotation.y = 0;
    }
  });

  // Aspect ratio of the cat image (484 x 976)
  const catWidth = 0.88;
  const catHeight = 1.77;

  return (
    <group position={position}>
      {/* Billboard ensures the 2D cat ALWAYS directly faces the viewers and never turns away */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Float speed={1.3} rotationIntensity={0.08} floatIntensity={0.35}>
          <mesh ref={innerRef} scale={[scale, scale, scale]}>
            <planeGeometry args={[catWidth, catHeight]} />
            <meshBasicMaterial
              map={catTexture}
              transparent
              alphaTest={0.02}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Float>
      </Billboard>
    </group>
  );
};

export default FloatingCat3D;
