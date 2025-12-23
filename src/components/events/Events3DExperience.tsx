/**
 * Events3DExperience.tsx
 * 
 * Main 3D timeline experience using React Three Fiber.
 * 
 * ARCHITECTURE DECISIONS:
 * 1. ScrollControls creates an isolated scroll container - avoids page scroll conflicts
 * 2. Camera movement uses lerp for smooth damping - feels like drone flight
 * 3. Events positioned with clear separation along curve - no z-fighting
 * 4. InstancedMesh for particles - maintains 60 FPS
 */

import { Suspense, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScrollControls, useScroll, Html } from '@react-three/drei'
import * as THREE from 'three'

import { eventsData } from './data/eventsData'
import { SplinePath, createTimelineCurve } from './components/SplinePath'
import { Starfield } from './components/Starfield'
import { EventNode } from './components/EventNode'

// ================================
// CONSTANTS
// ================================
const BG_COLOR = '#030303'

// ================================
// CAMERA CONTROLLER
// ================================

interface CameraControllerProps {
    curve: THREE.CatmullRomCurve3
    isMobile: boolean
}

/**
 * Controls camera movement along the spline based on scroll.
 * Uses lerp for smooth, cinematic motion.
 */
function CameraController({ curve, isMobile }: CameraControllerProps) {
    const scroll = useScroll()
    const { camera } = useThree()

    useFrame(() => {
        // Get normalized scroll progress (0 to 1)
        const t = THREE.MathUtils.clamp(scroll.offset, 0, 0.995)

        // Get camera position from curve
        const position = curve.getPointAt(t)

        // Look slightly ahead on curve for natural direction
        const lookAheadT = Math.min(t + 0.015, 0.995)
        const lookAt = curve.getPointAt(lookAheadT)

        // Smooth camera movement with lerp (damping)
        const lerpSpeed = isMobile ? 0.06 : 0.05
        camera.position.lerp(position, lerpSpeed)

        // Smooth look direction using lookAt matrix
        const direction = new THREE.Vector3().subVectors(lookAt, camera.position)
        const targetQuaternion = new THREE.Quaternion()
        const matrix = new THREE.Matrix4().lookAt(
            camera.position,
            lookAt,
            new THREE.Vector3(0, 1, 0)
        )
        targetQuaternion.setFromRotationMatrix(matrix)
        camera.quaternion.slerp(targetQuaternion, lerpSpeed * 1.5)

        // Subtle roll based on curve tangent (cinematic effect)
        const tangent = curve.getTangentAt(t)
        const rollAmount = tangent.x * (isMobile ? 0.2 : 0.3)
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, rollAmount, 0.03)
    })

    return null
}

// ================================
// EVENTS ON CURVE
// ================================

interface EventsOnCurveProps {
    curve: THREE.CatmullRomCurve3
    isMobile: boolean
}

/**
 * Positions event nodes along the spline curve.
 * Events are evenly distributed with alternating left/right offset.
 */
function EventsOnCurve({ curve, isMobile }: EventsOnCurveProps) {
    const eventPositions = useMemo(() => {
        const sideOffset = isMobile ? 2.8 : 3.5
        const startT = 0.05
        const endT = 0.95
        const range = endT - startT
        const step = range / eventsData.length

        return eventsData.map((event, index) => {
            // Position along curve
            const t = startT + (index + 0.5) * step
            const point = curve.getPointAt(t)
            const tangent = curve.getTangentAt(t)

            // Calculate perpendicular offset (alternating left/right)
            const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize()
            const offset = index % 2 === 0 ? sideOffset : -sideOffset
            const position = point.clone().add(normal.multiplyScalar(offset))

            return { event, position }
        })
    }, [curve, isMobile])

    return (
        <>
            {eventPositions.map(({ event, position }) => (
                <EventNode
                    key={event.id}
                    event={event}
                    position={position}
                    isMobile={isMobile}
                />
            ))}
        </>
    )
}

// ================================
// SCROLL TRACKER
// ================================

function ScrollTracker({ onProgress }: { onProgress: (p: number) => void }) {
    const scroll = useScroll()
    useFrame(() => onProgress(scroll.offset))
    return null
}

// ================================
// 3D SCENE
// ================================

interface SceneProps {
    isMobile: boolean
    onProgress: (p: number) => void
}

function Scene({ isMobile, onProgress }: SceneProps) {
    // Create curve once
    const curve = useMemo(() => createTimelineCurve(isMobile), [isMobile])

    return (
        <>
            {/* Background & Fog */}
            <color attach="background" args={[BG_COLOR]} />
            <fog attach="fog" args={[BG_COLOR, 6, 70]} />

            {/* Track scroll progress */}
            <ScrollTracker onProgress={onProgress} />

            {/* Camera movement */}
            <CameraController curve={curve} isMobile={isMobile} />

            {/* Glowing timeline spline */}
            <SplinePath curve={curve} isMobile={isMobile} />

            {/* Star particles */}
            <Starfield isMobile={isMobile} />

            {/* Event nodes */}
            <EventsOnCurve curve={curve} isMobile={isMobile} />

            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
            <pointLight position={[5, 5, -30]} intensity={1.2} color="#4285F4" />
            <pointLight position={[-5, -5, -60]} intensity={1.2} color="#EA4335" />
        </>
    )
}

// ================================
// LOADER
// ================================

function Loader() {
    return (
        <Html center>
            <div style={{ display: 'flex', gap: 6 }}>
                {['#4285F4', '#EA4335', '#FBBC04', '#34A853'].map((color, i) => (
                    <div
                        key={color}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: color,
                            animation: `pulse 1s ease ${i * 0.15}s infinite`,
                        }}
                    />
                ))}
            </div>
        </Html>
    )
}

// ================================
// UI OVERLAY
// ================================

interface UIOverlayProps {
    progress: number
    isMobile: boolean
}

function UIOverlay({ progress, isMobile }: UIOverlayProps) {
    const currentIndex = Math.floor(progress * eventsData.length)
    const currentEvent = eventsData[Math.min(currentIndex, eventsData.length - 1)]

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Gradients */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black to-transparent" />

            {/* Header */}
            <div className="absolute inset-x-0 top-12 md:top-16 flex flex-col items-center text-center px-4">
                <p
                    className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-semibold mb-2"
                    style={{ color: '#EA4335', textShadow: '0 0 20px rgba(234,67,53,0.5)' }}
                >
                    Journey Through Time
                </p>
                <h2
                    className="text-4xl md:text-6xl lg:text-7xl font-display"
                    style={{ color: 'white', textShadow: '0 0 40px rgba(255,255,255,0.1)' }}
                >
                    EVENTS
                </h2>
                <p className="text-white/40 mt-2 text-xs md:text-sm">
                    Fly through our experiences
                </p>
            </div>

            {/* Progress dots (right side) */}
            <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {eventsData.map((e, i) => (
                    <div
                        key={e.id}
                        className="transition-all duration-300"
                        style={{
                            width: i === currentIndex ? 10 : 6,
                            height: i === currentIndex ? 10 : 6,
                            borderRadius: '50%',
                            backgroundColor: e.color,
                            opacity: i === currentIndex ? 1 : 0.3,
                            boxShadow: i === currentIndex ? `0 0 10px ${e.color}` : 'none',
                        }}
                    />
                ))}
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
                <p className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-2">
                    Scroll to explore
                </p>
                <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5 mx-auto">
                    <div className="w-1 h-1.5 bg-white/40 rounded-full animate-bounce" />
                </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 md:w-40">
                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-100"
                        style={{
                            width: `${progress * 100}%`,
                            background: `linear-gradient(90deg, #4285F4, ${currentEvent?.color || '#EA4335'})`,
                            boxShadow: `0 0 8px ${currentEvent?.color || '#4285F4'}`,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

// ================================
// MAIN COMPONENT
// ================================

interface Events3DExperienceProps {
    isMobile?: boolean
}

export function Events3DExperience({ isMobile = false }: Events3DExperienceProps) {
    const [progress, setProgress] = useState(0)

    // More scroll pages = smoother journey with better event separation
    const scrollPages = isMobile ? 7 : 6
    const sectionHeight = `${scrollPages * 100}vh`

    const handleProgress = useCallback((p: number) => setProgress(p), [])

    return (
        <section
            id="events"
            className="relative bg-black"
            style={{ height: sectionHeight }}
        >
            <div className="sticky top-0 h-screen w-screen overflow-hidden">
                <UIOverlay progress={progress} isMobile={isMobile} />

                <Canvas
                    className="absolute inset-0"
                    camera={{
                        position: [0, 0, 2],
                        fov: isMobile ? 65 : 55,
                        near: 0.1,
                        far: 150,
                    }}
                    dpr={[1, 2]}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                    }}
                >
                    <Suspense fallback={<Loader />}>
                        <ScrollControls pages={scrollPages} damping={0.2} distance={1}>
                            <Scene isMobile={isMobile} onProgress={handleProgress} />
                        </ScrollControls>
                    </Suspense>
                </Canvas>
            </div>
        </section>
    )
}

export default Events3DExperience
