/**
 * SplinePath.tsx
 * 
 * Creates and renders the glowing timeline spline curve.
 * Uses CatmullRomCurve3 for smooth path and TubeGeometry for rendering.
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ================================
// CURVE GENERATION
// ================================

/**
 * Creates a smooth curved path through 3D space.
 * The curve represents the timeline of the academic year.
 */
export const createTimelineCurve = (isMobile: boolean): THREE.CatmullRomCurve3 => {
    const points: THREE.Vector3[] = []
    const segmentCount = 60
    const curveLength = isMobile ? 80 : 100

    for (let i = 0; i <= segmentCount; i++) {
        const t = i / segmentCount

        // Create a gentle S-curve path through space
        // Amplitude decreases towards the end for a natural feel
        const dampening = 1 - t * 0.3

        const x = Math.sin(t * Math.PI * 2) * 2 * dampening
        const y = Math.cos(t * Math.PI * 1.5) * 1.2 * dampening
        const z = -t * curveLength

        points.push(new THREE.Vector3(x, y, z))
    }

    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
}

// ================================
// SPLINE PATH COMPONENT
// ================================

interface SplinePathProps {
    curve: THREE.CatmullRomCurve3
    isMobile: boolean
}

/**
 * Renders the glowing spline tube that represents the timeline.
 * Uses custom shaders for animated glow effect.
 */
export function SplinePath({ curve, isMobile }: SplinePathProps) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    // Animate the glow
    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.elapsedTime
        }
    })

    // Create tube geometry from curve
    const tubeGeometry = useMemo(() => {
        return new THREE.TubeGeometry(
            curve,
            600,              // tubular segments (more = smoother)
            isMobile ? 0.025 : 0.035, // radius
            12,               // radial segments
            false             // closed
        )
    }, [curve, isMobile])

    return (
        <mesh geometry={tubeGeometry}>
            <shaderMaterial
                ref={materialRef}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={{
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color('#4285F4') },
                }}
                vertexShader={`
          varying float vProgress;
          varying vec3 vPosition;
          
          void main() {
            vProgress = position.z / -100.0;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
                fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor;
          varying float vProgress;
          varying vec3 vPosition;

          void main() {
            // Pulsing glow effect
            float pulse = sin(uTime * 2.5 - vProgress * 30.0) * 0.5 + 0.5;
            
            // Base glow intensity
            float glow = 0.2 + pulse * 0.3;
            
            // Color with pulse
            vec3 color = uColor * (1.0 + pulse * 0.5);
            
            // Fade at far end
            float fade = 1.0 - smoothstep(0.7, 1.0, vProgress);
            
            gl_FragColor = vec4(color, glow * fade);
          }
        `}
            />
        </mesh>
    )
}

export default SplinePath
