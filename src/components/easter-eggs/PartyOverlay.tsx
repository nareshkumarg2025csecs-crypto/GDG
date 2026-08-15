/**
 * PartyOverlay.tsx
 *
 * GDG-themed fireworks and ambient color wash.
 */

import { useEffect, useRef } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'

const GDG_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    color: string
    life: number
    size: number
}

export function PartyOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { partyMode, reducedMotion } = useEasterEggStore()

    useEffect(() => {
        if (!partyMode || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        let width = 0
        let height = 0
        let dpr = 1
        let particles: Particle[] = []
        let rafId = 0
        let running = !document.hidden
        let lastFrame = 0
        let lastFirework = 0

        const maxParticles = reducedMotion ? 80 : 180
        const targetFrameTime = reducedMotion ? 1000 / 18 : 1000 / 30
        const fireworkInterval = reducedMotion ? 1200 : 700

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            width = window.innerWidth
            height = window.innerHeight

            canvas.width = Math.floor(width * dpr)
            canvas.height = Math.floor(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const createFirework = (x: number, y: number) => {
            const color = GDG_COLORS[Math.floor(Math.random() * GDG_COLORS.length)]
            const burstCount = reducedMotion ? 18 : 34

            for (let i = 0; i < burstCount; i++) {
                if (particles.length >= maxParticles) break

                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * (reducedMotion ? 3.2 : 5.5) + 1.4
                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    life: 1,
                    size: Math.random() * 2.5 + 1.5,
                })
            }
        }

        const draw = (time: number) => {
            if (!running) return

            if (time - lastFrame < targetFrameTime) {
                rafId = window.requestAnimationFrame(draw)
                return
            }
            lastFrame = time

            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
            ctx.fillRect(0, 0, width, height)

            if (time - lastFirework > fireworkInterval) {
                createFirework(
                    Math.random() * width,
                    Math.random() * height * 0.65 + 40
                )
                lastFirework = time
            }

            particles = particles.filter((particle) => particle.life > 0.04)
            particles.forEach((particle) => {
                particle.x += particle.vx
                particle.y += particle.vy
                particle.vy += reducedMotion ? 0.04 : 0.08
                particle.life *= reducedMotion ? 0.95 : 0.93

                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
                ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 180)
                    .toString(16)
                    .padStart(2, '0')}`
                ctx.fill()
            })

            const discoColor = GDG_COLORS[Math.floor(time / 550) % GDG_COLORS.length]
            ctx.fillStyle = `${discoColor}${reducedMotion ? '08' : '10'}`
            ctx.fillRect(0, 0, width, height)

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
    }, [partyMode, reducedMotion])

    if (!partyMode) return null

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[9986] pointer-events-none mix-blend-screen opacity-90"
            data-no-leet
            data-easter-overlay="party"
        />
    )
}

export default PartyOverlay
