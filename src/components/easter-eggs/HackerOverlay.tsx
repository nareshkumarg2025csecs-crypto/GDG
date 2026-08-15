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
            className="fixed inset-0 z-[9993] bg-black/25 pointer-events-none font-mono text-[10px] sm:text-xs"
            data-no-leet
            data-easter-overlay="hacker"
        >
            <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#34A853 1px, transparent 1px), linear-gradient(90deg, #34A853 1px, transparent 1px)',
                    backgroundSize: '56px 56px',
                }}
            />

            <div
                ref={scrollRef}
                className="absolute bottom-10 right-6 sm:right-10 w-[280px] h-44 overflow-hidden bg-black/82 border border-[#34A853]/40 p-3 text-[#8DFFAA] shadow-2xl shadow-[#34A853]/10"
            >
                <div className="text-[8px] opacity-50 mb-2 tracking-[0.2em]">SYSTEM_LOG_FEED v0.5.1</div>
                {logs.map((log, i) => (
                    <div key={`${log}-${i}`} className="mb-1 opacity-90">
                        {log}
                    </div>
                ))}
            </div>

            {!reducedMotion && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#34A853]/25 shadow-[0_0_12px_#34A853] animate-hacker-scan" />
            )}

            <div className="absolute top-10 left-8 sm:left-10 p-4 border-l-2 border-t-2 border-[#4285F4]/45">
                <div className="text-[#EA4335] animate-pulse">REC ●</div>
                <div className="text-[#4285F4]/80 text-[8px] tracking-[0.2em]">SAT_LINK: UP</div>
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
