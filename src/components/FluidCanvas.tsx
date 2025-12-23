import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { fluidVertexShader, fluidFragmentShader } from '../shaders/fluidShader';

// Fluid Background Component
const FluidBackground = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5, velocity: 0 });
    const prevMouseRef = useRef({ x: 0.5, y: 0.5 });
    const { viewport, size } = useThree();

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseVelocity: { value: 0 },
    }), [size]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = 1.0 - e.clientY / window.innerHeight;

            const dx = x - prevMouseRef.current.x;
            const dy = y - prevMouseRef.current.y;
            const velocity = Math.sqrt(dx * dx + dy * dy) * 10;

            mouseRef.current = { x, y, velocity: Math.min(velocity, 2) };
            prevMouseRef.current = { x, y };
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.elapsedTime;

            // Smooth mouse position
            material.uniforms.uMouse.value.lerp(
                new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
                0.1
            );

            // Decay velocity
            material.uniforms.uMouseVelocity.value = THREE.MathUtils.lerp(
                material.uniforms.uMouseVelocity.value,
                mouseRef.current.velocity,
                0.1
            );
            mouseRef.current.velocity *= 0.95;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -5]} scale={[viewport.width * 1.5, viewport.height * 1.5, 1]}>
            <planeGeometry args={[1, 1, 1, 1]} />
            <shaderMaterial
                vertexShader={fluidVertexShader}
                fragmentShader={fluidFragmentShader}
                uniforms={uniforms}
            />
        </mesh>
    );
};

// Glass-like GDG Logo using Text (no external font needed)
const GDGLogo = () => {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.08;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
            <group ref={groupRef}>
                <Text
                    fontSize={2.5}
                    font="https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW4.woff"
                    letterSpacing={0.1}
                    position={[0, 0, 0]}
                >
                    GDG
                    <meshPhysicalMaterial
                        ref={materialRef}
                        color="#ffffff"
                        metalness={0.1}
                        roughness={0.1}
                        transmission={0.95}
                        thickness={2}
                        ior={1.5}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        envMapIntensity={1}
                        transparent
                        opacity={0.9}
                    />
                </Text>

                {/* Glowing outline */}
                <Text
                    fontSize={2.55}
                    font="https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW4.woff"
                    letterSpacing={0.1}
                    position={[0, 0, -0.1]}
                >
                    GDG
                    <meshBasicMaterial color="#4285F4" transparent opacity={0.2} />
                </Text>
            </group>
        </Float>
    );
};

// Floating Colored Orbs
const FloatingOrbs = () => {
    const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

    return (
        <>
            {colors.map((color, i) => (
                <Float key={color} speed={3 + i * 0.5} rotationIntensity={0.5} floatIntensity={1}>
                    <mesh position={[
                        Math.sin(i * Math.PI / 2) * 4,
                        Math.cos(i * Math.PI / 2) * 2,
                        -2 - i * 0.5
                    ]}>
                        <sphereGeometry args={[0.3 + i * 0.1, 32, 32]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.5}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                </Float>
            ))}
        </>
    );
};

// Floating Particles
const FloatingParticles = () => {
    const particlesRef = useRef<THREE.Points>(null);
    const count = 150;

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const googleColors = [
            [0.259, 0.522, 0.957],
            [0.918, 0.263, 0.208],
            [0.984, 0.737, 0.016],
            [0.204, 0.659, 0.325],
        ];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;

            const c = googleColors[Math.floor(Math.random() * 4)];
            col[i * 3] = c[0];
            col[i * 3 + 1] = c[1];
            col[i * 3 + 2] = c[2];
        }
        return [pos, col];
    }, []);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
        }
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation />
        </points>
    );
};

// Main Scene
const FluidScene = () => {
    return (
        <>
            <FluidBackground />
            <GDGLogo />
            <FloatingOrbs />
            <FloatingParticles />
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#4285F4" />
            <pointLight position={[-10, -10, 5]} intensity={1} color="#EA4335" />
            <pointLight position={[0, 10, 5]} intensity={0.8} color="#FBBC04" />
        </>
    );
};

// Exported Canvas
const FluidCanvas = () => {
    return (
        <Canvas
            camera={{ position: [0, 0, 6], fov: 45 }}
            dpr={[1, 2]}
            gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance"
            }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto'
            }}
        >
            <FluidScene />
        </Canvas>
    );
};

export default FluidCanvas;
