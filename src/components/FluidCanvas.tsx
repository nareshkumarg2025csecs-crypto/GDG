import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

// ── 2. Subtle 3D Developer Geometric Accents (Depth without Clutter) ──────
const DevGeometricAccents = () => {
    const groupRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const polyRef = useRef<THREE.Mesh>(null);
    const { viewport } = useThree();

    const isNarrow = viewport.width < 6;
    const accentScale = isNarrow ? 0.6 : 1;
    const rightX = isNarrow ? viewport.width * 0.38 : 4.2;
    const leftX = isNarrow ? -viewport.width * 0.38 : -4.5;

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.04;
            groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.05;
        }
        if (ringRef.current) {
            ringRef.current.rotation.x = t * 0.08;
            ringRef.current.rotation.y = t * 0.05;
        }
        if (polyRef.current) {
            polyRef.current.rotation.x = t * 0.06;
            polyRef.current.rotation.z = t * 0.05;
        }
    });

    return (
        <group ref={groupRef} scale={[accentScale, accentScale, accentScale]}>
            {/* Elegant glowing tech ring floating in peripheral space */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
                <mesh ref={ringRef} position={[rightX, 0.8, -2.5]}>
                    <torusGeometry args={[1.3, 0.025, 16, 64]} />
                    <meshStandardMaterial
                        color="#4285F4"
                        emissive="#4285F4"
                        emissiveIntensity={0.6}
                        transparent
                        opacity={0.35}
                        wireframe
                    />
                </mesh>
            </Float>

            {/* Translucent wireframe icosahedron adding futuristic developer aesthetic */}
            <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.5}>
                <mesh ref={polyRef} position={[rightX + 0.6, -1.2, -3.2]}>
                    <icosahedronGeometry args={[0.9, 1]} />
                    <meshStandardMaterial
                        color="#34A853"
                        emissive="#34A853"
                        emissiveIntensity={0.4}
                        transparent
                        opacity={0.25}
                        wireframe
                    />
                </mesh>
            </Float>

            {/* Subtle Google Yellow accent ring */}
            <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
                <mesh position={[leftX, 1.8, -3.5]}>
                    <ringGeometry args={[0.8, 0.82, 48]} />
                    <meshBasicMaterial color="#FBBC04" transparent opacity={0.2} side={THREE.DoubleSide} />
                </mesh>
            </Float>
        </group>
    );
};

// ── 3. Interactive Floating Particle Constellation ─────────────────────────
const FloatingParticles = () => {
    const particlesRef = useRef<THREE.Points>(null);
    const count = 90;

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const googleColors = [
            [0.259, 0.522, 0.957], // #4285F4
            [0.918, 0.263, 0.208], // #EA4335
            [0.984, 0.737, 0.016], // #FBBC04
            [0.204, 0.659, 0.325], // #34A853
            [0.85, 0.88, 0.95],    // Clean white star
        ];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 16;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;

            const c = googleColors[Math.floor(Math.random() * googleColors.length)];
            col[i * 3] = c[0];
            col[i * 3 + 1] = c[1];
            col[i * 3 + 2] = c[2];
        }
        return [pos, col];
    }, []);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.015;
            particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.02;
        }
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.065}
                vertexColors
                transparent
                opacity={0.55}
                sizeAttenuation
            />
        </points>
    );
};

// ── 4. Main 3D Scene ───────────────────────────────────────────────────────
const FluidScene = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <>
            <DevGeometricAccents />
            <FloatingParticles />
            <Environment preset={isDark ? "night" : "city"} />
            <ambientLight intensity={isDark ? 0.5 : 0.9} />
            <pointLight position={[6, 4, 4]} intensity={isDark ? 1.2 : 0.7} color="#4285F4" />
            <pointLight position={[-6, -4, 3]} intensity={isDark ? 0.8 : 0.5} color="#EA4335" />
            <pointLight position={[0, 6, 2]} intensity={isDark ? 0.6 : 0.4} color="#FBBC04" />
        </>
    );
};

// ── 5. Exported Canvas ─────────────────────────────────────────────────────
const FluidCanvas = () => {
    return (
        <Canvas
            camera={{ position: [0, 0, 6], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{
                antialias: true,
                alpha: true,
                powerPreference: "default"
            }}
            onCreated={({ gl }) => {
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                }, false);
            }}
            frameloop="always"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}
        >
            <FluidScene />
        </Canvas>
    );
};

export default FluidCanvas;
