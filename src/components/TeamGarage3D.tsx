/**
 * TeamGarage3D.tsx - REDESIGNED CYBER COMMAND GARAGE
 * 
 * Futuristic 3D Command Environment with 5 Themed Department Podiums:
 * - Real data synced from src/data/team.ts
 * - Full Dark & Light Theme synchronization
 * - Podiums labeled with crisp 3D names (automatically hidden when inspecting)
 * - Individual Holographic Cards (matching Team Page style, 3D tilt, holographic foil & scanlines)
 * - Centered presentation with zero bulky outer framing
 * - Minimalist right-arrow action button for opening full dossier modal
 * - Smooth pagination for multi-lead departments (e.g. Tech-Ops with 5 leads)
 * - Razor-sharp, crystal-clear rendering (zero blur, zero overlapping)
 * - Professional Lucide tech icons (strictly NO emojis)
 */

import React, { Suspense, useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import * as THREE from 'three'
import { useTheme } from '@/contexts/ThemeContext'
import {
    TeamMember,
    TeamId,
    TEAM_MEMBERS,
    getGarageMembersByBay,
} from '@/data/team'
import { useTeamStore } from '@/store/teamStore'
import { Link } from 'react-router-dom'
import {
    Shield,
    Terminal,
    Palette,
    Video,
    Layers,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCcw,
    ArrowRight,
    Linkedin,
    Mail,
} from 'lucide-react'

// Backward-compatible type exports
export type BayId = TeamId
export interface TeamGarageMember {
    id: string | number
    name: string
    role: string
    codename?: string
    image?: string
}
export type TeamGarageMembersByBay = Partial<Record<BayId, TeamGarageMember[]>>
export interface TeamGarageBayMeta {
    id: BayId
    name: string
    color: string
    position: [number, number, number]
}

// ================================
// BAY CONFIGURATION (NO EMOJIS)
// ================================

interface BayConfig {
    id: TeamId
    name: string
    code: string
    color: string
    description: string
    position: [number, number, number]
    iconType: 'shield' | 'terminal' | 'palette' | 'video' | 'layers'
}

const GARAGE_BAYS: BayConfig[] = [
    {
        id: 'leads',
        name: 'LEADERSHIP',
        code: '// COMMAND',
        color: '#FFFFFF',
        description: 'GDG on Campus core leadership & strategic direction',
        position: [0, 0, 0],
        iconType: 'shield',
    },
    {
        id: 'techops',
        name: 'TECH-OPS',
        code: '// ARCHITECTS',
        color: '#4285F4',
        description: 'Web, App, AI/ML, Cloud & Technical Operations',
        position: [-4.6, 0, -1.2],
        iconType: 'terminal',
    },
    {
        id: 'design',
        name: 'DESIGN',
        code: '// VISUALS',
        color: '#EA4335',
        description: 'UI/UX systems, brand identity & motion aesthetics',
        position: [-2.4, 0, 1.4],
        iconType: 'palette',
    },
    {
        id: 'media',
        name: 'MEDIA',
        code: '// BROADCAST',
        color: '#FBBC04',
        description: 'Audio/Visual production, content ops & social resonance',
        position: [2.4, 0, 1.4],
        iconType: 'video',
    },
    {
        id: 'logistics',
        name: 'OPERATIONS',
        code: '// OPERATIONS',
        color: '#34A853',
        description: 'Event planning, outreach & campus infrastructure',
        position: [4.6, 0, -1.2],
        iconType: 'layers',
    },
]

function getBayThemeColor(bayId: TeamId, isDark: boolean): string {
    switch (bayId) {
        case 'leads':
            return isDark ? '#FFFFFF' : '#0F172A'
        case 'techops':
            return isDark ? '#4285F4' : '#2563EB'
        case 'design':
            return isDark ? '#EA4335' : '#DC2626'
        case 'media':
            return isDark ? '#FBBC04' : '#D97706'
        case 'logistics':
            return isDark ? '#34A853' : '#16A34A'
        default:
            return isDark ? '#FFFFFF' : '#0F172A'
    }
}

function renderBayIcon(iconType: string, className = 'w-4 h-4') {
    switch (iconType) {
        case 'shield':
            return <Shield className={className} />
        case 'terminal':
            return <Terminal className={className} />
        case 'palette':
            return <Palette className={className} />
        case 'video':
            return <Video className={className} />
        case 'layers':
            return <Layers className={className} />
        default:
            return <Shield className={className} />
    }
}

// ================================
// 3D CYBER PODIUM MESH WITH NAME LABEL
// ================================

interface CyberPodiumProps {
    bay: BayConfig
    isActive: boolean
    hasActiveBay: boolean
    isDark: boolean
    onClick: () => void
}

function CyberPodium({ bay, isActive, hasActiveBay, isDark, onClick }: CyberPodiumProps) {
    const ringRef = useRef<THREE.Mesh>(null)
    const innerRingRef = useRef<THREE.Mesh>(null)
    const floatMeshRef = useRef<THREE.Mesh>(null)
    const color = getBayThemeColor(bay.id, isDark)

    useFrame(({ clock }) => {
        const t = clock.elapsedTime
        if (ringRef.current) {
            ringRef.current.rotation.z = t * (isActive ? 0.7 : 0.25)
        }
        if (innerRingRef.current) {
            innerRingRef.current.rotation.z = -t * (isActive ? 0.9 : 0.35)
        }
        if (floatMeshRef.current) {
            floatMeshRef.current.rotation.y = t * 0.6
            floatMeshRef.current.rotation.x = Math.sin(t * 0.8) * 0.2
        }
    })

    return (
        <group position={bay.position}>
            {/* Base Tier 1: Main Platform */}
            <mesh position={[0, -1.2, 0]} onClick={onClick}>
                <cylinderGeometry args={[1.3, 1.5, 0.25, 32]} />
                <meshStandardMaterial
                    color={isActive ? color : isDark ? '#0f172a' : '#e2e8f0'}
                    emissive={color}
                    emissiveIntensity={isActive ? (isDark ? 0.45 : 0.2) : isDark ? 0.08 : 0.02}
                    roughness={0.25}
                    metalness={isDark ? 0.8 : 0.2}
                />
            </mesh>

            {/* Base Tier 2: Elevated Step */}
            <mesh position={[0, -1.05, 0]} onClick={onClick}>
                <cylinderGeometry args={[1.05, 1.15, 0.1, 32]} />
                <meshStandardMaterial
                    color={isDark ? '#020617' : '#ffffff'}
                    emissive={color}
                    emissiveIntensity={isActive ? (isDark ? 0.3 : 0.15) : 0.02}
                    roughness={0.3}
                    metalness={isDark ? 0.9 : 0.1}
                />
            </mesh>

            {/* Outer Glowing Neon Ring */}
            <mesh ref={ringRef} position={[0, -0.99, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
                <ringGeometry args={[1.08, 1.22, 32]} />
                <meshBasicMaterial color={color} transparent opacity={isActive ? 0.95 : isDark ? 0.4 : 0.6} />
            </mesh>

            {/* Inner Cyber Ring */}
            <mesh ref={innerRingRef} position={[0, -0.98, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
                <ringGeometry args={[0.7, 0.8, 24]} />
                <meshBasicMaterial color={color} transparent opacity={isActive ? 0.75 : isDark ? 0.25 : 0.45} />
            </mesh>

            {/* Floating 3D Geometric Emblem */}
            <Float speed={isActive ? 2.5 : 1.5} rotationIntensity={0.3} floatIntensity={0.4}>
                <mesh ref={floatMeshRef} position={[0, -0.2, 0]} onClick={onClick}>
                    <octahedronGeometry args={[isActive ? 0.4 : 0.3, 0]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={isActive ? (isDark ? 0.8 : 0.45) : isDark ? 0.3 : 0.1}
                        wireframe
                    />
                </mesh>
            </Float>

            {/* Department Name Label (Only visible in overview mode, hidden when inspecting any podium) */}
            {!hasActiveBay && (
                <Html
                    center
                    position={[0, -0.65, 1.45]}
                    distanceFactor={13}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <div
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border whitespace-nowrap shadow-md transition-all ${
                            isActive ? 'scale-110 shadow-lg' : 'opacity-95'
                        }`}
                        style={{
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.94)',
                            borderColor: `${color}80`,
                            color: color,
                            boxShadow: `0 0 15px ${color}33`,
                        }}
                    >
                        {bay.name}
                    </div>
                </Html>
            )}
        </group>
    )
}

// ================================
// CAMERA INTERPOLATION CONTROLLER
// ================================

function CameraController({ activeBay }: { activeBay: BayId | null }) {
    const { camera } = useThree()

    useFrame(() => {
        let targetX = 0
        let targetY = 1.8
        let targetZ = 8.5
        let lookAtX = 0
        let lookAtY = 0
        let lookAtZ = 0

        if (activeBay) {
            const bay = GARAGE_BAYS.find((b) => b.id === activeBay)
            if (bay) {
                targetX = bay.position[0] * 0.7
                targetY = 1.3
                targetZ = bay.position[2] + 4.8
                lookAtX = bay.position[0]
                lookAtY = 0.5
                lookAtZ = bay.position[2]
            }
        }

        // Smooth camera lerp
        camera.position.x += (targetX - camera.position.x) * 0.05
        camera.position.y += (targetY - camera.position.y) * 0.05
        camera.position.z += (targetZ - camera.position.z) * 0.05
        camera.lookAt(lookAtX, lookAtY, lookAtZ)
    })

    return null
}

// ================================
// CYBER ENVIRONMENT (FLOOR & PARTICLES)
// ================================

function CyberEnvironment({ isDark }: { isDark: boolean }) {
    const gridColor = isDark ? '#1e293b' : '#cbd5e1'
    const centerColor = isDark ? '#3b82f6' : '#2563eb'

    return (
        <>
            <color attach="background" args={[isDark ? '#030712' : '#f8fafc']} />
            <fog attach="fog" args={[isDark ? '#030712' : '#f1f5f9', 8, 28]} />

            <gridHelper args={[28, 28, centerColor, gridColor]} position={[0, -1.25, 0]} />

            <mesh position={[0, -1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[36, 36]} />
                <meshStandardMaterial
                    color={isDark ? '#060a17' : '#ffffff'}
                    roughness={isDark ? 0.35 : 0.75}
                    metalness={isDark ? 0.65 : 0.05}
                />
            </mesh>

            <ambientLight intensity={isDark ? 0.45 : 0.85} />
            <pointLight position={[0, 6, 2]} intensity={isDark ? 1.6 : 1.1} color="#ffffff" />
            <directionalLight position={[6, 9, 6]} intensity={isDark ? 1.3 : 1.5} />
        </>
    )
}

// ================================
// INDIVIDUAL HOLOGRAPHIC CARD (IDENTICAL TO TEAM PAGE)
// ================================

interface HolographicGarageCardProps {
    member: TeamMember
    index: number
    isDark: boolean
    onOpenModal: (member: TeamMember) => void
}

function HolographicGarageCard({ member, index, isDark, onOpenModal }: HolographicGarageCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [imgError, setImgError] = useState(false)
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { stiffness: 150, damping: 15, mass: 0.5 }
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig)
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig)
    const foilX = useSpring(useTransform(mouseX, [-0.5, 0.5], [100, -100]), springConfig)
    const foilY = useSpring(useTransform(mouseY, [-0.5, 0.5], [100, -100]), springConfig)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouch || !cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        mouseX.set(x)
        mouseY.set(y)
    }, [isTouch, mouseX, mouseY])

    const handleMouseLeave = useCallback(() => {
        if (isTouch) return
        setIsHovered(false)
        mouseX.set(0)
        mouseY.set(0)
    }, [isTouch, mouseX, mouseY])

    return (
        <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="perspective-1000 flex-shrink-0 w-[240px] sm:w-[260px] md:w-[280px]"
        >
            <motion.div
                ref={cardRef}
                style={isTouch ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => !isTouch && setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onOpenModal(member)}
                className="relative cursor-pointer group"
            >
                <div
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300"
                    style={{
                        background: isDark
                            ? `linear-gradient(145deg, ${member.color}20, ${member.color}08, #0a0f1d)`
                            : `linear-gradient(145deg, ${member.color}15, ${member.color}05, #ffffff)`,
                        border: `1.5px solid ${member.color}${isHovered ? '99' : '40'}`,
                        boxShadow: isHovered
                            ? `0 25px 50px -12px ${member.color}45, 0 0 35px ${member.color}25, inset 0 1px 0 ${member.color}40`
                            : isDark
                            ? `0 10px 30px -10px rgba(0,0,0,0.5)`
                            : `0 10px 25px -8px rgba(0,0,0,0.12)`,
                    }}
                >
                    {/* Holographic Foil Overlay */}
                    <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                        style={{
                            background: `linear-gradient(115deg, transparent 20%, ${member.color}20 40%, ${member.color}40 50%, ${member.color}20 60%, transparent 80%)`,
                            backgroundSize: '200% 200%',
                            backgroundPosition: `${foilX}% ${foilY}%`,
                            mixBlendMode: 'overlay',
                        }}
                    />

                    {/* Scanlines */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20 z-10"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${
                                isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
                            } 2px, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} 4px)`,
                            animation: isHovered ? 'scanlines 8s linear infinite' : 'none',
                        }}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 z-20">
                        <div
                            className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider"
                            style={{
                                background: member.status === 'ACTIVE' ? '#34A85330' : '#FBBC0430',
                                color: member.status === 'ACTIVE' ? '#34A853' : '#FBBC04',
                                border: `1px solid ${member.status === 'ACTIVE' ? '#34A853' : '#FBBC04'}50`,
                            }}
                        >
                            {member.status}
                        </div>
                    </div>

                    {/* Avatar / Photo with Monogram Fallback */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {member.image && !imgError ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <motion.div
                                animate={isHovered ? { scale: 1.1, rotate: 4 } : { scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-display font-bold"
                                style={{
                                    backgroundColor: `${member.color}20`,
                                    color: member.color,
                                    border: `2px solid ${member.color}50`,
                                    boxShadow: `0 0 30px ${member.color}35`,
                                }}
                            >
                                {member.initial}
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom Info Gradient */}
                    <div
                        className="absolute bottom-0 left-0 right-0 p-4 z-20"
                        style={{
                            background: `linear-gradient(to top, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.82) 65%, transparent 100%)`,
                        }}
                    >
                        <div className="flex justify-between items-end">
                            <div className="flex-1 min-w-0 mr-2">
                                <p
                                    className="text-[10px] font-mono tracking-[0.3em] mb-1 truncate"
                                    style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                >
                                    // {member.codename}
                                </p>
                                <h4
                                    className="font-display text-base sm:text-lg leading-tight truncate text-white"
                                >
                                    {member.name}
                                </h4>
                                <p
                                    className="text-xs font-mono mt-0.5 truncate font-bold"
                                    style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                >
                                    {member.role}
                                </p>
                            </div>

                            {/* Contact icons & Right Arrow Dossier button */}
                            <div className="flex items-center gap-1.5 relative z-30" onClick={(e) => e.stopPropagation()}>
                                {member.linkedin && (
                                    <a
                                        href={member.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`${member.name} on LinkedIn`}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-[#0A66C2] transition-colors backdrop-blur-sm"
                                    >
                                        <Linkedin className="w-3.5 h-3.5 text-white/80 hover:text-white" />
                                    </a>
                                )}
                                {member.email && (
                                    <a
                                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(member.email)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Email ${member.name} via Gmail`}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-[#EA4335] transition-colors backdrop-blur-sm"
                                    >
                                        <Mail className="w-3.5 h-3.5 text-white/80 hover:text-white" />
                                    </a>
                                )}

                                {/* Minimal Right Arrow Button (no dossier text) */}
                                <button
                                    type="button"
                                    onClick={() => onOpenModal(member)}
                                    className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-all shadow-md hover:scale-110 active:scale-95"
                                    title={`View ${member.name}'s Dossier`}
                                    aria-label={`View ${member.name}'s Dossier`}
                                >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Corner decorations */}
                    <div
                        className="absolute top-0 left-0 w-7 h-7 pointer-events-none z-10"
                        style={{ borderTop: `2px solid ${member.color}60`, borderLeft: `2px solid ${member.color}60` }}
                    />
                    <div
                        className="absolute bottom-0 right-0 w-7 h-7 pointer-events-none z-10"
                        style={{ borderBottom: `2px solid ${member.color}60`, borderRight: `2px solid ${member.color}60` }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}

// ================================
// MAIN 3D GARAGE COMPONENT
// ================================

export function TeamGarage3D() {
    const [activeBay, setActiveBay] = useState<BayId | null>(null)
    const [pageIndex, setPageIndex] = useState(0)
    const { theme } = useTheme()
    const isDark = theme !== 'light'
    const { openModal } = useTeamStore()

    // Real dynamic members mapped to bays
    const garageMembersByBay = useMemo(() => getGarageMembersByBay(), [])

    const activeBayData = useMemo(() => {
        return GARAGE_BAYS.find((b) => b.id === activeBay) || null
    }, [activeBay])

    const activeMembers = useMemo(() => {
        if (!activeBay) return []
        return garageMembersByBay[activeBay] || []
    }, [activeBay, garageMembersByBay])

    // Reset pagination when active bay changes
    useEffect(() => {
        setPageIndex(0)
    }, [activeBay])

    // Dynamic color for active bay in current theme
    const activeColor = activeBayData ? getBayThemeColor(activeBayData.id, isDark) : '#4285F4'

    // Show 2 or 3 cards side-by-side:
    // If <= 3 members, show all. If > 3 members, paginate by 3.
    const pageSize = 3
    const totalPages = Math.ceil(activeMembers.length / pageSize)
    const displayedMembers = useMemo(() => {
        if (activeMembers.length <= 3) return activeMembers
        const start = pageIndex * pageSize
        return activeMembers.slice(start, start + pageSize)
    }, [activeMembers, pageIndex, pageSize])

    return (
        <div
            className={`relative w-full h-[85vh] md:h-screen overflow-hidden select-none transition-colors duration-300 ${
                isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
            }`}
        >
            {/* Top Command Header HUD */}
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p
                        className={`text-[10px] font-mono tracking-[0.3em] font-bold ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}
                    >
                        COMMAND DECK // HOLOGRAPHIC GARAGE
                    </p>
                </div>
                <h2
                    className={`text-2xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}
                >
                    CHAPTER <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>LEADS</span>
                </h2>
                <p className={`text-xs font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {activeBayData ? (
                        <>
                            INSPECTING //{' '}
                            <span style={{ color: activeColor }} className="font-bold">
                                {activeBayData.name} ({activeMembers.length} LEADS)
                            </span>
                        </>
                    ) : (
                        'CLICK A COMMAND PODIUM TO INSPECT OPERATIVES'
                    )}
                </p>
            </div>

            {/* Three.js Canvas */}
            <Canvas
                camera={{ position: [0, 1.8, 8.5], fov: 48 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: false }}
            >
                <Suspense fallback={null}>
                    <CyberEnvironment isDark={isDark} />
                    <CameraController activeBay={activeBay} />

                    {/* Render the 5 Bay Podiums in 3D */}
                    {GARAGE_BAYS.map((bay) => (
                        <CyberPodium
                            key={bay.id}
                            bay={bay}
                            isActive={activeBay === bay.id}
                            hasActiveBay={activeBay !== null}
                            isDark={isDark}
                            onClick={() => setActiveBay(activeBay === bay.id ? null : bay.id)}
                        />
                    ))}
                </Suspense>
            </Canvas>

            {/* ======================================================== */}
            {/* INDIVIDUAL HOLOGRAPHIC CARDS (MATCHING TEAM PAGE STYLE)   */}
            {/* ======================================================== */}
            <AnimatePresence>
                {activeBayData && displayedMembers.length > 0 && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 pointer-events-none">
                        {/* Subtle backdrop overlay for focus */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto cursor-pointer"
                            onClick={() => setActiveBay(null)}
                        />

                        {/* Top Controls Strip */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative z-10 mb-4 flex items-center justify-between gap-3 px-4 py-2 rounded-2xl backdrop-blur-xl border shadow-xl pointer-events-auto"
                            style={{
                                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                                borderColor: `${activeColor}60`,
                                boxShadow: `0 10px 30px -10px ${activeColor}33`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase"
                                    style={{
                                        backgroundColor: `${activeColor}20`,
                                        color: activeColor,
                                        border: `1px solid ${activeColor}50`,
                                    }}
                                >
                                    {activeBayData.name}
                                </span>
                                <span
                                    className={`text-[11px] font-mono font-bold ${
                                        isDark ? 'text-slate-300' : 'text-slate-700'
                                    }`}
                                >
                                    {activeMembers.length} LEADS
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeMembers.length > 3 && (
                                    <div className="flex items-center gap-1.5 mr-1">
                                        <span
                                            className={`text-[10px] font-mono ${
                                                isDark ? 'text-slate-400' : 'text-slate-500'
                                            }`}
                                        >
                                            {pageIndex * pageSize + 1}-
                                            {Math.min((pageIndex + 1) * pageSize, activeMembers.length)} OF{' '}
                                            {activeMembers.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setPageIndex((p) => (p > 0 ? p - 1 : totalPages - 1))
                                            }}
                                            className={`p-1 rounded-lg transition-colors ${
                                                isDark
                                                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                                            }`}
                                            title="Previous Operatives"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setPageIndex((p) => (p < totalPages - 1 ? p + 1 : 0))
                                            }}
                                            className={`p-1 rounded-lg transition-colors ${
                                                isDark
                                                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                                            }`}
                                            title="Next Operatives"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setActiveBay(null)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        isDark
                                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                                    }`}
                                    title="Close Inspector"
                                    aria-label="Close Inspector"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Individual Holographic Cards with 3D Tilt Physics */}
                        <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 md:gap-6 max-w-full overflow-x-auto p-2 pointer-events-auto scrollbar-none">
                            {displayedMembers.map((member, idx) => (
                                <HolographicGarageCard
                                    key={member.id}
                                    member={member}
                                    index={idx}
                                    isDark={isDark}
                                    onOpenModal={openModal}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* ======================================================== */}
            {/* FLOATING CYBER HUD DOCK AT BOTTOM (STRICTLY NO EMOJIS)    */}
            {/* ======================================================== */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-3xl">
                <div
                    className={`p-2 md:p-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl flex flex-wrap items-center justify-between gap-2 transition-colors duration-300 ${
                        isDark
                            ? 'bg-slate-900/90 border-slate-700/60'
                            : 'bg-white/95 border-slate-200/90'
                    }`}
                >
                    {/* Bay Switcher Buttons with clean Lucide SVG icons */}
                    <div className="flex flex-wrap items-center gap-1 md:gap-1.5 flex-1 min-w-0">
                        {GARAGE_BAYS.map((bay) => {
                            const isCurrent = activeBay === bay.id
                            const count = (garageMembersByBay[bay.id] || []).length
                            const bayColor = getBayThemeColor(bay.id, isDark)
                            return (
                                <button
                                    key={bay.id}
                                    type="button"
                                    onClick={() => setActiveBay(isCurrent ? null : bay.id)}
                                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                                        isCurrent
                                            ? isDark
                                                ? 'text-white shadow-lg'
                                                : 'text-slate-900 shadow-md'
                                            : isDark
                                            ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                    style={
                                        isCurrent
                                            ? {
                                                  backgroundColor: `${bayColor}26`,
                                                  border: `1px solid ${bayColor}`,
                                                  boxShadow: `0 0 15px ${bayColor}33`,
                                              }
                                            : { border: '1px solid transparent' }
                                    }
                                >
                                    {renderBayIcon(bay.iconType, 'w-3.5 h-3.5')}
                                    <span className="hidden sm:inline">{bay.name}</span>
                                    <span
                                        className="px-1.5 py-0.2 rounded-full text-[9px]"
                                        style={{ backgroundColor: `${bayColor}33`, color: bayColor }}
                                    >
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Reset Overview & Full Roster Navigation */}
                    <div className="flex items-center gap-2">
                        {activeBay && (
                            <button
                                type="button"
                                onClick={() => setActiveBay(null)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-1 border ${
                                    isDark
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
                                }`}
                                title="Return to Overview"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">OVERVIEW</span>
                            </button>
                        )}

                        <Link
                            to="/team"
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-1 shrink-0"
                        >
                            <span>ALL {TEAM_MEMBERS.length} OPERATIVES</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                <p
                    className={`text-[10px] font-mono text-center mt-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                >
                    CLICK ANY PODIUM OR DOCK TAB TO INSPECT LEADS // FULL DOSSIER ACCESSIBLE ON DEMAND
                </p>
            </div>

            <style>{`
                @keyframes scanlines { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    )
}

export default TeamGarage3D
