/**
 * TeamSection.tsx
 * 
 * Combined Team Section with 3D Garage and 2D Fallback
 * 
 * Features:
 * - 3D holographic garage by default (Part 1 & 2)
 * - 2D fallback cards for mobile or low-performance (Part 3)
 * - Toggle between views
 */

import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

// Lazy load 3D component for performance
const TeamGarage3D = lazy(() => import('./TeamGarage3D'))

// ================================
// TYPES & DATA
// ================================

interface TeamMember {
    id: number
    name: string
    role: string
    codename: string
    team: 'leads' | 'techops' | 'design' | 'media' | 'logistics'
    color: string
    initial: string
    status: 'ACTIVE' | 'STANDBY'
}

interface TeamBay {
    id: 'leads' | 'techops' | 'design' | 'media' | 'logistics'
    name: string
    label: string
    color: string
    description: string
}

const teamBays: TeamBay[] = [
    { id: 'leads', name: 'LEADS', label: '// LEADERSHIP', color: '#9E9E9E', description: 'GDG on Campus leadership team' },
    { id: 'techops', name: 'TECH_OPS', label: '// TECHNICAL OPERATIONS', color: '#4285F4', description: 'Backend architects & code masters' },
    { id: 'design', name: 'DESIGN', label: '// VISUAL SYSTEMS', color: '#EA4335', description: 'UI/UX & brand identity specialists' },
    { id: 'media', name: 'MEDIA', label: '// CONTENT OPS', color: '#FBBC04', description: 'Photography, video & social' },
    { id: 'logistics', name: 'LOGISTICS', label: '// OPERATIONS', color: '#34A853', description: 'Event planning & coordination' },
]

const teamMembers: TeamMember[] = [
    { id: 0, name: 'Rakesh', role: 'Lead', codename: 'ORBIT', team: 'leads', color: '#9E9E9E', initial: 'R', status: 'ACTIVE' },
    { id: 9, name: 'Kishore', role: 'Co-lead', codename: 'PULSE', team: 'leads', color: '#9E9E9E', initial: 'K', status: 'ACTIVE' },
    { id: 1, name: 'Lokesh JR', role: 'Tech-Ops Lead', codename: 'CIPHER', team: 'techops', color: '#4285F4', initial: 'L', status: 'ACTIVE' },
    { id: 2, name: 'Prasanna', role: 'Tech-Ops Co-Lead', codename: 'VECTOR', team: 'techops', color: '#4285F4', initial: 'P', status: 'STANDBY' },
    { id: 3, name: 'Aishwarya', role: 'Design Lead', codename: 'PRISM', team: 'design', color: '#EA4335', initial: 'A', status: 'ACTIVE' },
    { id: 4, name: 'Akshithaa', role: 'Design Co-Lead', codename: 'PIXEL', team: 'design', color: '#EA4335', initial: 'A', status: 'STANDBY' },
    { id: 5, name: 'Benin', role: 'Media Lead', codename: 'LENS', team: 'media', color: '#FBBC04', initial: 'B', status: 'ACTIVE' },
    { id: 6, name: 'Madhusha Harini', role: 'Media Co-Lead', codename: 'SIGNAL', team: 'media', color: '#FBBC04', initial: 'M', status: 'STANDBY' },
    { id: 7, name: 'Venkat', role: 'Logistics Lead', codename: 'NEXUS', team: 'logistics', color: '#34A853', initial: 'V', status: 'ACTIVE' },
    { id: 8, name: 'Aboorvan', role: 'Logistics Co-Lead', codename: 'RELAY', team: 'logistics', color: '#34A853', initial: 'A', status: 'STANDBY' },
]

// ================================
// HOLOGRAPHIC 2D CARD (PART 3)
// ================================

interface HolographicCardProps {
    member: TeamMember
    index: number
}

function HolographicCard({ member, index }: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { stiffness: 150, damping: 15, mass: 0.5 }
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig)
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig)
    const foilX = useSpring(useTransform(mouseX, [-0.5, 0.5], [100, -100]), springConfig)
    const foilY = useSpring(useTransform(mouseY, [-0.5, 0.5], [100, -100]), springConfig)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        mouseX.set(x)
        mouseY.set(y)
    }, [mouseX, mouseY])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        mouseX.set(0)
        mouseY.set(0)
    }, [mouseX, mouseY])

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="perspective-1000"
        >
            <motion.div
                ref={cardRef}
                style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                className="relative cursor-pointer group"
            >
                <div
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden transition-colors duration-300"
                    style={{
                        background: `linear-gradient(145deg, ${member.color}15, ${member.color}05, var(--card-bg))`,
                        border: `1px solid ${member.color}${isHovered ? '80' : '30'}`,
                        boxShadow: isHovered
                            ? `0 25px 50px -12px ${member.color}40, 0 0 40px ${member.color}20, inset 0 1px 0 ${member.color}30`
                            : `0 10px 30px -10px rgba(0,0,0,0.1)`,
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                        color: 'var(--foreground)' // Enforce text color inheritance
                    }}
                >
                    {/* Holographic Foil Overlay */}
                    <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                            background: `linear-gradient(115deg, transparent 20%, ${member.color}15 40%, ${member.color}30 50%, ${member.color}15 60%, transparent 80%)`,
                            backgroundSize: '200% 200%',
                            backgroundPosition: `${foilX}% ${foilY}%`,
                            mixBlendMode: 'overlay',
                        }}
                    />

                    {/* Scanlines */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${member.color === '#FBBC04' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)'} 2px, ${member.color === '#FBBC04' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)'} 4px)`,
                            animation: isHovered ? 'scanlines 8s linear infinite' : 'none',
                        }}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
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

                    {/* Avatar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-display"
                            style={{
                                backgroundColor: `${member.color}20`,
                                color: member.color,
                                border: `2px solid ${member.color}50`,
                                boxShadow: `0 0 30px ${member.color}40`,
                            }}
                        >
                            {member.initial}
                        </motion.div>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: `linear-gradient(to top, ${member.color}E6 0%, transparent 100%)` }}>
                        <p className="text-[10px] font-mono tracking-[0.3em] mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>// {member.codename}</p>
                        <h4 className="font-display text-lg leading-tight break-words" style={{ color: 'rgb(var(--foreground))', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{member.name}</h4>
                        <p className="text-xs font-mono mt-1 break-words" style={{ color: member.color, fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{member.role}</p>
                    </div>

                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8" style={{ borderTop: `2px solid ${member.color}50`, borderLeft: `2px solid ${member.color}50` }} />
                    <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderBottom: `2px solid ${member.color}50`, borderRight: `2px solid ${member.color}50` }} />
                </div>
            </motion.div>
        </motion.div >
    )
}

// ================================
// BAY TAB
// ================================

interface BayTabProps {
    bay: TeamBay
    isActive: boolean
    onClick: () => void
}

function BayTab({ bay, isActive, onClick }: BayTabProps) {
    return (
        <button
            onClick={onClick}
            className="relative px-4 md:px-6 py-3 text-left transition-all duration-300"
            style={{
                borderLeft: isActive ? `3px solid ${bay.color}` : '3px solid transparent',
                background: isActive ? `linear-gradient(90deg, ${bay.color}15, transparent)` : 'transparent',
            }}
        >
            {isActive && (
                <motion.div layoutId="activeBay" className="absolute inset-0" style={{ boxShadow: `inset 0 0 30px ${bay.color}20` }} />
            )}
            <p className="text-[10px] font-mono tracking-[0.2em] mb-0.5" style={{ color: bay.color }}>{bay.label}</p>
            <p className="font-display text-lg md:text-xl transition-colors duration-300" style={{ color: isActive ? 'rgb(var(--foreground))' : 'rgba(var(--foreground), 0.4)' }}>{bay.name}</p>
        </button>
    )
}

// ================================
// 2D FALLBACK VIEW
// ================================

interface TeamSection2DProps {
    onSwitchTo3D?: () => void
    showToggle?: boolean
}

function TeamSection2D({ onSwitchTo3D, showToggle = true }: TeamSection2DProps) {
    const [activeBay, setActiveBay] = useState<TeamBay['id']>('leads')
    const { theme } = useTheme()
    // Override activeBayData color for light mode to always be yellow-400 or related
    const rawActiveBayData = teamBays.find(b => b.id === activeBay)!

    const filteredMembers = teamMembers.filter(m => m.team === activeBay)

    // Create theme-aware active bay data
    const activeBayData = {
        ...rawActiveBayData,
        color: theme === 'light' ? 'rgba(var(--text-primary-raw), 0.8)' : rawActiveBayData.color
    }

    return (
        <section id="team" className="py-20 md:py-32 relative overflow-hidden bg-background transition-colors duration-300">
            {/* View toggle - Always visible */}
            {showToggle && onSwitchTo3D && (
                <div className="absolute top-6 right-6 z-30 flex items-center gap-1 rounded-lg p-1 backdrop-blur-sm" style={{ backgroundColor: 'rgb(var(--card-bg))', border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(31,31,31,0.15)'}` }}>
                    <button
                        onClick={onSwitchTo3D}
                        className="px-4 py-2 text-sm font-mono font-bold rounded-md transition-all duration-300"
                        style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(31,31,31,0.5)' }}
                    >
                        3D GARAGE
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-mono font-bold rounded-md transition-all duration-300 bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg shadow-green-500/30"
                    >
                        2D CARDS
                    </button>
                </div>
            )}

            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(rgb(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
                style={{ background: theme === 'light' ? 'radial-gradient(circle, rgba(var(--surface-300), 0.5), transparent)' : `radial-gradient(circle, ${activeBayData.color}, transparent)` }} />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 md:mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-red-500/80">RESTRICTED ACCESS // CLEARANCE LEVEL: CORE</p>
                    </div>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-display text-[rgb(var(--foreground))] mb-2 transition-colors duration-300">
                        CORE <span style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : rawActiveBayData.color, textShadow: theme === 'light' ? 'none' : `0 0 40px ${rawActiveBayData.color}60` }}>TEAM</span>
                    </h2>
                    <p className="text-[rgb(var(--foreground))]/30 font-mono text-xs md:text-sm transition-colors duration-300">SELECTED // {filteredMembers.length} OPERATIVES ASSIGNED</p>
                </motion.div>

                <div className="flex flex-wrap gap-2 md:gap-0 mb-10 md:mb-14 border-b pb-4 md:pb-0 md:border-b-0" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(31,31,31,0.1)' }}>
                    {teamBays.map(bay => (
                        <BayTab key={bay.id} bay={bay} isActive={activeBay === bay.id} onClick={() => setActiveBay(bay.id)} />
                    ))}
                </div>

                <motion.p key={activeBay} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[rgb(var(--foreground))]/50 text-sm mb-10 max-w-md transition-colors duration-300">{rawActiveBayData.description}</motion.p>

                <motion.div key={`grid-${activeBay}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredMembers.map((member, index) => (
                        <HolographicCard key={member.id} member={member} index={index} />
                    ))}
                </motion.div>

                <div className="mt-12 pt-6 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(31,31,31,0.1)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(31,31,31,0.35)' }}>
                        <div className="flex items-center gap-4 md:gap-6">
                            <span>SYSTEM: <span className={theme === 'light' ? 'text-green-600' : 'text-green-500'}>ONLINE</span></span>
                            <span>MEMBERS: <span style={{ color: 'rgb(var(--foreground))' }}>{teamMembers.length}</span></span>
                        </div>
                        <span className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'light' ? 'bg-green-600' : 'bg-green-500'}`} />
                            RECRUITMENT: <span className={theme === 'light' ? 'text-red-600' : 'text-red-500'}>CLOSED</span>
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scanlines { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
        </section>
    )
}

// ================================
// MAIN COMPONENT WITH TOGGLE
// ================================

export default function TeamSection() {
    const [view, setView] = useState<'3d' | '2d'>('3d')
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Force 2D on mobile (no toggle on mobile)
    const actualView = isMobile ? '2d' : view

    if (actualView === '2d') {
        return <TeamSection2D onSwitchTo3D={() => setView('3d')} showToggle={!isMobile} />
    }

    return (
        <section id="team" className="relative">
            {/* View toggle - VISIBLE */}
            <div className="absolute top-6 right-6 z-30 flex items-center gap-1 rounded-lg p-1 backdrop-blur-sm" style={{ backgroundColor: 'rgb(var(--card-bg))', border: `1px solid ${isMobile ? 'transparent' : 'rgba(var(--foreground), 0.15)'}` }}>
                <button
                    onClick={() => setView('3d')}
                    className={`px-4 py-2 text-sm font-mono font-bold rounded-md transition-all duration-300 ${view === '3d'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                        : ''}`}
                    style={view !== '3d' ? { color: 'rgba(var(--foreground), 0.5)' } : undefined}
                >
                    3D GARAGE
                </button>
                <button
                    onClick={() => setView('2d')}
                    className={`px-4 py-2 text-sm font-mono font-bold rounded-md transition-all duration-300 ${view === '2d'
                        ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg shadow-green-500/30'
                        : ''}`}
                    style={view !== '2d' ? { color: 'rgba(var(--foreground), 0.5)' } : undefined}
                >
                    2D CARDS
                </button>
            </div>

            <Suspense fallback={
                <div className="h-screen bg-background flex items-center justify-center">
                    <div className="flex gap-2">
                        {['#4285F4', '#EA4335', '#FBBC04', '#34A853'].map((color, i) => (
                            <div key={color} className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            }>
                <TeamGarage3D />
            </Suspense>
        </section>
    )
}
