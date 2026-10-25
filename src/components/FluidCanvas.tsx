import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

// ── 3. Interactive Floating Particle Constellation ─────────────────────────
const FloatingParticles = () => {
    const particlesRef = useRef<THREE.Points>(null);
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)').matches);
    const count = isMobile ? 45 : 80;

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
    }, [count]);

    useFrame((state, delta) => {
        if (particlesRef.current) {
            const step = Math.min(delta, 0.05);
            particlesRef.current.rotation.y += step * 0.04;
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
            <FloatingParticles />
            <ambientLight intensity={isDark ? 0.5 : 0.9} />
            <pointLight position={[6, 4, 4]} intensity={isDark ? 1.2 : 0.7} color="#4285F4" />
            <pointLight position={[-6, -4, 3]} intensity={isDark ? 0.8 : 0.5} color="#EA4335" />
            <pointLight position={[0, 6, 2]} intensity={isDark ? 0.6 : 0.4} color="#FBBC04" />
        </>
    );
};

// ── 5. Exported Canvas ─────────────────────────────────────────────────────
const FluidCanvas = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(true);
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)').matches);

    const [tabVisible, setTabVisible] = useState(() => (typeof document !== 'undefined' ? !document.hidden : true));

    useEffect(() => {
        const handleVis = () => setTabVisible(!document.hidden);
        document.addEventListener('visibilitychange', handleVis);
        return () => document.removeEventListener('visibilitychange', handleVis);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.05 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                dpr={[1, isMobile ? 1.0 : 1.25]}
                gl={{
                    antialias: !isMobile,
                    alpha: true,
                    powerPreference: "default"
                }}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener('webglcontextlost', (e) => {
                        e.preventDefault();
                    }, false);
                }}
                frameloop={isVisible && tabVisible ? "always" : "never"}
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
        </div>
    );
};

export default FluidCanvas;
