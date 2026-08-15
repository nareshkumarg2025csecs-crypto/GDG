/**
 * MatrixEffect.tsx
 * 
 * A full-screen post-processing shader for the "Matrix Rain" effect.
 * Can be added to any React Three Fiber Canvas.
 */

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useEasterEggStore } from '@/store/easterEggStore'

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    uniform float iTime;
    uniform vec2 iResolution;
    varying vec2 vUv;

    // Matrix rain shader
    float hash(float n) { return fract(sin(n) * 43758.5453123); }

    float char(vec2 p, float n) {
        if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 0.0;
        float x = floor(p.x * 3.0);
        float y = floor(p.y * 5.0);
        float i = x + y * 3.0;
        if (mod(floor(n / pow(2.0, i)), 2.0) == 1.0) return 1.0;
        return 0.0;
    }

    void main() {
        vec2 uv = vUv;
        vec2 p = uv * vec2(60.0, 30.0);
        p.y += iTime * (5.0 + 10.0 * hash(floor(p.x)));
        
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        
        float charNum = floor(hash(ip.x + ip.y * 0.1) * 32767.0);
        float c = char(fp, charNum);
        
        float v = fract(ip.y * 0.1 + iTime * 0.1);
        vec3 col = vec3(0.1, 1.0, 0.2) * c * v;
        
        // Add blue tint for GDG
        col += vec3(0.0, 0.2, 0.5) * (1.0 - v) * 0.1;
        
        gl_FragColor = vec4(col, 0.7);
    }
`

export function MatrixEffect() {
    const { matrixMode } = useEasterEggStore()
    const meshRef = useRef<THREE.Mesh>(null)
    const { viewport } = useThree()

    const uniforms = useMemo(() => ({
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2() }
    }), [])

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial
            material.uniforms.iTime.value = state.clock.elapsedTime
            material.uniforms.iResolution.value.set(viewport.width, viewport.height)
        }
    })

    if (!matrixMode) return null

    return (
        <mesh ref={meshRef} position={[0, 0, 1]}>
            <planeGeometry args={[viewport.width, viewport.height]} />
            <shaderMaterial
                transparent
                depthTest={false}
                depthWrite={false}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    )
}

export default MatrixEffect
