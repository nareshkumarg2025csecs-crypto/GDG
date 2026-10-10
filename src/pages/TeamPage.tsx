/**
 * TeamPage.tsx
 * 
 * Hierarchical Team Page with smooth horizontal interactive carousels.
 * Supports fluid mouse grab-and-drag, arrow controls, native mobile touch swipe,
 * natural top-to-bottom and bottom-to-top vertical page navigation, and quick team jump navigation.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Linkedin, Mail, ArrowLeft, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react'
import {
    TeamMember,
    TeamSection,
    TEAM_MEMBERS as teamMembers,
    TEAM_SECTIONS as teamSections,
} from '@/data/team'
import { useTeamStore } from '@/store/teamStore'
import TeamModal from '@/components/team/TeamModal'

// ================================
// HOLOGRAPHIC CARD COMPONENT
// ================================

interface HolographicCardProps {
    member: TeamMember
    index: number
    onCardClick?: () => void
}

function HolographicCard({ member, index, onCardClick }: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [imgError, setImgError] = useState(false)
    const [tilt, setTilt] = useState<{ rx: number; ry: number; fx: number; fy: number }>({ rx: 0, ry: 0, fx: 50, fy: 50 })
    const { theme } = useTheme()
    const { openModal } = useTeamStore()

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setTilt({
            rx: -y * 12,
            ry: x * 12,
            fx: (x + 0.5) * 100,
            fy: (y + 0.5) * 100
        })
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        setTilt({ rx: 0, ry: 0, fx: 50, fy: 50 })
    }, [])

    const handleClick = () => {
        if (onCardClick) {
            onCardClick()
        } else {
            openModal(member)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: Math.min(index * 0.03, 0.25), duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="perspective-1000 flex-shrink-0 w-[260px] sm:w-[280px] md:w-[320px] mx-2.5 sm:mx-3 select-none"
            data-physics
        >
            <div
                ref={cardRef}
                style={{
                    transform: isHovered
                        ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
                        : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                    transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s ease-out',
                    transformStyle: 'preserve-3d',
                    willChange: isHovered ? 'transform' : 'auto'
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${member.name}`}
                className="relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
                <div
                    className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden transition-colors duration-300"
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

                    {/* Avatar / Member Photo */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                        {member.image && !imgError ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                loading="lazy"
                                decoding="async"
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <motion.div
                                animate={isHovered ? { scale: 1.08, rotate: 3 } : { scale: 1, rotate: 0 }}
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
                        className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-auto"
                        style={{
                            background: `linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.8) 60%, transparent 100%)`,
                        }}
                    >
                        <div className="flex justify-between items-end">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="text-[10px] font-mono tracking-[0.3em] mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                    // {member.codename}
                                </p>
                                <h4 className="font-display text-lg leading-tight break-words text-white" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    {member.name}
                                </h4>
                                <p className="text-xs font-mono mt-1 break-words font-semibold" style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    {member.role}
                                </p>
                            </div>
                            <div className="flex gap-1.5 relative z-30" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
                                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(member.email)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Email ${member.name} via Gmail`}
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

                    {/* Corner decorations (shown for monogram cards) */}
                    {!member.image && (
                        <>
                            <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none z-10" style={{ borderTop: `2px solid ${member.color}50`, borderLeft: `2px solid ${member.color}50` }} />
                            <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none z-10" style={{ borderBottom: `2px solid ${member.color}50`, borderRight: `2px solid ${member.color}50` }} />
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ================================
// TEAM SECTION (HORIZONTAL INTERACTIVE CAROUSEL)
// ================================

interface TeamSectionHorizontalProps {
    section: TeamSection
    members: TeamMember[]
}

function TeamSectionHorizontal({ section, members }: TeamSectionHorizontalProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const hasDraggedRef = useRef(false)
    const startXRef = useRef(0)
    const startScrollLeftRef = useRef(0)
    const { theme } = useTheme()
    const { openModal } = useTeamStore()

    // Calculate scroll state & progress
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const maxScroll = el.scrollWidth - el.clientWidth
        if (maxScroll <= 8) {
            setCanScrollLeft(false)
            setCanScrollRight(false)
            setScrollProgress(100)
            return
        }
        setCanScrollLeft(el.scrollLeft > 12)
        setCanScrollRight(el.scrollLeft < maxScroll - 12)
        setScrollProgress(Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)))
    }, [])

    useEffect(() => {
        updateScrollState()
        window.addEventListener('resize', updateScrollState)
        return () => window.removeEventListener('resize', updateScrollState)
    }, [updateScrollState, members])

    // Arrow navigation
    const scrollByAmount = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const cardWidth = 340
        const shift = direction === 'left' ? -cardWidth * 2 : cardWidth * 2
        scrollRef.current.scrollBy({ left: shift, behavior: 'smooth' })
    }

    // Mouse grab-and-drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return
        setIsDragging(true)
        hasDraggedRef.current = false
        startXRef.current = e.pageX
        startScrollLeftRef.current = scrollRef.current.scrollLeft
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return
        const delta = e.pageX - startXRef.current
        if (Math.abs(delta) > 6) {
            hasDraggedRef.current = true
        }
        scrollRef.current.scrollLeft = startScrollLeftRef.current - delta
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleMouseLeave = () => {
        setIsDragging(false)
    }

    const handleCardClick = (member: TeamMember) => {
        if (hasDraggedRef.current) return
        openModal(member)
    }

    return (
        <section
            id={`team-${section.id}`}
            className="py-14 md:py-20 relative bg-background overflow-hidden border-b border-border/30 transition-colors duration-300"
        >
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                        linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Ambient glow - Dark mode only */}
            {theme === 'dark' && (
                <div
                    className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${section.color}, transparent)` }}
                />
            )}

            <div className="container mx-auto px-4 md:px-8 mb-6 md:mb-8 relative z-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: section.color }}
                            />
                            <p
                                className="text-xs uppercase tracking-[0.35em] font-mono font-semibold"
                                style={{
                                    color: section.color,
                                    textShadow: theme === 'light' ? 'none' : `0 0 20px ${section.color}50`
                                }}
                            >
                                {section.label}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground tracking-tight">
                                {section.name}
                            </h2>
                            <span
                                className="px-3 py-1 rounded-full text-xs font-mono font-semibold"
                                style={{
                                    backgroundColor: `${section.color}15`,
                                    color: section.color,
                                    border: `1px solid ${section.color}35`,
                                }}
                            >
                                {members.length} Operatives
                            </span>
                        </div>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-2xl">
                            {section.description}
                        </p>
                    </div>

                    {/* Desktop Navigation Arrows */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => scrollByAmount('left')}
                            disabled={!canScrollLeft}
                            aria-label={`Scroll ${section.name} left`}
                            className={`p-2.5 rounded-xl border transition-all duration-200 ${
                                canScrollLeft
                                    ? 'bg-card hover:bg-muted text-foreground border-border hover:scale-105 active:scale-95 shadow-sm'
                                    : 'opacity-30 cursor-not-allowed bg-muted/40 text-muted-foreground border-transparent'
                            }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByAmount('right')}
                            disabled={!canScrollRight}
                            aria-label={`Scroll ${section.name} right`}
                            className={`p-2.5 rounded-xl border transition-all duration-200 ${
                                canScrollRight
                                    ? 'bg-card hover:bg-muted text-foreground border-border hover:scale-105 active:scale-95 shadow-sm'
                                    : 'opacity-30 cursor-not-allowed bg-muted/40 text-muted-foreground border-transparent'
                            }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal Track Carousel */}
            <div className="relative group">
                {/* Left Gradient Fade */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
                        canScrollLeft ? 'opacity-100' : 'opacity-0'
                    }`}
                />

                {/* Right Gradient Fade */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
                        canScrollRight ? 'opacity-100' : 'opacity-0'
                    }`}
                />

                {/* Scrollable Track */}
                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className={`flex items-center overflow-x-auto py-4 px-4 sm:px-6 md:px-10 snap-x snap-mandatory md:snap-none select-none ${
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {members.map((member, index) => (
                        <div key={member.id} className="snap-start shrink-0">
                            <HolographicCard
                                member={member}
                                index={index}
                                onCardClick={() => handleCardClick(member)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Bar & Drag Indicator */}
            <div className="container mx-auto px-4 md:px-8 mt-4">
                <div className="flex items-center justify-between gap-4 text-xs font-mono text-muted-foreground mb-2">
                    <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: section.color }} />
                        <span className="hidden sm:inline">Drag or swipe horizontally from left to right to reveal all associates →</span>
                        <span className="sm:hidden">Swipe right to reveal associates →</span>
                    </span>
                    <span className="text-[11px] font-mono font-semibold">
                        {Math.round(scrollProgress)}%
                    </span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${theme === 'light' ? 'bg-black/10' : 'bg-white/10'}`}>
                    <div
                        className="h-full rounded-full transition-all duration-150 origin-left"
                        style={{
                            width: `${Math.max(6, scrollProgress)}%`,
                            backgroundColor: section.color,
                            boxShadow: `0 0 10px ${section.color}60`,
                        }}
                    />
                </div>
            </div>
        </section>
    )
}

// ================================
// MAIN TEAM PAGE
// ================================

export default function TeamPage() {
    const { theme } = useTheme()
    const [activeSection, setActiveSection] = useState('leads')
    const [showBackToTop, setShowBackToTop] = useState(false)

    // Separate leads from other teams
    const leadsMembers = teamMembers.filter(m => m.team === 'leads')
    const otherSections = teamSections.filter(s => s.id !== 'leads')

    // Navigation sections list
    const navSections = [
        { id: 'leads', name: 'Leadership', color: '#9E9E9E' },
        { id: 'logistics', name: 'Events & Ops', color: '#34A853' },
        { id: 'design', name: 'Design', color: '#EA4335' },
        { id: 'media', name: 'Media', color: '#FBBC04' },
        { id: 'techops', name: 'Tech Ops', color: '#4285F4' },
    ]

    // Scroll listener for active section indicator and Back to Top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400)

            const sectionIds = ['leads', 'logistics', 'design', 'media', 'techops']
            for (const id of sectionIds) {
                const el = document.getElementById(`team-${id}`)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top <= 240 && rect.bottom >= 240) {
                        setActiveSection(id)
                        break
                    }
                }
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTeam = (teamId: string) => {
        const el = document.getElementById(`team-${teamId}`)
        if (el) {
            const headerOffset = 90
            const elementPosition = el.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <Header />

            <main id="main-content">
                {/* Hero Section */}
                <section className="pt-28 pb-14 md:pt-36 md:pb-20 relative overflow-hidden bg-background transition-colors duration-300">
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        {/* Top Back Navigation */}
                        <div className="mb-6 md:mb-8">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition-all shadow-sm group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-google-blue" />
                                <span>Back to Home</span>
                            </Link>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-12 text-center">
                            <div className="flex items-center gap-3 mb-4 justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-red-500/80">RESTRICTED ACCESS // CLEARANCE LEVEL: CORE</p>
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground mb-2 transition-colors duration-300">
                                CORE <span style={{ color: theme === 'light' ? 'hsl(var(--foreground))' : '#4285F4', textShadow: theme === 'light' ? 'none' : `0 0 40px #4285F460` }}>TEAM</span>
                            </h1>
                            <p className="text-muted-foreground font-mono text-xs md:text-sm transition-colors duration-300">SELECTED // {teamMembers.length} OPERATIVES ASSIGNED</p>
                        </motion.div>

                        {/* Sticky / Quick Team Jump Navigation Pills */}
                        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 max-w-full scrollbar-none">
                            {navSections.map((item) => {
                                const isActive = activeSection === item.id
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => scrollToTeam(item.id)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 border ${
                                            isActive
                                                ? 'bg-card text-foreground shadow-sm scale-105'
                                                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 border-transparent'
                                        }`}
                                        style={{
                                            borderColor: isActive ? item.color : undefined,
                                        }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        {item.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* LEADS Section (Static Grid) */}
                <section id="team-leads" className="py-14 md:py-20 relative bg-background border-b border-border/30">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full animate-pulse bg-gray-400" />
                                <p className="text-xs uppercase tracking-[0.4em] font-mono font-semibold" style={{
                                    color: '#9E9E9E',
                                    textShadow: theme === 'light' ? 'none' : '0 0 20px #9E9E9E50'
                                }}>
                                    // LEADERSHIP
                                </p>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground">
                                GDG on Campus Leadership Team
                            </h2>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-2xl">
                                Core Chapter Direction, Strategy & Community Vision
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6">
                            {leadsMembers.map((member, index) => (
                                <HolographicCard key={member.id} member={member} index={index} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Sections with interactive horizontal scroll */}
                {otherSections.map(section => {
                    // Members in natural order: Leads on left, followed by associates
                    const members = teamMembers.filter(m => m.team === section.id)

                    return members.length > 0 ? (
                        <TeamSectionHorizontal key={section.id} section={section} members={members} />
                    ) : null
                })}
            </main>

            {/* Floating Back to Top Button */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 15 }}
                        transition={{ duration: 0.2 }}
                        onClick={scrollToTop}
                        aria-label="Scroll back to top"
                        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-card/90 hover:bg-card border border-border shadow-2xl backdrop-blur-md text-foreground transition-all duration-200 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <ArrowUp className="w-5 h-5 text-google-blue group-hover:-translate-y-0.5 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>

            <TeamModal />
            <Footer />

            <style>{`
                @keyframes scanlines { 
                    0% { background-position: 0 0; } 
                    100% { background-position: 0 100px; } 
                }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    )
}
