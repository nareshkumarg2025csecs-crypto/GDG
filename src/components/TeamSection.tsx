/**
 * TeamSection.tsx
 * 
 * Combined Team Section with:
 * 1. Redesigned 3D Holographic Command Garage (zero blur, zero overlapping, no emojis)
 * 2. Dedicated 2D Leads Showcase (Leads only, customizable via src/data/team.ts)
 * 3. Dedicated Department Details Display Section (like the Team details page)
 */

import React, { useState, useRef, useCallback, useEffect, lazy, Suspense, useMemo } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { TeamMember, TeamId, HOME_LEADS, TEAM_MEMBERS } from '@/data/team'
import { useTeamStore } from '@/store/teamStore'
import TeamModal from '@/components/team/TeamModal'
import { Link } from 'react-router-dom'
import {
    Linkedin,
    Mail,
    ArrowRight,
    Sparkles,
    Users,
    Shield,
    Terminal,
    Palette,
    Video,
    Layers,
} from 'lucide-react'

// Lazy load 3D component for performance
const TeamGarage3D = lazy(() => import('./TeamGarage3D'))

// ================================
// LEADS CATEGORY FILTER PILLS (NO EMOJIS)
// ================================

interface LeadCategory {
    id: 'all' | TeamId
    label: string
    color: string
}

const LEAD_CATEGORIES: LeadCategory[] = [
    { id: 'all', label: 'ALL LEADS', color: '#4285F4' },
    { id: 'leads', label: 'LEADERSHIP', color: '#4285F4' },
    { id: 'techops', label: 'TECH-OPS', color: '#4285F4' },
    { id: 'design', label: 'DESIGN', color: '#EA4335' },
    { id: 'media', label: 'MEDIA', color: '#FBBC04' },
    { id: 'logistics', label: 'OPERATIONS', color: '#34A853' },
]

// ================================
// HOLOGRAPHIC 2D CARD
// ================================

interface HolographicCardProps {
    member: TeamMember
    index: number
    onCardClick: (member: TeamMember) => void
}

function HolographicCard({ member, index, onCardClick }: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [imgError, setImgError] = useState(false)
    const [tilt, setTilt] = useState<{ rx: number; ry: number; fx: number; fy: number }>({ rx: 0, ry: 0, fx: 50, fy: 50 })
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouch || !cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setTilt({
            rx: -y * 14,
            ry: x * 14,
            fx: (x + 0.5) * 100,
            fy: (y + 0.5) * 100
        })
    }, [isTouch])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        setTilt({ rx: 0, ry: 0, fx: 50, fy: 50 })
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="perspective-1000"
        >
            <div
                ref={cardRef}
                style={{
                    transform: (!isTouch && isHovered)
                        ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
                        : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                    transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s ease-out',
                    transformStyle: 'preserve-3d',
                    willChange: isHovered ? 'transform' : 'auto'
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => {
                    if (!isTouch) setIsHovered(true)
                }}
                onMouseLeave={handleMouseLeave}
                onClick={() => onCardClick(member)}
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
                        color: 'var(--foreground)'
                    }}
                >
                    {/* Holographic Foil Overlay */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                        style={{
                            background: `linear-gradient(115deg, transparent 20%, ${member.color}15 40%, ${member.color}30 50%, ${member.color}15 60%, transparent 80%)`,
                            backgroundSize: '200% 200%',
                            backgroundPosition: `${tilt.fx}% ${tilt.fy}%`,
                            mixBlendMode: 'overlay',
                        }}
                    />

                    {/* Scanlines */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20 z-10"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${member.color === '#FBBC04' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)'} 2px, ${member.color === '#FBBC04' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)'} 4px)`,
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

                    {/* Avatar / Photo (Zero-Egress Local Asset with Monogram Fallback) */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {member.image && !imgError ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                loading="lazy"
                                decoding="async"
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
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
                        )}
                    </div>

                    {/* Bottom Info Gradient */}
                    <div
                        className="absolute bottom-0 left-0 right-0 p-4 z-20"
                        style={{
                            background: `linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.8) 60%, transparent 100%)`,
                        }}
                    >
                        <div className="flex justify-between items-end">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="text-[10px] font-mono tracking-[0.3em] mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                    // {member.codename}
                                </p>
                                <h4 className="font-display text-base sm:text-lg leading-tight break-words text-white" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    {member.name}
                                </h4>
                                <p className="text-xs font-mono mt-1 break-words" style={{ color: member.color, fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    {member.role}
                                </p>
                            </div>
                            <div className="flex gap-1.5 relative z-30" onClick={(e) => e.stopPropagation()}>
                                {member.linkedin ? (
                                    <a
                                        href={member.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`${member.name} on LinkedIn`}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-[#0A66C2] transition-colors backdrop-blur-sm group/icon"
                                    >
                                        <Linkedin className="w-3.5 h-3.5 text-white/80 group-hover/icon:text-white" />
                                    </a>
                                ) : (
                                    <span
                                        title="LinkedIn profile pending"
                                        className="p-1.5 rounded-full bg-white/5 opacity-30 cursor-not-allowed backdrop-blur-sm"
                                    >
                                        <Linkedin className="w-3.5 h-3.5 text-white/40" />
                                    </span>
                                )}
                                {member.email ? (
                                    <a
                                        href={`mailto:${member.email}`}
                                        title={`Email ${member.name}`}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-[#EA4335] transition-colors backdrop-blur-sm group/icon"
                                    >
                                        <Mail className="w-3.5 h-3.5 text-white/80 group-hover/icon:text-white" />
                                    </a>
                                ) : (
                                    <span
                                        title="Email pending"
                                        className="p-1.5 rounded-full bg-white/5 opacity-30 cursor-not-allowed backdrop-blur-sm"
                                    >
                                        <Mail className="w-3.5 h-3.5 text-white/40" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none z-10" style={{ borderTop: `2px solid ${member.color}50`, borderLeft: `2px solid ${member.color}50` }} />
                    <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none z-10" style={{ borderBottom: `2px solid ${member.color}50`, borderRight: `2px solid ${member.color}50` }} />
                </div>
            </div>
        </motion.div>
    )
}

// ================================
// 2D LEADS SHOWCASE & DEPARTMENT DETAILS VIEW
// ================================

interface TeamSection2DProps {
    onSwitchTo3D?: () => void
    showToggle?: boolean
}

function TeamSection2D({ onSwitchTo3D, showToggle = true }: TeamSection2DProps) {
    const [selectedCategory, setSelectedCategory] = useState<'all' | TeamId>('all')
    const { theme } = useTheme()
    const { openModal } = useTeamStore()

    // 2D View strictly shows HOME_LEADS as requested
    const filteredLeads = useMemo(() => {
        if (selectedCategory === 'all') return HOME_LEADS
        return HOME_LEADS.filter((m) => m.team === selectedCategory)
    }, [selectedCategory])

    return (
        <div className="py-20 md:py-32 relative overflow-hidden bg-background transition-colors duration-300">
            {/* View toggle in Top Right */}
            {showToggle && onSwitchTo3D && (
                <div
                    className="absolute top-6 right-6 z-30 flex items-center gap-1 rounded-xl p-1 backdrop-blur-sm"
                    style={{
                        backgroundColor: 'rgb(var(--card-bg))',
                        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(31,31,31,0.15)'}`,
                    }}
                >
                    <button
                        type="button"
                        aria-label="Switch to 3D Garage view"
                        onClick={onSwitchTo3D}
                        className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        3D GARAGE
                    </button>
                    <button
                        type="button"
                        aria-label="Switch to 2D Cards view"
                        aria-current="true"
                        className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    >
                        2D LEADS
                    </button>
                </div>
            )}

            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* ======================================================== */}
                {/* SECTION 1: CHAPTER LEADS SHOWCASE (LEADS ONLY)           */}
                {/* ======================================================== */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-8 md:mb-12"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-blue-500 font-bold">
                            LEADERSHIP // CORE OPERATIVES
                        </p>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-3 tracking-tight">
                        CHAPTER <span className="text-blue-500">LEADS</span>
                    </h2>
                    <p className="text-muted-foreground font-mono text-xs md:text-sm max-w-xl">
                        Meet the student leaders driving engineering, design, operations, and media at Google Developer Groups on Campus.
                    </p>
                </motion.div>

                {/* Filter Pills for Lead Categories (Strictly NO Emojis) */}
                <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-border/60">
                    {LEAD_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id
                        const count = cat.id === 'all'
                            ? HOME_LEADS.length
                            : HOME_LEADS.filter((m) => m.team === cat.id).length
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <span>{cat.label}</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Grid of Leads */}
                <motion.div
                    key={`leads-grid-${selectedCategory}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-20"
                >
                    {filteredLeads.map((member, index) => (
                        <HolographicCard
                            key={member.id}
                            member={member}
                            index={index}
                            onCardClick={(m) => openModal(m)}
                        />
                    ))}
                </motion.div>


                {/* ======================================================== */}
                {/* SECTION 3: CALL TO ACTION - VIEW ALL OPERATIVES          */}
                {/* ======================================================== */}
                <div className="p-6 sm:p-8 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-foreground text-base sm:text-lg">
                                Meet Our Complete Team
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Explore all {TEAM_MEMBERS.length} members across Tech-Ops, Web, AI, Design, Media, and Operations.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/team"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white font-mono text-xs font-bold transition-all shadow-lg hover:shadow-google-blue/25 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
                    >
                        <span>VIEW ALL {TEAM_MEMBERS.length} OPERATIVES</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes scanlines { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    )
}

// ================================
// MAIN COMPONENT WITH TOGGLE
// ================================

export default function TeamSection() {
    const [view, setView] = useState<'3d' | '2d'>('2d')
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    )

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Force 2D on mobile devices
    const actualView = isMobile ? '2d' : view

    const { theme } = useTheme()
    const isDark = theme !== 'light'

    return (
        <section id="team" className="relative">
            {/* View toggle on Desktop */}
            {!isMobile && (
                <div
                    className="absolute top-6 right-6 z-30 flex items-center gap-1 rounded-xl p-1 backdrop-blur-md transition-colors"
                    style={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)',
                        boxShadow: isDark
                            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                            : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <button
                        type="button"
                        aria-label="Switch to 3D Garage view"
                        aria-pressed={actualView === '3d'}
                        onClick={() => setView('3d')}
                        className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-300 ${
                            actualView === '3d'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : isDark
                                ? 'text-slate-400 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        3D GARAGE
                    </button>
                    <button
                        type="button"
                        aria-label="Switch to 2D Leads view"
                        aria-pressed={actualView === '2d'}
                        onClick={() => setView('2d')}
                        className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-300 ${
                            actualView === '2d'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : isDark
                                ? 'text-slate-400 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        2D LEADS
                    </button>
                </div>
            )}

            {actualView === '2d' ? (
                <TeamSection2D onSwitchTo3D={() => setView('3d')} showToggle={false} />
            ) : (
                <Suspense
                    fallback={
                        <div className="h-[80vh] bg-slate-950 flex items-center justify-center">
                            <div className="flex items-center gap-2 font-mono text-xs text-blue-400">
                                <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                                <span>LOADING COMMAND GARAGE...</span>
                            </div>
                        </div>
                    }
                >
                    <TeamGarage3D />
                </Suspense>
            )}

            {/* Global Team Modal for Dossier Bio and Working Links */}
            <TeamModal />
        </section>
    )
}
