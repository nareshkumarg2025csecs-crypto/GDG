/**
 * HackerOverlay.tsx
 *
 * Fake breach overlay with reduced-motion-aware pacing.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'

const HACKER_MESSAGES = [
    'INITIALIZING BREACH...',
    'BYPASSING FIREWALL...',
    'ACCESSING CORE DB...',
    'ENCRYPTING DATA...',
    'IP TRACKED: 192.168.1.104',
    'GEOLOCATING TARGET...',
    'SATELLITE LINK ESTABLISHED',
    'DOWNLOADING KERNEL...',
    'INJECTING MALWARE...',
    'ROOT ACCESS GRANTED',
    'OVERRIDING SYSTEM LOCKS...',
    'DELETING LOGS...',
    'STAY CALM, DR. FREEMAN',
    'WAKE UP, NEO...',
    'THE CAKE IS A LIE',
    'CONNECTION SECURE',
    'CLEANING TRACKS...',
]

export function HackerOverlay() {
    const { hackerMode, reducedMotion } = useEasterEggStore()
    const [logs, setLogs] = useState<string[]>([])
    const [isVisible, setIsVisible] = useState(() => (typeof document === 'undefined' ? true : !document.hidden))
    const scrollRef = useRef<HTMLDivElement>(null)

    const intervalMs = useMemo(() => (reducedMotion ? 850 : 420), [reducedMotion])

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    useEffect(() => {
        if (!hackerMode) {
            setLogs([])
            return
        }

        const interval = window.setInterval(() => {
            if (!isVisible) return

            setLogs((prev) => {
                const timestamp = new Date().toLocaleTimeString()
                const next = [
                    ...prev,
                    `[${timestamp}] ${HACKER_MESSAGES[Math.floor(Math.random() * HACKER_MESSAGES.length)]}`,
                ]

                if (next.length > (reducedMotion ? 14 : 24)) {
                    next.shift()
                }
                return next
            })
        }, intervalMs)

        return () => window.clearInterval(interval)
    }, [hackerMode, intervalMs, isVisible, reducedMotion])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    if (!hackerMode) return null

    return (
        <div
            className="fixed inset-0 z-[9993] bg-black/80 backdrop-blur-[1px] pointer-events-none font-mono text-[10px] sm:text-xs"
            data-no-leet
            data-easter-overlay="hacker"
        >
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#34A853 1px, transparent 1px), linear-gradient(90deg, #34A853 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div
                ref={scrollRef}
                className="absolute bottom-10 right-6 sm:right-10 w-[300px] sm:w-[380px] h-48 overflow-hidden bg-black/95 border-2 border-[#34A853] p-3.5 text-[#39FF14] shadow-[0_0_35px_rgba(52,168,83,0.35)]"
            >
                <div className="text-[9px] text-[#34A853] font-bold mb-2 tracking-[0.2em] flex items-center justify-between">
                    <span>SYSTEM_LOG_FEED v0.5.1</span>
                    <span className="text-[#EA4335] animate-pulse">BREACH ACTIVE</span>
                </div>
                {logs.map((log, i) => (
                    <div key={`${log}-${i}`} className="mb-1 font-mono tracking-tight text-[#8DFFAA]">
                        {log}
                    </div>
                ))}
            </div>

            {!reducedMotion && (
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[#34A853] shadow-[0_0_16px_#34A853] animate-hacker-scan" />
            )}

            <div className="absolute top-10 left-8 sm:left-10 p-4 border-l-2 border-t-2 border-[#4285F4] bg-black/70 backdrop-blur-xs">
                <div className="text-[#EA4335] font-bold text-xs animate-pulse">REC ● BREACH IN PROGRESS</div>
                <div className="text-[#4285F4] text-[9px] font-bold tracking-[0.2em] mt-1">SAT_LINK: ENCRYPTED OVERRIDE</div>
            </div>

            <style>{`
                @keyframes hacker-scan {
                    from { transform: translateY(0); }
                    to { transform: translateY(100vh); }
                }

                .animate-hacker-scan {
                    animation: hacker-scan 5s linear infinite;
                }
            `}</style>
        </div>
    )
}

export default HackerOverlay
