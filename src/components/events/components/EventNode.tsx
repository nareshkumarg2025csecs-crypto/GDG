/**
 * EventNode.tsx
 * 
 * 3D holographic panel for displaying event information.
 * Positioned along the spline and faces the camera (billboard effect).
 */

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { EventItem } from '../data/eventsData'

interface EventNodeProps {
    event: EventItem
    position: THREE.Vector3
    isMobile: boolean
}

/**
 * Renders a holographic event panel in 3D space.
 * Features:
 * - Billboard effect (always faces camera)
 * - Subtle glow animation
 * - Scale based on distance
 */
export function EventNode({ event, position, isMobile }: EventNodeProps) {
    const groupRef = useRef<THREE.Group>(null)
    const { camera } = useThree()

    useFrame(({ clock }) => {
        if (!groupRef.current) return

        // Billboard: face the camera
        groupRef.current.lookAt(camera.position)

        // Scale based on distance (closer = larger)
        const distance = camera.position.distanceTo(groupRef.current.position)
        const targetScale = THREE.MathUtils.clamp(2 - distance * 0.025, 0.5, 1.3)
        groupRef.current.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            0.08
        )

        // Subtle floating animation
        const floatY = Math.sin(clock.elapsedTime * 0.8 + event.id) * 0.05
        groupRef.current.position.y = position.y + floatY
    })

    const cardWidth = isMobile ? 220 : 280

    return (
        <group ref={groupRef} position={[position.x, position.y, position.z]}>
            <Html
                transform
                distanceFactor={10}
                style={{ pointerEvents: 'none' }}
                center
            >
                <div
                    style={{
                        width: cardWidth,
                        background: `linear-gradient(135deg, ${event.color}22, ${event.color}08)`,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: `1.5px solid ${event.color}55`,
                        borderRadius: 16,
                        padding: isMobile ? 16 : 20,
                        boxShadow: `
              0 0 30px ${event.color}25,
              0 0 60px ${event.color}15,
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
                        fontFamily: "'Space Grotesk', sans-serif",
                    }}
                >
                    {/* Event Type Badge */}
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            marginBottom: 10,
                            background: `${event.color}35`,
                            color: event.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                    >
                        {event.type}
                    </div>

                    {/* Title */}
                    <h3
                        style={{
                            fontSize: isMobile ? 18 : 22,
                            fontWeight: 700,
                            color: '#ffffff',
                            marginBottom: 6,
                            textShadow: `0 0 20px ${event.color}60`,
                            letterSpacing: '0.02em',
                        }}
                    >
                        {event.title}
                    </h3>

                    {/* Date */}
                    <p
                        style={{
                            color: event.color,
                            fontSize: 12,
                            marginBottom: 10,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {event.date}
                    </p>

                    {/* Description */}
                    <p
                        style={{
                            color: 'rgba(255,255,255,0.55)',
                            fontSize: 12,
                            lineHeight: 1.5,
                        }}
                    >
                        {event.description}
                    </p>
                </div>
            </Html>
        </group>
    )
}

export default EventNode
