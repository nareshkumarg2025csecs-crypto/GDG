/**
 * TeamPage.tsx
 * 
 * Hierarchical Team Page with horizontal scroll animations
 * Similar to EventsHorizontal.tsx but with alternating scroll directions per team
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Linkedin, Mail } from 'lucide-react'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

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

interface TeamSection {
    id: 'leads' | 'techops' | 'design' | 'media' | 'logistics'
    name: string
    label: string
    color: string
    description: string
    scrollDirection: 'left-to-right' | 'right-to-left'
}

const teamSections: TeamSection[] = [
    { id: 'leads', name: 'LEADS', label: '// LEADERSHIP', color: '#9E9E9E', description: 'GDG on Campus leadership team', scrollDirection: 'left-to-right' },
    { id: 'logistics', name: 'LOGISTICS', label: '// OPERATIONS', color: '#34A853', description: 'Event planning & coordination', scrollDirection: 'left-to-right' },
    { id: 'media', name: 'MEDIA', label: '// CONTENT OPS', color: '#FBBC04', description: 'Photography, video & social', scrollDirection: 'right-to-left' },
    { id: 'design', name: 'DESIGN', label: '// VISUAL SYSTEMS', color: '#EA4335', description: 'UI/UX & brand identity specialists', scrollDirection: 'left-to-right' },
    { id: 'techops', name: 'TECH_OPS', label: '// TECHNICAL OPERATIONS', color: '#4285F4', description: 'Backend architects & code masters', scrollDirection: 'right-to-left' },
]

const teamMembers: TeamMember[] = [
    // LEADS
    { id: 0, name: 'Rakesh', role: 'Lead', codename: 'ORBIT', team: 'leads', color: '#9E9E9E', initial: 'R', status: 'ACTIVE' },
    { id: 1, name: 'Kishore', role: 'Co-lead', codename: 'PULSE', team: 'leads', color: '#9E9E9E', initial: 'K', status: 'ACTIVE' },

    // LOGISTICS EXECUTIVES
    { id: 2, name: 'Venkat', role: 'Logistics Lead', codename: 'NEXUS', team: 'logistics', color: '#34A853', initial: 'V', status: 'ACTIVE' },
    { id: 3, name: 'Aboorvan', role: 'Logistics Co-Lead', codename: 'RELAY', team: 'logistics', color: '#34A853', initial: 'A', status: 'ACTIVE' },

    // DESIGN EXECUTIVES
    { id: 4, name: 'Aishwarya A', role: 'Design Lead', codename: 'PRISM', team: 'design', color: '#EA4335', initial: 'A', status: 'ACTIVE' },
    { id: 5, name: 'Akshithaa H', role: 'Design Co-Lead', codename: 'PIXEL', team: 'design', color: '#EA4335', initial: 'A', status: 'ACTIVE' },

    // TECH-OPS EXECUTIVES
    { id: 6, name: 'Lokesh JR', role: 'Tech-Ops Lead', codename: 'CIPHER', team: 'techops', color: '#4285F4', initial: 'L', status: 'ACTIVE' },
    { id: 7, name: 'Prasanna Kumar P', role: 'Tech-Ops Co-Lead', codename: 'VECTOR', team: 'techops', color: '#4285F4', initial: 'P', status: 'ACTIVE' },

    // MEDIA EXECUTIVES
    { id: 8, name: 'Benin AF', role: 'Media Lead', codename: 'LENS', team: 'media', color: '#FBBC04', initial: 'B', status: 'ACTIVE' },
    { id: 9, name: 'Madhusha Harini', role: 'Media Co-Lead', codename: 'SIGNAL', team: 'media', color: '#FBBC04', initial: 'M', status: 'ACTIVE' },

    // LOGISTICS TEAM
    { id: 10, name: 'Rithika', role: 'Logistics Team', codename: 'SWIFT', team: 'logistics', color: '#34A853', initial: 'R', status: 'ACTIVE' },
    { id: 11, name: 'M H Haemanth', role: 'Logistics Team', codename: 'ANCHOR', team: 'logistics', color: '#34A853', initial: 'H', status: 'ACTIVE' },
    { id: 12, name: 'Zaara Lawrence', role: 'Logistics Team', codename: 'ZEPHYR', team: 'logistics', color: '#34A853', initial: 'Z', status: 'ACTIVE' },
    { id: 13, name: 'Sarvesh R', role: 'Logistics Team', codename: 'FORGE', team: 'logistics', color: '#34A853', initial: 'S', status: 'ACTIVE' },
    { id: 14, name: 'Steve Anderson', role: 'Logistics Team', codename: 'TITAN', team: 'logistics', color: '#34A853', initial: 'S', status: 'ACTIVE' },
    { id: 15, name: 'Haswaanth', role: 'Logistics Team', codename: 'NOVA', team: 'logistics', color: '#34A853', initial: 'H', status: 'ACTIVE' },
    { id: 16, name: 'Tejasvi', role: 'Logistics Team', codename: 'BLAZE', team: 'logistics', color: '#34A853', initial: 'T', status: 'ACTIVE' },
    { id: 17, name: 'Sanya', role: 'Logistics Team', codename: 'SPARK', team: 'logistics', color: '#34A853', initial: 'S', status: 'ACTIVE' },
    { id: 18, name: 'Yuvan', role: 'Logistics Team', codename: 'VORTEX', team: 'logistics', color: '#34A853', initial: 'Y', status: 'ACTIVE' },
    { id: 19, name: 'Sai Prashanth', role: 'Logistics Team', codename: 'APEX', team: 'logistics', color: '#34A853', initial: 'S', status: 'ACTIVE' },
    { id: 20, name: 'Praveen Keshavan P', role: 'Logistics Team', codename: 'SUMMIT', team: 'logistics', color: '#34A853', initial: 'P', status: 'ACTIVE' },
    { id: 21, name: 'Adhith', role: 'Logistics Team', codename: 'FLUX', team: 'logistics', color: '#34A853', initial: 'A', status: 'ACTIVE' },

    // MEDIA TEAM
    { id: 22, name: 'Kunal R', role: 'Media Team', codename: 'FRAME', team: 'media', color: '#FBBC04', initial: 'K', status: 'ACTIVE' },
    { id: 23, name: 'Reshmitha', role: 'Media Team', codename: 'VISTA', team: 'media', color: '#FBBC04', initial: 'R', status: 'ACTIVE' },
    { id: 24, name: 'Mohamed Aseel S', role: 'Media Team', codename: 'PULSE', team: 'media', color: '#FBBC04', initial: 'M', status: 'ACTIVE' },
    { id: 25, name: 'S. Arvind Harish Nataraj', role: 'Media Team', codename: 'SPECTRUM', team: 'media', color: '#FBBC04', initial: 'A', status: 'ACTIVE' },
    { id: 26, name: 'Nivedithaa S', role: 'Media-Content Team', codename: 'ECHO', team: 'media', color: '#FBBC04', initial: 'N', status: 'ACTIVE' },

    // DESIGN TEAM
    { id: 27, name: 'Sneha S', role: 'Design Team', codename: 'CANVAS', team: 'design', color: '#EA4335', initial: 'S', status: 'ACTIVE' },
    { id: 28, name: 'Kamalesh Ravichandran', role: 'Design Team', codename: 'CHROME', team: 'design', color: '#EA4335', initial: 'K', status: 'ACTIVE' },
    { id: 29, name: 'Adithtya K', role: 'Design Team', codename: 'SHADE', team: 'design', color: '#EA4335', initial: 'A', status: 'ACTIVE' },
    { id: 30, name: 'Aishwarya R', role: 'Design Team', codename: 'AURORA', team: 'design', color: '#EA4335', initial: 'A', status: 'ACTIVE' },
    { id: 31, name: 'Neha', role: 'Design Team', codename: 'PALETTE', team: 'design', color: '#EA4335', initial: 'N', status: 'ACTIVE' },
    { id: 32, name: 'Vithuna Senthilkumar', role: 'Design-Content Team', codename: 'GRADIENT', team: 'design', color: '#EA4335', initial: 'V', status: 'ACTIVE' },

    // TECH-OPS LEADS
    { id: 33, name: 'Visweswar Reddy', role: 'Web Dev Lead', codename: 'MATRIX', team: 'techops', color: '#4285F4', initial: 'V', status: 'ACTIVE' },
    { id: 34, name: 'Lokaa V', role: 'Web Dev Co-Lead', codename: 'QUANTUM', team: 'techops', color: '#4285F4', initial: 'L', status: 'ACTIVE' },
    { id: 35, name: 'Sanjana R', role: 'App Dev Lead', codename: 'PHOENIX', team: 'techops', color: '#4285F4', initial: 'S', status: 'ACTIVE' },
    { id: 36, name: 'Haresh R', role: 'AI Lead', codename: 'NEURAL', team: 'techops', color: '#4285F4', initial: 'H', status: 'ACTIVE' },
    { id: 37, name: 'Ishana Sabrish', role: 'AI Co-Lead', codename: 'LOGIC', team: 'techops', color: '#4285F4', initial: 'I', status: 'ACTIVE' },
    { id: 38, name: 'Deepesh O', role: 'IOT Lead', codename: 'CIRCUIT', team: 'techops', color: '#4285F4', initial: 'D', status: 'ACTIVE' },

    // TECH-OPS ASSOCIATES
    { id: 39, name: 'Roshan RP', role: 'Tech-Ops Team', codename: 'BINARY', team: 'techops', color: '#4285F4', initial: 'R', status: 'ACTIVE' },
    { id: 40, name: 'Prajan B', role: 'Tech-Ops Team', codename: 'HELIX', team: 'techops', color: '#4285F4', initial: 'P', status: 'ACTIVE' },
    { id: 41, name: 'Sanjay Kishore', role: 'Tech-Ops Team', codename: 'BYTE', team: 'techops', color: '#4285F4', initial: 'S', status: 'ACTIVE' },
    { id: 42, name: 'Lokeshwaraprasad', role: 'Tech-Ops Team', codename: 'STREAM', team: 'techops', color: '#4285F4', initial: 'L', status: 'ACTIVE' },
    { id: 43, name: 'Mohith', role: 'Tech-Ops Team', codename: 'NODE', team: 'techops', color: '#4285F4', initial: 'M', status: 'ACTIVE' },
    { id: 44, name: 'A R Saran Raj', role: 'Tech-Ops Team', codename: 'CORE', team: 'techops', color: '#4285F4', initial: 'S', status: 'ACTIVE' },
    { id: 45, name: 'Gokul Ranjan', role: 'Tech-Ops Team', codename: 'STACK', team: 'techops', color: '#4285F4', initial: 'G', status: 'ACTIVE' },
    { id: 46, name: 'Harish S', role: 'Tech-Ops Team', codename: 'MESH', team: 'techops', color: '#4285F4', initial: 'H', status: 'ACTIVE' },
    { id: 47, name: 'Prathyush', role: 'Tech-Ops Team', codename: 'SYNC', team: 'techops', color: '#4285F4', initial: 'P', status: 'ACTIVE' },
    { id: 48, name: 'Sibhinandhan', role: 'Tech-Ops Team', codename: 'GRID', team: 'techops', color: '#4285F4', initial: 'S', status: 'ACTIVE' },
]

// ================================
// HOLOGRAPHIC CARD COMPONENT
// ================================

interface HolographicCardProps {
    member: TeamMember
    index: number
}

function HolographicCard({ member, index }: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const { theme } = useTheme()

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
            className="perspective-1000 flex-shrink-0 w-[280px] md:w-[320px] mx-3"
            data-physics
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
                        color: 'var(--foreground)'
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
                        <div className="flex justify-between items-end">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="text-[10px] font-mono tracking-[0.3em] mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: member.color, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>// {member.codename}</p>
                                <h4 className="font-display text-lg leading-tight break-words" style={{ color: 'rgb(var(--foreground))', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{member.name}</h4>
                                <p className="text-xs font-mono mt-1 break-words" style={{ color: member.color, fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{member.role}</p>
                            </div>
                            <div className="flex gap-2">
                                <a href="#" className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm group/icon">
                                    <Linkedin className="w-3 h-3 text-white/70 group-hover/icon:text-white" />
                                </a>
                                <a href="#" className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm group/icon">
                                    <Mail className="w-3 h-3 text-white/70 group-hover/icon:text-white" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8" style={{ borderTop: `2px solid ${member.color}50`, borderLeft: `2px solid ${member.color}50` }} />
                    <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderBottom: `2px solid ${member.color}50`, borderRight: `2px solid ${member.color}50` }} />
                </div>
            </motion.div>
        </motion.div>
    )
}

// ================================
// TEAM SECTION (HORIZONTAL SCROLL)
// ================================

interface TeamSectionHorizontalProps {
    section: TeamSection
    members: TeamMember[]
}

function TeamSectionHorizontal({ section, members }: TeamSectionHorizontalProps) {
    const containerRef = useRef<HTMLElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()

    useEffect(() => {
        const container = containerRef.current
        const track = trackRef.current
        const progress = progressRef.current

        if (!container || !track || !progress) return

        const isRightToLeft = section.scrollDirection === 'right-to-left'

        // Calculate scroll distance
        const getScrollDistance = () => {
            const trackWidth = track.scrollWidth
            const viewportWidth = window.innerWidth
            return -(trackWidth - viewportWidth)
        }

        // Set initial position for right-to-left
        if (isRightToLeft) {
            gsap.set(track, { x: getScrollDistance })
        }

        // Create horizontal scroll animation
        const scrollTween = gsap.to(track, {
            x: isRightToLeft ? 0 : getScrollDistance,
            ease: 'none',
            scrollTrigger: {
                trigger: container,
                pin: true,
                scrub: 1,
                // Use absolute distance for duration to maintain consistent speed
                // 1:1 ratio (1px vertical scroll = 1px horizontal movement)
                end: () => "+=" + Math.abs(getScrollDistance()),
                invalidateOnRefresh: true,
            },
        })

        // Animate progress bar
        gsap.to(progress, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: container,
                start: 'top top',
                end: () => "+=3000",
                scrub: 1,
            },
        })

        // Cleanup
        return () => {
            scrollTween.kill()
            ScrollTrigger.getAll().forEach(st => st.kill())
        }
    }, [section.scrollDirection])

    return (
        <section
            ref={containerRef}
            className="relative bg-background overflow-hidden transition-colors duration-300"
        >
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgb(var(--foreground)) 1px, transparent 1px),
                        linear-gradient(90deg, rgb(var(--foreground)) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Ambient glow - Dark mode only */}
            {theme === 'dark' && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
                    style={{ background: `radial-gradient(circle, ${section.color}, transparent)` }}
                />
            )}

            {/* Main container */}
            <div className="h-screen flex flex-col justify-center">
                {/* Header */}
                <div className="absolute top-16 left-0 right-0 z-20 px-8 md:px-16">
                    <p
                        className="text-xs uppercase tracking-[0.4em] font-semibold mb-2"
                        style={{
                            color: section.color,
                            textShadow: theme === 'light' ? 'none' : `0 0 20px ${section.color}50`
                        }}
                    >
                        {section.label}
                    </p>
                    <h2 className="text-5xl md:text-7xl font-display text-[rgb(var(--foreground))] transition-colors duration-300">
                        {section.name}
                    </h2>
                    <p className="text-[rgb(var(--foreground))]/40 text-sm mt-2">
                        {section.description}
                    </p>
                </div>

                {/* Horizontal track */}
                <div
                    ref={trackRef}
                    className={`flex items-center pt-24 ${section.scrollDirection === 'left-to-right' ? 'pl-8 md:pl-16' : 'pr-8 md:pr-16'}`}
                >
                    {/* Start spacer for right-to-left */}
                    {section.scrollDirection === 'right-to-left' && (
                        <div className="flex-shrink-0 w-[200px] md:w-[400px]" />
                    )}

                    {/* Team member cards */}
                    {members.map((member, index) => (
                        <HolographicCard key={member.id} member={member} index={index} />
                    ))}

                    {/* End spacer for left-to-right */}
                    {section.scrollDirection === 'left-to-right' && (
                        <div className="flex-shrink-0 w-[200px] md:w-[400px]" />
                    )}
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-8 left-8 right-8 md:left-16 md:right-16 z-20">
                    <div className={`h-1 rounded-full overflow-hidden ${theme === 'light' ? 'bg-black/10' : 'bg-white/10'}`}>
                        <div
                            ref={progressRef}
                            className={`h-full rounded-full ${section.scrollDirection === 'right-to-left' ? 'origin-right' : 'origin-left'}`}
                            style={{
                                transform: 'scaleX(0)',
                                background: section.color,
                            }}
                        />
                    </div>
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

    // Separate leads from other teams
    const leadsMembers = teamMembers.filter(m => m.team === 'leads')
    const otherSections = teamSections.filter(s => s.id !== 'leads')

    // Refresh ScrollTrigger on mount to ensure correct pinning positions
    useEffect(() => {
        const timer = setTimeout(() => {
            ScrollTrigger.refresh()
        }, 100) // Small delay to ensure DOM is ready
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <Header />

            {/* Hero Section */}
            <section className="py-20 md:py-32 relative overflow-hidden bg-background transition-colors duration-300">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgb(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} />

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12 md:mb-16 text-center">
                        <div className="flex items-center gap-3 mb-4 justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-red-500/80">RESTRICTED ACCESS // CLEARANCE LEVEL: CORE</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-[rgb(var(--foreground))] mb-2 transition-colors duration-300">
                            CORE <span style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : '#4285F4', textShadow: theme === 'light' ? 'none' : `0 0 40px #4285F460` }}>TEAM</span>
                        </h1>
                        <p className="text-[rgb(var(--foreground))]/30 font-mono text-xs md:text-sm transition-colors duration-300">SELECTED // {teamMembers.length} OPERATIVES ASSIGNED</p>
                    </motion.div>
                </div>
            </section>

            {/* LEADS Section (Static) */}
            <section className="py-16 relative bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="mb-8">
                        <p className="text-xs uppercase tracking-[0.4em] font-semibold mb-2" style={{
                            color: '#9E9E9E',
                            textShadow: theme === 'light' ? 'none' : '0 0 20px #9E9E9E50'
                        }}>
                            // LEADERSHIP
                        </p>
                        <h2 className="text-4xl md:text-6xl font-display text-[rgb(var(--foreground))]">
                            GDG on Campus leadership team
                        </h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        {leadsMembers.map((member, index) => (
                            <HolographicCard key={member.id} member={member} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Sections with horizontal scroll */}
            {otherSections.map(section => {
                const members = teamMembers.filter(m => m.team === section.id)
                // Reverse items for right-to-left so the first items (Leads) appear on the right (start position)
                const displayedMembers = section.scrollDirection === 'right-to-left' ? [...members].reverse() : members

                return members.length > 0 ? (
                    <TeamSectionHorizontal key={section.id} section={section} members={displayedMembers} />
                ) : null
            })}

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
