import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export type Vec3 = [number, number, number];

export interface GdgCatSceneProps {
  src: string;
  /** Camera position. Default frames the full kitten from the front. */
  cameraPosition: Vec3;
  /** Point the camera looks at (roughly the kitten's belly/chest height). */
  target: Vec3;
  fov: number;
  /** Uniform model scale multiplier. */
  modelScale: number;
  /** Let people orbit (horizontal drag only). When false the canvas ignores pointer events. */
  interactive: boolean;
  /** Gentle idle sway/breathing. Forced off for users with prefers-reduced-motion. */
  animate: boolean;
  /** Intensity multiplier for the three-point light rig. */
  lightIntensity: number;
  /** Render a soft contact shadow below the feet. */
  shadow: boolean;
  /** Pause rendering (e.g. when scrolled out of view). */
  paused: boolean;
  onReady?: () => void;
}

function Kitten({
  src, modelScale, animate, onReady,
}: Pick<GdgCatSceneProps, 'src' | 'modelScale' | 'animate' | 'onReady'>) {
  const { scene } = useGLTF(src);
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  // Clone so several mascots on one page never share (and dispose) the same scene graph.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const std = m as THREE.MeshStandardMaterial;
          if (std.map) std.map.anisotropy = 4;
        });
      }
    });
    // Centre horizontally; sit the feet on y = 0.
    const box = new THREE.Box3().setFromObject(clone);
    const c = box.getCenter(new THREE.Vector3());
    clone.position.set(-c.x, -box.min.y, -c.z);
    return clone;
  }, [scene]);

  useEffect(() => {
    onReady?.();
    invalidate();
    return () => {
      // Free GPU memory when the mascot unmounts.
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          Object.values(m).forEach((v) => {
            if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
          });
          m.dispose();
        });
      });
      useGLTF.clear(src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useFrame((state) => {
    const g = group.current;
    if (!g || !animate) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.5) * 0.35; // slow sway, never shows the back unless user orbits
    g.position.y = Math.sin(t * 1.6) * 0.012; // breathing bob
  });

  return (
    <group ref={group} scale={modelScale}>
      <primitive object={model} />
    </group>
  );
}

function CameraRig({ position, target, fov }: { position: Vec3; target: Vec3; fov: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...position);
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target, fov]);
  return null;
}

export default function GdgCatScene(props: GdgCatSceneProps) {
  const {
    src, cameraPosition, target, fov, modelScale, interactive, animate, lightIntensity, shadow, paused, onReady,
  } = props;
  const li = lightIntensity;
  const isCoarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  return (
    <Canvas
      // Transparent background so the mascot sits on whatever the page looks like.
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, isCoarse ? 1.5 : 2]}
      shadows={!isCoarse}
      frameloop={paused ? 'never' : animate || interactive ? 'always' : 'demand'}
      camera={{ position: cameraPosition, fov, near: 0.1, far: 50 }}
      style={{ background: 'transparent', pointerEvents: interactive ? 'auto' : 'none', touchAction: 'pan-y' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <CameraRig position={cameraPosition} target={target} fov={fov} />
      <ambientLight intensity={0.35 * li} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={2.2 * li} castShadow={!isCoarse}
        shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[3, 1.5, 2]} intensity={0.7 * li} />
      <directionalLight position={[0, 3, -4]} intensity={0.9 * li} />
      {/* Procedural studio environment: no HDR download, so nothing to fail offline. */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 3]} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1} position={[-4, 1, 1]} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1} position={[4, 1, 1]} scale={[3, 6, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Kitten src={src} modelScale={modelScale} animate={animate} onReady={onReady} />
      </Suspense>
      {shadow && (
        <ContactShadows position={[0, 0.001, 0]} opacity={0.35} scale={4} blur={2.4} far={1.4} resolution={256} frames={1} />
      )}
      {interactive && (
        <OrbitControls
          target={target}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI * 0.38}
          maxPolarAngle={Math.PI * 0.58}
          rotateSpeed={0.8}
          enableDamping
        />
      )}
    </Canvas>
  );
}
