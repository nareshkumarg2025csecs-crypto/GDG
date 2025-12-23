/**
 * Starfield.tsx
 * 
 * High-performance starfield background using InstancedMesh.
 * Thousands of particles rendered with a single draw call for 60 FPS.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarfieldProps {
    isMobile: boolean
}

/**
 * Creates a dynamic starfield that gives the sensation of flying through space.
 * Uses InstancedMesh for optimal performance.
 */
export function Starfield({ isMobile }: StarfieldProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)

    // Particle count - lower on mobile for performance
    const count = isMobile ? 500 : 1000

    // Generate star positions
    const { matrices, colors } = useMemo(() => {
        const matricesArr: THREE.Matrix4[] = []
        const colorsArr: THREE.Color[] = []

        // Star colors (white with slight variations)
        const starColors = [
            new THREE.Color('#ffffff'),
            new THREE.Color('#e0e8ff'),
            new THREE.Color('#ffe0d0'),
        ]

        for (let i = 0; i < count; i++) {
            // Random position in a cylinder around the path
            const angle = Math.random() * Math.PI * 2
            const radius = 6 + Math.random() * 15
            const depth = Math.random() * 120

            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                -depth
            )

            // Random size
            const scale = 0.015 + Math.random() * 0.035

            const matrix = new THREE.Matrix4()
            matrix.compose(
                position,
                new THREE.Quaternion(),
                new THREE.Vector3(scale, scale, scale)
            )

            matricesArr.push(matrix)
            colorsArr.push(starColors[Math.floor(Math.random() * starColors.length)])
        }

        return { matrices: matricesArr, colors: colorsArr }
    }, [count])

    // Apply matrices and colors to instanced mesh
    useEffect(() => {
        if (!meshRef.current) return

        matrices.forEach((matrix, i) => {
            meshRef.current!.setMatrixAt(i, matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [matrices])

    // Animate rotation for "speed" effect
    useFrame(({ clock }) => {
        if (!meshRef.current) return
        meshRef.current.rotation.z = clock.elapsedTime * 0.015
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.7}
            />
        </instancedMesh>
    )
}

export default Starfield
