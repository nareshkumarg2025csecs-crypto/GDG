import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Preload, useGLTF } from '@react-three/drei';
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

function useIsCoarse(): boolean {
  const [isCoarse, setIsCoarse] = useState(() =>
    typeof window !== 'undefined'
      ? !!(window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 768)
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia?.('(pointer: coarse)');
    const update = () => {
      setIsCoarse(!!(mq?.matches || window.innerWidth <= 768));
    };
    mq?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      mq?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return isCoarse;
}

function Kitten({
  src, modelScale, animate, isInteracting, onReady, isCoarse,
}: Pick<GdgCatSceneProps, 'src' | 'modelScale' | 'animate' | 'onReady'> & {
  isInteracting: boolean;
  isCoarse: boolean;
}) {
  const { scene } = useGLTF(src);
  const group = useRef<THREE.Group>(null);
  const { gl, camera, invalidate } = useThree();
  const currentRotY = useRef(0);
  const currentPosY = useRef(0);

  // Setup model materials and compute centering offset once without expensive deep cloning
  const offset = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const std = m as THREE.MeshStandardMaterial;
          if (std && std.map) {
            std.map.anisotropy = isCoarse ? 1 : 2;
          }
        });
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    return [-center.x, -box.min.y, -center.z] as Vec3;
  }, [scene, isCoarse]);

  useEffect(() => {
    // Warm up & precompile shaders on the actual loaded mascot geometry and materials
    try {
      gl.compile(scene, camera);
    } catch {
      // Fallback if compile is unsupported on constrained WebGL context
    }
    onReady?.();
    invalidate();
  }, [scene, gl, camera, onReady, invalidate]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !animate) return;

    // Delta-capped smooth damp so low-end devices never stutter or jerk on frame drops
    const step = Math.min(delta, 0.04);
    const t = state.clock.elapsedTime;

    // If user is actively dragging, freeze idle sway so it doesn't fight user's orbit gesture
    const targetRot = isInteracting ? currentRotY.current : Math.sin(t * 0.55) * 0.28;
    const targetBob = isInteracting ? 0 : Math.sin(t * 1.5) * 0.012;

    currentRotY.current = THREE.MathUtils.damp(currentRotY.current, targetRot, 3.5, step);
    currentPosY.current = THREE.MathUtils.damp(currentPosY.current, targetBob, 3.5, step);

    g.rotation.y = currentRotY.current;
    g.position.y = currentPosY.current;
  });

  return (
    <group ref={group} scale={modelScale}>
      <primitive object={scene} position={offset} dispose={null} />
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

function IdleThrottler({ isCoarse, isInteracting, animate, paused }: {
  isCoarse: boolean;
  isInteracting: boolean;
  animate: boolean;
  paused: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!isCoarse || isInteracting || !animate || paused) return;
    let lastTime = 0;
    let rafId: number;
    const tick = (time: number) => {
      if (time - lastTime >= 32) { // Regulate mobile idle sway to ~30 FPS to reduce GPU heat
        lastTime = time;
        invalidate();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isCoarse, isInteracting, animate, paused, invalidate]);

  return null;
}

export default function GdgCatScene(props: GdgCatSceneProps) {
  const {
    src, cameraPosition, target, fov, modelScale, interactive, animate, lightIntensity, shadow, paused, onReady,
  } = props;
  const li = lightIntensity;
  const isCoarse = useIsCoarse();
  const [isInteracting, setIsInteracting] = useState(false);

  const frameloopMode = paused
    ? 'never'
    : isCoarse && !isInteracting
    ? 'demand'
    : animate || interactive
    ? 'always'
    : 'demand';

  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: !isCoarse,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        precision: isCoarse ? 'mediump' : 'highp',
      }}
      dpr={[1, isCoarse ? 1.05 : 1.35]}
      shadows={false}
      frameloop={frameloopMode}
      camera={{ position: cameraPosition, fov, near: 0.1, far: 50 }}
      style={{
        background: 'transparent',
        pointerEvents: interactive ? 'auto' : 'none',
        touchAction: 'pan-y',
        width: '100%',
        height: '100%',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <CameraRig position={cameraPosition} target={target} fov={fov} />
      <ambientLight intensity={(isCoarse ? 0.8 : 0.65) * li} />
      <hemisphereLight intensity={(isCoarse ? 0.35 : 0.45) * li} color="#ffffff" groundColor="#333333" />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={(isCoarse ? 2.6 : 2.4) * li} />
      {!isCoarse && <directionalLight position={[3, 1.5, 2]} intensity={0.9 * li} />}
      {!isCoarse && <directionalLight position={[0, 3, -4]} intensity={1.0 * li} />}
      {isCoarse && <directionalLight position={[2, 1.5, 2]} intensity={0.8 * li} />}
      
      <IdleThrottler
        isCoarse={isCoarse}
        isInteracting={isInteracting}
        animate={animate}
        paused={paused}
      />

      <Suspense fallback={null}>
        <Kitten
          src={src}
          modelScale={modelScale}
          animate={animate}
          onReady={onReady}
          isInteracting={isInteracting}
          isCoarse={isCoarse}
        />
        <Preload all />
      </Suspense>

      {/* Lightweight contact shadow on desktop only to avoid mobile GPU fillrate bottleneck */}
      {shadow && !isCoarse && (
        <ContactShadows position={[0, 0.001, 0]} opacity={0.35} scale={4} blur={2.4} far={1.4} resolution={256} frames={1} />
      )}

      {/* Simple zero-cost circular soft shadow for mobile */}
      {shadow && isCoarse && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.25} />
        </mesh>
      )}

      {interactive && (
        <OrbitControls
          target={target}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI * 0.38}
          maxPolarAngle={Math.PI * 0.58}
          rotateSpeed={isCoarse ? 0.75 : 0.85}
          enableDamping
          dampingFactor={0.08}
          onStart={() => setIsInteracting(true)}
          onEnd={() => setIsInteracting(false)}
        />
      )}
    </Canvas>
  );
}

useGLTF.preload('/models/gdg-cat.glb');
