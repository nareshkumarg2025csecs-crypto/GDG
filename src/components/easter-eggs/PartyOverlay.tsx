/**
 * PartyOverlay.tsx
 *
 * Celebratory Google confetti rain and festive ambient party wash.
 * Zero fireworks - pure fluttering celebratory confetti flakes!
 */

import { useEffect, useRef } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'
import { ENABLE_PARTY_MODE } from '@/config/featureFlags'

const GDG_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#A855F7', '#FF3D00']

interface ConfettiPiece {
    x: number
    y: number
    vx: number
    vy: number
    w: number
    h: number
    color: string
    rotation: number
    rotationSpeed: number
    wobble: number
    wobbleSpeed: number
}

export function PartyOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { partyMode, reducedMotion } = useEasterEggStore()
    const isPartyActive = ENABLE_PARTY_MODE || partyMode

    useEffect(() => {
        if (!isPartyActive || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        let width = 0
        let height = 0
        let dpr = 1
        let confetti: ConfettiPiece[] = []
        let rafId = 0
        let running = !document.hidden
        let lastFrame = 0

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        const confettiCount = reducedMotion ? 20 : isMobile ? 32 : 65
        const targetFrameTime = reducedMotion ? 1000 / 20 : isMobile ? 1000 / 30 : 1000 / 45

        const resize = () => {
            dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
            width = window.innerWidth
            height = window.innerHeight

            canvas.width = Math.floor(width * dpr)
            canvas.height = Math.floor(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            // Initialize or adjust confetti pieces across the screen
            if (confetti.length === 0) {
                confetti = Array.from({ length: confettiCount }, () => ({
                    x: Math.random() * width,
                    y: Math.random() * height - height,
                    vx: (Math.random() - 0.5) * 1.8,
                    vy: Math.random() * 2.2 + 1.4,
                    w: Math.random() * 9 + 6,
                    h: Math.random() * 6 + 4,
                    color: GDG_COLORS[Math.floor(Math.random() * GDG_COLORS.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.08,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: Math.random() * 0.06 + 0.03
                }))
            }
        }

        const draw = (time: number) => {
            if (!running) return

            if (time - lastFrame < targetFrameTime) {
                rafId = window.requestAnimationFrame(draw)
                return
            }
            lastFrame = time

            // Clear completely for 100% transparent matrix-style background without any darks
            ctx.clearRect(0, 0, width, height)

            // Update & Render Fluttering Confetti Pieces
            for (let i = 0; i < confetti.length; i++) {
                const c = confetti[i]
                c.y += c.vy
                c.x += c.vx + Math.sin(c.wobble) * 0.9
                c.wobble += c.wobbleSpeed
                c.rotation += c.rotationSpeed

                if (c.y > height + 20) {
                    c.y = -20
                    c.x = Math.random() * width
                    c.color = GDG_COLORS[Math.floor(Math.random() * GDG_COLORS.length)]
                }
                if (c.x > width + 20) c.x = -10
                if (c.x < -20) c.x = width + 10

                ctx.save()
                ctx.translate(c.x, c.y)
                ctx.rotate(c.rotation)
                // 3D-like flip effect using cosine scale
                const scaleY = Math.cos(c.wobble)
                ctx.scale(1, scaleY)
                ctx.fillStyle = c.color
                ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
                ctx.restore()
            }

            rafId = window.requestAnimationFrame(draw)
        }

        const handleVisibilityChange = () => {
            running = !document.hidden
            if (running && !rafId) {
                lastFrame = 0
                rafId = window.requestAnimationFrame(draw)
            }
            if (!running && rafId) {
                window.cancelAnimationFrame(rafId)
                rafId = 0
            }
        }

        resize()
        window.addEventListener('resize', resize)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        if (running) {
            rafId = window.requestAnimationFrame(draw)
        }

        return () => {
            running = false
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (rafId) {
                window.cancelAnimationFrame(rafId)
            }
        }
    }, [isPartyActive, reducedMotion])

    if (!isPartyActive) return null

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[9986] pointer-events-none opacity-95"
            data-no-leet
            data-easter-overlay="party"
        />
    )
}

export default PartyOverlay
