/**
 * TeamGarage3D.tsx
 * 
 * PART 1: Holographic "Select Player" Garage - 3D Scene
 * 
 * A 3D environment with themed team bays:
 * - TechOps: Server racks, Matrix-style code, cyan lighting
 * - Design: Geometric primitives, soft neon gradients  
 * - Media: Cameras, microphones, waveforms
 * - Logistics: Command center, holographic maps
 * - Leads (optional): Leadership spotlight
 * 
 * Camera transitions smoothly between bays on selection.
 */

import { Suspense, useState, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Float, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '@/contexts/ThemeContext'

// ================================
// TYPES
// ================================

export type BayId = 'leads' | 'techops' | 'design' | 'media' | 'logistics'

export interface TeamGarageMember {
    id: string | number
    name: string
    role: string
    codename?: string
}

export type TeamGarageMembersByBay = Partial<Record<BayId, TeamGarageMember[]>>

interface BayData {
    id: BayId
    name: string
    color: string
    position: [number, number, number]
    members: TeamGarageMember[]
}

export type TeamGarageBayMeta = Omit<BayData, 'members'>

export interface TeamGarageCameraConfig {
    overviewZ?: number
    overviewY?: number
    focusZ?: number
    fov?: number
}

// ================================
// DATA
// ================================

const DEFAULT_BAY_META: TeamGarageBayMeta[] = [
    {
        id: 'leads',
        name: 'LEADS',
        color: '#9E9E9E',
        position: [-5, 0, 0],
    },
    {
        id: 'techops',
        name: 'TECH_OPS',
        color: '#4285F4',
        position: [-2.5, 0, 0],
    },
    {
        id: 'design',
        name: 'DESIGN',
        color: '#EA4335',
        position: [0, 0, 0],
    },
    {
        id: 'media',
        name: 'MEDIA',
        color: '#FBBC04',
        position: [2.5, 0, 0],
    },
    {
        id: 'logistics',
        name: 'LOGISTICS',
        color: '#34A853',
        position: [5, 0, 0],
    },
]

const DEFAULT_MEMBERS_BY_BAY: Record<BayId, TeamGarageMember[]> = {
    leads: [
        { id: 0, name: 'Rakesh', role: 'Lead', codename: 'ORBIT' },
        { id: 9, name: 'Kishore', role: 'Co-lead', codename: 'PULSE' },
    ],
    techops: [
        { id: 1, name: 'Lokesh JR', role: 'Tech-Ops Lead', codename: 'CIPHER' },
        { id: 2, name: 'Prasanna', role: 'Tech-Ops Co-Lead', codename: 'VECTOR' },
    ],
    design: [
        { id: 3, name: 'Aishwarya', role: 'Design Lead', codename: 'PRISM' },
        { id: 4, name: 'Akshithaa', role: 'Design Co-Lead', codename: 'PIXEL' },
    ],
    media: [
        { id: 5, name: 'Benin', role: 'Media Lead', codename: 'LENS' },
        { id: 6, name: 'Madhusha Harini', role: 'Media Co-Lead', codename: 'SIGNAL' },
    ],
    logistics: [
        { id: 7, name: 'Venkat', role: 'Logistics Lead', codename: 'NEXUS' },
        { id: 8, name: 'Aboorvan', role: 'Logistics Co-Lead', codename: 'RELAY' },
    ],
}

function resolveBaysData(bayMeta: TeamGarageBayMeta[], membersByBay?: TeamGarageMembersByBay): BayData[] {
    return bayMeta.map((bay) => ({
        ...bay,
        members: membersByBay?.[bay.id] ?? DEFAULT_MEMBERS_BY_BAY[bay.id],
    }))
}

interface CardMetrics {
    width: number
    height: number
    gapX: number
    gapY: number
    glowPadding: number
    infoOffsetY: number
    infoWidth: number
    textScale: number
}

const CARD_METRICS: Record<'classic' | 'grid', CardMetrics> = {
    classic: {
        width: 0.8,
        height: 1.1,
        gapX: 0.35,
        gapY: 0.35,
        glowPadding: 0.2,
        infoOffsetY: 0.4,
        infoWidth: 90,
        textScale: 1,
    },
    grid: {
        width: 0.55,
        height: 0.78,
        gapX: 0.32,
        gapY: 0.32,
        glowPadding: 0.14,
        infoOffsetY: 0.28,
        infoWidth: 80,
        textScale: 0.85,
    },
}

function getCardMetrics(layoutMode: 'classic' | 'grid'): CardMetrics {
    return CARD_METRICS[layoutMode]
}

function getCodename(member: TeamGarageMember): string {
    if (member.codename) return member.codename
    const trimmed = member.name.trim()
    if (!trimmed) return 'OPERATIVE'
    const initials = trimmed
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase())
        .join('')
    return initials || trimmed.toUpperCase()
}

function getLayoutScale(count: number): number {
    if (count > 24) return 0.6
    if (count > 18) return 0.7
    if (count > 12) return 0.8
    if (count > 8) return 0.9
    return 1
}

function calculateCardPositions(count: number, metrics: CardMetrics): [number, number, number][] {
    if (count <= 0) return []
    const columns = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(count))))
    const rows = Math.ceil(count / columns)
    const totalWidth = columns * metrics.width + (columns - 1) * metrics.gapX
    const totalHeight = rows * metrics.height + (rows - 1) * metrics.gapY
    const startX = -totalWidth / 2 + metrics.width / 2
    const startY = totalHeight / 2 - metrics.height / 2
    const positions: [number, number, number][] = []

    for (let i = 0; i < count; i += 1) {
        const row = Math.floor(i / columns)
        const col = i % columns
        const x = startX + col * (metrics.width + metrics.gapX)
        const y = startY - row * (metrics.height + metrics.gapY)
        const z = row * -0.12
        positions.push([x, y, z])
    }

    return positions
}

// ================================
// HOLOGRAPHIC CARD SHADER (PREMIUM)
// ================================

const HolographicCardMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#4285F4') },
        uHover: { value: 0 },
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uHover;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    // Noise function for distortion
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    
    // Rainbow/iridescent color
    vec3 rainbow(float t) {
      vec3 c = vec3(
        0.5 + 0.5 * cos(6.28318 * (t + 0.0)),
        0.5 + 0.5 * cos(6.28318 * (t + 0.33)),
        0.5 + 0.5 * cos(6.28318 * (t + 0.67))
      );
      return c;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // === NOISE DISTORTION ===
      float noiseVal = noise(uv * 8.0 + uTime * 0.5) * 0.02;
      uv += noiseVal * uHover;
      
      // === FRESNEL / RIM LIGHTING ===
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 4.0);
      
      // === RAINBOW IRIDESCENT FRESNEL ===
      float iridescence = fresnel * 0.5 + uv.y * 0.3 + uTime * 0.1;
      vec3 rainbowColor = rainbow(iridescence) * fresnel * 0.6;
      
      // === ANIMATED SCANLINES ===
      float scanline1 = sin(uv.y * 150.0 - uTime * 3.0) * 0.5 + 0.5;
      float scanline2 = sin(uv.y * 50.0 + uTime * 1.5) * 0.5 + 0.5;
      float scanlines = smoothstep(0.3, 0.7, scanline1) * 0.1 + smoothstep(0.4, 0.6, scanline2) * 0.05;
      
      // === CHROMATIC ABERRATION ===
      float aberrationStrength = 0.01 + uHover * 0.02;
      vec2 redOffset = vec2(aberrationStrength, 0.0);
      vec2 blueOffset = vec2(-aberrationStrength, 0.0);
      
      // === PULSE WAVE ===
      float pulse = sin(uTime * 2.0 + uv.y * 10.0) * 0.5 + 0.5;
      float pulseWave = smoothstep(0.0, 0.1, abs(fract(uv.y - uTime * 0.2) - 0.5) - 0.45) * 0.3;
      
      // === GLITCH EFFECT ===
      float glitch = 0.0;
      if (uHover > 0.3) {
        float glitchTime = uTime * 60.0;
        float glitchLine = step(0.96, sin(glitchTime + uv.y * 25.0));
        float glitchBlock = step(0.98, hash(vec2(floor(uTime * 10.0), floor(uv.y * 8.0))));
        glitch = (glitchLine + glitchBlock * 2.0) * 0.15 * uHover;
      }
      
      // === EDGE GLOW ===
      float edgeX = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);
      float edgeY = smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
      float edgeGlow = (1.0 - edgeX * edgeY) * 0.5;
      
      // === HOLOGRAPHIC GRID ===
      float gridX = smoothstep(0.48, 0.5, abs(fract(uv.x * 20.0) - 0.5));
      float gridY = smoothstep(0.48, 0.5, abs(fract(uv.y * 28.0) - 0.5));
      float grid = (gridX + gridY) * 0.03 * (1.0 - fresnel);
      
      // === COMPOSE FINAL COLOR ===
      vec3 baseColor = uColor * 0.25;
      vec3 rimColor = uColor * fresnel * 2.5;
      vec3 pulseColor = uColor * pulseWave;
      vec3 glowColor = uColor * edgeGlow * 1.5;
      
      vec3 finalColor = baseColor + rimColor + rainbowColor + scanlines + pulseColor + glowColor + grid + glitch;
      
      // === ALPHA ===
      float alpha = 0.5 + fresnel * 0.5 + edgeGlow * 0.3;
      alpha = clamp(alpha, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
}

// ================================
// HOLOGRAPHIC CARD COMPONENT
// ================================

interface HolographicCard3DProps {
    member: TeamGarageMember
    color: string
    position: [number, number, number]
    index: number
    metrics: CardMetrics
}

function HolographicCard3D({ member, color, position, index, metrics }: HolographicCard3DProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const [hovered, setHovered] = useState(false)
    const codename = getCodename(member)
    const { width, height, glowPadding, infoOffsetY, infoWidth, textScale } = metrics
    const nameClassName = width < 0.7 ? 'text-[10px]' : 'text-xs'

    // Clone uniforms for each card
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uHover: { value: 0 },
    }), [color])

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.elapsedTime
            // Smooth hover transition
            const targetHover = hovered ? 1 : 0
            materialRef.current.uniforms.uHover.value += (targetHover - materialRef.current.uniforms.uHover.value) * 0.1
        }
    })

    return (
        <Float
            speed={2}
            rotationIntensity={0.2}
            floatIntensity={0.3}
            position={position}
        >
            <group>
                {/* Card mesh */}
                <mesh
                    ref={meshRef}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                >
                    <planeGeometry args={[width, height]} />
                    <shaderMaterial
                        ref={materialRef}
                        transparent
                        side={THREE.DoubleSide}
                        uniforms={uniforms}
                        vertexShader={HolographicCardMaterial.vertexShader}
                        fragmentShader={HolographicCardMaterial.fragmentShader}
                    />
                </mesh>

                {/* Member info overlay */}
                <Html
                    position={[0, -infoOffsetY, 0.01]}
                    center
                    style={{ pointerEvents: 'none', width: infoWidth, transform: `scale(${textScale})`, transformOrigin: 'center' }}
                >
                    <div className="text-center" style={{ maxWidth: '100%' }}>
                        <p
                            className="text-[8px] font-mono tracking-widest mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                            style={{ color, textShadow: `0 0 10px ${color}` }}
                        >
              // {codename}
                        </p>
                        <p className={`text-white font-display leading-tight text-center break-words ${nameClassName}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                            {member.name}
                        </p>
                        <p className="text-white/50 text-[8px] text-center leading-tight break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                            {member.role}
                        </p>
                    </div>
                </Html>

                {/* Glow plane behind card */}
                <mesh position={[0, 0, -0.1]}>
                    <planeGeometry args={[width + glowPadding, height + glowPadding]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={hovered ? 0.15 : 0.05}
                    />
                </mesh>
            </group>
        </Float>
    )
}

// ================================
// BAY DECORATIONS
// ================================

function LeadsBayDecor({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null)
    const glowColor = color === '#FFFFFF' ? '#E6E6E6' : color

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = clock.elapsedTime * 0.08
        }
    })

    return (
        <group ref={groupRef}>
            <mesh position={[0, 0.55, -0.4]}>
                <cylinderGeometry args={[0.35, 0.45, 0.2, 32]} />
                <meshStandardMaterial
                    color={glowColor}
                    emissive={glowColor}
                    emissiveIntensity={0.35}
                    transparent
                    opacity={0.7}
                />
            </mesh>
            <mesh position={[0, 0.85, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.5, 0.03, 12, 48]} />
                <meshStandardMaterial
                    color={glowColor}
                    emissive={glowColor}
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.7}
                />
            </mesh>
            <Float speed={1.2} floatIntensity={0.2}>
                <mesh position={[0, 1.2, -0.4]}>
                    <octahedronGeometry args={[0.12, 0]} />
                    <meshStandardMaterial
                        color={glowColor}
                        emissive={glowColor}
                        emissiveIntensity={0.8}
                        wireframe
                    />
                </mesh>
            </Float>
        </group>
    )
}

function TechOpsBayDecor({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null)

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = clock.elapsedTime * 0.1
        }
    })

    return (
        <group ref={groupRef}>
            {/* Floating server racks */}
            {[...Array(3)].map((_, i) => (
                <Float key={i} speed={1.5} floatIntensity={0.2}>
                    <mesh position={[(i - 1) * 0.6, 0.8 + i * 0.2, -0.5]}>
                        <boxGeometry args={[0.3, 0.5, 0.1]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.3}
                            transparent
                            opacity={0.6}
                        />
                    </mesh>
                </Float>
            ))}
            {/* Grid lines */}
            <gridHelper args={[2, 10, color, color]} position={[0, -1, 0]} />
        </group>
    )
}

function DesignBayDecor({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null)

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = -clock.elapsedTime * 0.08
        }
    })

    return (
        <group ref={groupRef}>
            {/* Floating geometric primitives */}
            <Float speed={2} floatIntensity={0.3}>
                <mesh position={[0.5, 0.7, -0.3]} rotation={[0.5, 0.5, 0]}>
                    <icosahedronGeometry args={[0.2, 0]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.5}
                        wireframe
                    />
                </mesh>
            </Float>
            <Float speed={1.8} floatIntensity={0.25}>
                <mesh position={[-0.4, 0.9, -0.2]} rotation={[0.3, 0.7, 0]}>
                    <octahedronGeometry args={[0.15, 0]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.5}
                        wireframe
                    />
                </mesh>
            </Float>
        </group>
    )
}

function MediaBayDecor({ color }: { color: string }) {
    return (
        <group>
            {/* Waveform visualization */}
            {[...Array(8)].map((_, i) => (
                <Float key={i} speed={3} floatIntensity={0.5}>
                    <mesh position={[(i - 4) * 0.15, 0.8, -0.4]}>
                        <boxGeometry args={[0.05, 0.1 + Math.sin(i * 0.8) * 0.15, 0.02]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.8}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    )
}

function LogisticsBayDecor({ color }: { color: string }) {
    return (
        <group>
            {/* Tactical grid */}
            <gridHelper args={[2, 8, color, color]} position={[0, -1, 0]} />
            {/* Supply crates */}
            <Float speed={1.2} floatIntensity={0.15}>
                <mesh position={[0.6, 0.6, -0.5]}>
                    <boxGeometry args={[0.25, 0.25, 0.25]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.3}
                    />
                </mesh>
            </Float>
        </group>
    )
}

// ================================
// TEAM BAY
// ================================

interface TeamBayProps {
    bay: BayData
    isActive: boolean
    onClick: () => void
    layoutMode: 'classic' | 'grid'
}

function TeamBay({ bay, isActive, onClick, layoutMode }: TeamBayProps) {
    const groupRef = useRef<THREE.Group>(null)
    const useClassicLayout = layoutMode === 'classic' && bay.members.length <= 2
    const cardMetrics = useMemo(() => getCardMetrics(layoutMode), [layoutMode])
    const cardPositions = useMemo(() => {
        if (useClassicLayout) {
            return bay.members.map((_, i) => ([(i - 0.5) * 1, 0, 0.5] as [number, number, number]))
        }
        return calculateCardPositions(bay.members.length, cardMetrics)
    }, [bay.members.length, bay.members, cardMetrics, useClassicLayout])
    const layoutScale = useMemo(() => (useClassicLayout ? 1 : getLayoutScale(bay.members.length)), [bay.members.length, useClassicLayout])
    const layoutPosition: [number, number, number] = useClassicLayout ? [0, 0, 0] : [0, -0.25, 0.6]
    const platformRadius = layoutMode === 'grid' ? 0.9 : 1.1

    // Render bay-specific decorations
    const renderDecor = () => {
        switch (bay.id) {
            case 'leads': return <LeadsBayDecor color={bay.color} />
            case 'techops': return <TechOpsBayDecor color={bay.color} />
            case 'design': return <DesignBayDecor color={bay.color} />
            case 'media': return <MediaBayDecor color={bay.color} />
            case 'logistics': return <LogisticsBayDecor color={bay.color} />
        }
    }

    return (
        <group ref={groupRef} position={bay.position}>
            {/* Bay platform */}
            <mesh
                position={[0, -1.2, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={onClick}
            >
                <circleGeometry args={[platformRadius, 32]} />
                <meshStandardMaterial
                    color={bay.color}
                    emissive={bay.color}
                    emissiveIntensity={isActive ? 0.5 : 0.1}
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Bay decorations */}
            {renderDecor()}

            {/* Team member cards (only show when active) */}
            {isActive && bay.members.length > 0 && (
                <group scale={layoutScale} position={layoutPosition}>
                    {bay.members.map((member, i) => (
                        <HolographicCard3D
                            key={member.id}
                            member={member}
                            color={bay.color}
                            position={cardPositions[i]}
                            index={i}
                            metrics={cardMetrics}
                        />
                    ))}
                </group>
            )}

            {/* Bay label */}
            <Html position={[0, -1.5, 0]} center>
                <button
                    onClick={onClick}
                    className="px-4 py-1 font-mono text-xs tracking-widest transition-all"
                    style={{
                        color: bay.color,
                        textShadow: isActive ? `0 0 20px ${bay.color}` : 'none',
                        background: isActive ? `${bay.color}20` : 'transparent',
                        border: `1px solid ${isActive ? bay.color : 'transparent'}`,
                        borderRadius: 4,
                    }}
                >
                    {bay.name}
                </button>
            </Html>
        </group>
    )
}

// ================================
// CAMERA CONTROLLER
// ================================

interface CameraControllerProps {
    activeBay: BayId | null
    baysData: BayData[]
    overviewZ: number
    focusZ: number
}

function CameraController({ activeBay, baysData, overviewZ, focusZ }: CameraControllerProps) {
    const { camera } = useThree()

    useFrame(() => {
        const activeBayData = baysData.find(b => b.id === activeBay)

        let targetX = 0
        let targetZ = overviewZ

        if (activeBayData) {
            targetX = activeBayData.position[0]
            targetZ = focusZ
        }

        // Smooth camera movement
        camera.position.x += (targetX - camera.position.x) * 0.05
        camera.position.z += (targetZ - camera.position.z) * 0.05
        camera.lookAt(targetX, 0, 0)
    })

    return null
}

// ================================
// SCENE
// ================================

interface SceneProps {
    activeBay: BayId | null
    onSelectBay: (id: BayId) => void
    isDark: boolean
    baysData: BayData[]
    layoutMode: 'classic' | 'grid'
    overviewZ: number
    focusZ: number
}

function Scene({ activeBay, onSelectBay, isDark, baysData, layoutMode, overviewZ, focusZ }: SceneProps) {
    const bgColor = isDark ? '#050505' : '#FAFAFA'
    return (
        <>
            {/* Background */}
            <color attach="background" args={[bgColor]} />
            <fog attach="fog" args={[bgColor, 5, 15]} />

            {/* Camera controller */}
            <CameraController activeBay={activeBay} baysData={baysData} overviewZ={overviewZ} focusZ={focusZ} />

            {/* Team bays */}
            {baysData.map(bay => (
                <TeamBay
                    key={bay.id}
                    bay={bay}
                    isActive={activeBay === bay.id}
                    onClick={() => onSelectBay(bay.id)}
                    layoutMode={layoutMode}
                />
            ))}

            {/* Ambient lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 5, 5]} intensity={1} />

            {/* Colored spotlights per bay */}
            {baysData.map(bay => (
                <spotLight
                    key={bay.id}
                    position={[bay.position[0], 3, 2]}
                    color={bay.color}
                    intensity={activeBay === bay.id ? 2 : 0.3}
                    angle={0.5}
                    penumbra={1}
                />
            ))}
        </>
    )
}

// ================================
// UI OVERLAY
// ================================

interface UIOverlayProps {
    activeBay: BayId | null
    baysData: BayData[]
}

function UIOverlay({ activeBay, baysData }: UIOverlayProps) {
    const bayData = baysData.find(b => b.id === activeBay)

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top header */}
            <div className="absolute top-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-[10px] font-mono tracking-[0.3em] text-red-500/70">
                        RESTRICTED ACCESS // CLEARANCE LEVEL: CORE
                    </p>
                </div>
                <h2 className="text-4xl md:text-5xl font-display text-[rgb(var(--foreground))] transition-colors duration-300">
                    CORE <span style={{ color: bayData?.color ? bayData.color : 'rgb(var(--text-primary-raw))' }}>TEAM</span>
                </h2>
                {bayData && (
                    <p className="text-[rgb(var(--foreground))]/40 font-mono text-xs mt-2 transition-colors duration-300">
                        SELECTED // {bayData.members.length} OPERATIVES IN {bayData.name}
                    </p>
                )}
            </div>

            {/* Bottom status */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[10px] font-mono text-[rgb(var(--foreground))]/30 transition-colors duration-300">
                <span>SYSTEM: <span className="text-green-600">ONLINE</span></span>
                <span>SELECT BAY TO VIEW OPERATIVES</span>
            </div>
        </div>
    )
}

// ================================
// LOADER
// ================================

function Loader({ colors }: { colors: string[] }) {
    const palette = colors.length > 0 ? colors : ['#4285F4', '#EA4335', '#FBBC04', '#34A853']
    return (
        <Html center>
            <div className="flex gap-2">
                {palette.map((color, i) => (
                    <div
                        key={color}
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </Html>
    )
}

// ================================
// MAIN COMPONENT
// ================================

interface TeamGarage3DProps {
    membersByBay?: TeamGarageMembersByBay
    layoutMode?: 'classic' | 'grid'
    bayMeta?: TeamGarageBayMeta[]
    cameraConfig?: TeamGarageCameraConfig
}

export function TeamGarage3D({ membersByBay, layoutMode, bayMeta, cameraConfig }: TeamGarage3DProps) {
    const [activeBay, setActiveBay] = useState<BayId | null>(null)
    const { theme } = useTheme()
    const resolvedBayMeta = useMemo(() => bayMeta ?? DEFAULT_BAY_META, [bayMeta])
    const baysData = useMemo(() => resolveBaysData(resolvedBayMeta, membersByBay), [resolvedBayMeta, membersByBay])
    const loaderColors = useMemo(() => baysData.map((bay) => bay.color), [baysData])
    const resolvedLayoutMode = layoutMode ?? 'classic'
    const resolvedCameraConfig = useMemo(() => ({
        overviewZ: 6,
        overviewY: 1,
        focusZ: 3,
        fov: 50,
        ...cameraConfig,
    }), [cameraConfig])

    return (
        <div className="relative w-full h-screen bg-background transition-colors duration-300">
            <UIOverlay activeBay={activeBay} baysData={baysData} />

            <Canvas
                camera={{
                    position: [0, resolvedCameraConfig.overviewY, resolvedCameraConfig.overviewZ],
                    fov: resolvedCameraConfig.fov,
                }}
                dpr={[1, 2]}
                gl={{ antialias: true }}
            >
                <Suspense fallback={<Loader colors={loaderColors} />}>
                    <Scene
                        activeBay={activeBay}
                        onSelectBay={setActiveBay}
                        isDark={theme === 'dark'}
                        baysData={baysData}
                        layoutMode={resolvedLayoutMode}
                        overviewZ={resolvedCameraConfig.overviewZ}
                        focusZ={resolvedCameraConfig.focusZ}
                    />
                </Suspense>
            </Canvas>

            {/* Back button when bay is selected */}
            {activeBay && (
                <button
                    onClick={() => setActiveBay(null)}
                    className="absolute top-6 right-6 px-4 py-2 font-mono text-xs text-[rgb(var(--foreground))]/50 hover:text-[rgb(var(--foreground))] border border-[rgb(var(--foreground))]/20 hover:border-[rgb(var(--foreground))]/40 rounded transition-all z-20"
                >
                    ← BACK TO OVERVIEW
                </button>
            )}
        </div>
    )
}

export default TeamGarage3D
