import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, ScrollControls, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '@/contexts/ThemeContext'

// ================================
// TYPES & DATA
// ================================
type EventItem = {
  id: number
  title: string
  type: string
  date: string
  color: string
  description: string
}

const events: EventItem[] = [
  { id: 1, title: 'DevFest 2025', type: 'Conference', date: 'Jan 15', color: '#4285F4', description: 'Annual flagship developer conference with keynotes, workshops, and networking.' },
  { id: 2, title: 'Flutter Workshop', type: 'Workshop', date: 'Jan 28', color: '#34A853', description: 'Hands-on session to build your first cross platform Flutter application.' },
  { id: 3, title: 'AI ML Study Jam', type: 'Study Jam', date: 'Feb 10', color: '#EA4335', description: 'Collaborative learning session on TensorFlow and machine learning basics.' },
  { id: 4, title: 'Cloud Summit', type: 'Summit', date: 'Feb 25', color: '#FBBC04', description: 'Deep dive into Google Cloud Platform services and best practices.' },
  { id: 5, title: 'Hackathon 2025', type: 'Hackathon', date: 'Mar 8-9', color: '#4285F4', description: '48 hour coding marathon to build innovative solutions.' },
  { id: 6, title: 'Firebase Workshop', type: 'Workshop', date: 'Mar 22', color: '#EA4335', description: 'Learn backend as a service with Firebase for web and mobile apps.' },
  { id: 7, title: 'Women Techmakers', type: 'Panel', date: 'Apr 5', color: '#FBBC04', description: 'Panel discussion celebrating women in technology.' },
  { id: 8, title: 'I/O Extended', type: 'Watch Party', date: 'May 14', color: '#34A853', description: 'Live watch party for Google I/O with local networking.' },
]

const BG_COLOR = '#030303'

// ================================
// UTILITY HOOKS
// ================================
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

// ================================
// SPLINE CURVE GENERATION
// ================================
const createSplineCurve = (isMobile: boolean): THREE.CatmullRomCurve3 => {
  const points: THREE.Vector3[] = []
  const segments = 50
  const totalLength = isMobile ? 100 : 120

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Gentle serpentine path through 3D space
    const x = Math.sin(t * Math.PI * 2) * (isMobile ? 2 : 3) * (1 - t * 0.3)
    const y = Math.cos(t * Math.PI * 1.5) * (isMobile ? 1 : 1.5) * (1 - t * 0.4)
    const z = -t * totalLength
    points.push(new THREE.Vector3(x, y, z))
  }

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
}

// ================================
// GLOWING SPLINE TUBE
// ================================
const GlowingSpline = ({ curve, isMobile }: { curve: THREE.CatmullRomCurve3; isMobile: boolean }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime
    }
  })

  return (
    <mesh>
      <tubeGeometry args={[curve, 500, isMobile ? 0.03 : 0.04, 16, false]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#4285F4') },
        }}
        vertexShader={`
          varying float vProgress;
          void main() {
            vProgress = position.z / -120.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor;
          varying float vProgress;

          void main() {
            float pulse = sin(uTime * 2.0 - vProgress * 20.0) * 0.5 + 0.5;
            float glow = 0.15 + pulse * 0.25;
            vec3 color = uColor * (1.2 + pulse * 0.4);
            gl_FragColor = vec4(color, glow);
          }
        `}
      />
    </mesh>
  )
}

// ================================
// STARFIELD BACKGROUND (InstancedMesh)
// ================================
const Starfield = ({ isMobile }: { isMobile: boolean }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = isMobile ? 400 : 800
  const { theme } = useTheme()

  const matrices = useMemo(() => {
    const temp: THREE.Matrix4[] = []
    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4()
      const angle = Math.random() * Math.PI * 2
      const radius = 5 + Math.random() * 15
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -Math.random() * 130
      )
      const scale = 0.02 + Math.random() * 0.04
      matrix.compose(position, new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale))
      temp.push(matrix)
    }
    return temp
  }, [count])

  useEffect(() => {
    if (!meshRef.current) return
    matrices.forEach((m, i) => meshRef.current!.setMatrixAt(i, m))
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [matrices])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.z = clock.elapsedTime * 0.02
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={theme === 'light' ? '#000000' : 'white'} transparent opacity={0.6} />
    </instancedMesh>
  )
}

// ================================
// EVENT CARD (Holographic Pane)
// ================================
const EventCard = ({
  event,
  position,
  isMobile
}: {
  event: EventItem
  position: THREE.Vector3
  isMobile: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const { theme } = useTheme()

  useFrame(() => {
    if (!groupRef.current) return
    // Face the camera
    groupRef.current.lookAt(camera.position)

    // Scale based on distance
    const dist = camera.position.distanceTo(groupRef.current.position)
    const scale = THREE.MathUtils.clamp(1.5 - dist * 0.02, 0.6, 1.2)
    groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
  })

  const width = isMobile ? 240 : 300
  const displayColor = event.color === '#FBBC04' && theme === 'light' ? '#000000' : event.color

  return (
    <group ref={groupRef} position={position}>
      <Html transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            width,
            background: `linear-gradient(135deg, ${displayColor}25, ${displayColor}08)`,
            backgroundColor: 'rgba(var(--card-bg), 0.5)',
            backdropFilter: 'blur(12px)',
            border: `1.5px solid ${displayColor}66`,
            borderRadius: 16,
            padding: isMobile ? 16 : 20,
            boxShadow: `0 0 40px ${displayColor}30, inset 0 0 20px ${displayColor}10`,
            transition: 'background-color 0.3s'
          }}
        >
          {/* Event Type Badge */}
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 10,
              background: `${displayColor}40`,
              color: displayColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {event.type}
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: isMobile ? 18 : 22,
            fontWeight: 700,
            color: 'rgb(var(--foreground))',
            marginBottom: 6,
            textShadow: `0 0 20px ${displayColor}50`,
            transition: 'color 0.3s'
          }}>
            {event.title}
          </h3>

          {/* Date */}
          <p style={{ color: displayColor, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
            {event.date}
          </p>

          {/* Description */}
          <p style={{
            color: 'rgba(var(--foreground), 0.6)',
            fontSize: 12,
            lineHeight: 1.5,
            transition: 'color 0.3s'
          }}>
            {event.description}
          </p>
        </div>
      </Html>
    </group>
  )
}

// ================================
// EVENTS ON SPLINE
// ================================
const EventsOnSpline = ({
  curve,
  isMobile
}: {
  curve: THREE.CatmullRomCurve3
  isMobile: boolean
}) => {
  const eventPositions = useMemo(() => {
    const sideOffset = isMobile ? 2.5 : 3.5
    const startT = 0.06
    const endT = 0.94
    const range = endT - startT
    const step = range / events.length

    return events.map((event, i) => {
      const t = startT + (i + 0.5) * step
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)

      // Perpendicular offset (alternate left/right)
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize()
      const offset = i % 2 === 0 ? sideOffset : -sideOffset
      const position = point.clone().add(normal.multiplyScalar(offset))

      return { event, position }
    })
  }, [curve, isMobile])

  return (
    <>
      {eventPositions.map(({ event, position }) => (
        <EventCard key={event.id} event={event} position={position} isMobile={isMobile} />
      ))}
    </>
  )
}

// ================================
// CAMERA CONTROLLER (Fly Along Spline)
// ================================
const CameraController = ({
  curve,
  isMobile
}: {
  curve: THREE.CatmullRomCurve3
  isMobile: boolean
}) => {
  const scroll = useScroll()
  const { camera } = useThree()

  useFrame(() => {
    // Get scroll progress (0 to 1)
    const t = THREE.MathUtils.clamp(scroll.offset, 0, 0.99)

    // Get camera position on curve
    const position = curve.getPointAt(t)

    // Look slightly ahead on the curve
    const lookAheadT = Math.min(t + 0.02, 0.99)
    const lookAt = curve.getPointAt(lookAheadT)

    // Smooth camera movement with lerp (damping)
    const lerpFactor = isMobile ? 0.08 : 0.06
    camera.position.lerp(position, lerpFactor)

    // Smooth look direction
    const direction = lookAt.clone().sub(camera.position).normalize()
    const targetQuaternion = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const matrix = new THREE.Matrix4().lookAt(camera.position, lookAt, up)
    targetQuaternion.setFromRotationMatrix(matrix)
    camera.quaternion.slerp(targetQuaternion, lerpFactor * 1.5)

    // Subtle roll based on curve direction
    const tangent = curve.getTangentAt(t)
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, tangent.x * 0.3, 0.05)
  })

  return null
}

// ================================
// SCROLL PROGRESS TRACKER
// ================================
const ScrollTracker = ({ onProgress }: { onProgress: (v: number) => void }) => {
  const scroll = useScroll()
  useFrame(() => onProgress(scroll.offset))
  return null
}

// ================================
// 3D SCENE
// ================================
const TimelineScene = ({ isMobile }: { isMobile: boolean }) => {
  const curve = useMemo(() => createSplineCurve(isMobile), [isMobile])
  const { theme } = useTheme()
  const bgColor = theme === 'light' ? '#ffffff' : BG_COLOR

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 8, 80]} />

      <GlowingSpline curve={curve} isMobile={isMobile} />
      <Starfield isMobile={isMobile} />
      <EventsOnSpline curve={curve} isMobile={isMobile} />
      <CameraController curve={curve} isMobile={isMobile} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[5, 5, -30]} intensity={1.5} color="#4285F4" />
      <pointLight position={[-5, -5, -60]} intensity={1.5} color="#EA4335" />
    </>
  )
}

// ================================
// UI OVERLAY
// ================================
const TimelineUI = ({
  progress,
  isMobile
}: {
  progress: number
  isMobile: boolean
}) => {
  const { theme } = useTheme()
  const currentEventIndex = Math.floor(progress * events.length)
  const currentEvent = events[Math.min(currentEventIndex, events.length - 1)]

  // Helper to adjust color for light mode if it's yellow
  const getColor = (c: string) => (c === '#FBBC04' && theme === 'light' ? '#000000' : c)

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top gradient for readability */}
      <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${theme === 'light' ? 'from-white' : 'from-black'} to-transparent`} />
      {/* Bottom gradient */}
      <div className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t ${theme === 'light' ? 'from-white' : 'from-black'} to-transparent`} />

      {/* Header */}
      <div className="absolute inset-x-0 top-16 md:top-20 flex flex-col items-center text-center px-4">
        <p
          className="text-xs uppercase tracking-[0.4em] font-semibold mb-2"
          style={{ color: '#EA4335', textShadow: '0 0 20px rgba(234,67,53,0.5)' }}
        >
          Journey Through Time
        </p>
        <h2
          className="text-5xl md:text-7xl font-display transition-colors duration-300"
          style={{ color: 'rgb(var(--foreground))', textShadow: '0 0 40px rgba(var(--primary), 0.1)' }}
        >
          EVENTS
        </h2>
        <p className="text-[rgb(var(--foreground))]/40 mt-2 text-sm transition-colors duration-300">Fly through our experiences</p>
      </div>

      {/* Progress Indicator (Right Side) */}
      <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {events.map((e, i) => {
          const isActive = i === currentEventIndex
          const displayColor = getColor(e.color)
          return (
            <div
              key={e.id}
              className="transition-all duration-300"
              style={{
                width: isActive ? 12 : 8,
                height: isActive ? 12 : 8,
                borderRadius: '50%',
                backgroundColor: displayColor,
                opacity: isActive ? 1 : 0.3,
                boxShadow: isActive ? `0 0 10px ${displayColor}` : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Scroll Hint */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[rgb(var(--foreground))]/25 text-[10px] uppercase tracking-[0.3em] mb-2">
          Scroll to explore
        </p>
        <div className="w-5 h-8 rounded-full border border-[rgb(var(--foreground))]/20 flex justify-center pt-1.5 mx-auto">
          <div className="w-1 h-1.5 bg-[rgb(var(--foreground))]/40 rounded-full animate-bounce" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40">
        <div className="h-0.5 bg-[rgb(var(--foreground))]/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, #4285F4, ${getColor(currentEvent?.color || '#EA4335')})`,
              boxShadow: `0 0 10px ${getColor(currentEvent?.color || '#4285F4')}`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ================================
// LOADER
// ================================
const Loader = () => (
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

// ================================
// MAIN COMPONENT
// ================================
const EventsTimeline = () => {
  const isMobile = useIsMobile()
  const [progress, setProgress] = useState(0)

  // Scroll pages (more = smoother journey with better separation)
  const pages = isMobile ? 8 : 6
  const sectionHeight = `${pages * 100}vh`

  return (
    <section
      id="events"
      className="relative bg-[rgb(var(--background))] transition-colors duration-300"
      style={{ height: sectionHeight }}
    >
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        <TimelineUI progress={progress} isMobile={isMobile} />

        <Canvas
          className="absolute inset-0"
          camera={{
            position: [0, 0, 2],
            fov: isMobile ? 65 : 55,
            near: 0.1,
            far: 200,
          }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={<Loader />}>
            <ScrollControls pages={pages} damping={0.25} distance={1}>
              <ScrollTracker onProgress={setProgress} />
              <TimelineScene isMobile={isMobile} />
            </ScrollControls>
          </Suspense>
        </Canvas>
      </div>
    </section>
  )
}

export default EventsTimeline
