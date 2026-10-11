/**
 * VisualFXOverlay.tsx
 * 
 * Lightweight visual effects overlays:
 * - fireworks: Celebratory Google-colored fireworks particle bursts
 * - snow: Soft falling cyber snowflakes / ambient tech dust
 * - neon: High-contrast cyberpunk glow filter across page elements
 * 
 * Built with HTML5 Canvas for optimal 60fps performance on mobile & desktop.
 */

import React, { useEffect, useRef } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#A855F7', '#FF3D00']

export const VisualFXOverlay: React.FC = () => {
    const { fireworksMode, snowMode, neonMode, reducedMotion } = useEasterEggStore()
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Canvas effects loop (fireworks & snow)
    useEffect(() => {
        if (!fireworksMode && !snowMode) return
        if (reducedMotion) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationId: number
        let width = (canvas.width = window.innerWidth)
        let height = (canvas.height = window.innerHeight)

        const handleResize = () => {
            if (!canvas) return
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        // --- Fireworks Particle Engine ---
        interface FireworkParticle {
            x: number
            y: number
            prevX: number
            prevY: number
            vx: number
            vy: number
            alpha: number
            color: string
            size: number
            decay: number
        }
        let fireworkParticles: FireworkParticle[] = []
        let lastRocketTime = 0

        const createBurst = (originX: number, originY: number) => {
            const count = Math.min(64, Math.floor(window.innerWidth < 640 ? 40 : 70))
            const primaryColor = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)]
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * 6.5 + 2
                const color = Math.random() > 0.35 ? primaryColor : GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)]
                fireworkParticles.push({
                    x: originX,
                    y: originY,
                    prevX: originX,
                    prevY: originY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color,
                    size: Math.random() * 3.5 + 2.5,
                    decay: Math.random() * 0.012 + 0.012
                })
            }
        }

        // --- Snow Engine ---
        interface Snowflake {
            x: number
            y: number
            radius: number
            density: number
            alpha: number
        }
        const snowCount = Math.min(75, Math.floor(window.innerWidth < 640 ? 35 : 80))
        const flakes: Snowflake[] = []
        if (snowMode) {
            for (let i = 0; i < snowCount; i++) {
                flakes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 3 + 1.8,
                    density: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.5 + 0.5
                })
            }
        }

        let snowAngle = 0

        const render = (now: number) => {
            ctx.clearRect(0, 0, width, height)

            // --- Render Fireworks ---
            if (fireworksMode) {
                if (now - lastRocketTime > 550) {
                    const burstX = Math.random() * (width * 0.8) + width * 0.1
                    const burstY = Math.random() * (height * 0.45) + height * 0.1
                    createBurst(burstX, burstY)
                    if (Math.random() > 0.4) {
                        createBurst(
                            Math.random() * (width * 0.8) + width * 0.1,
                            Math.random() * (height * 0.45) + height * 0.1
                        )
                    }
                    lastRocketTime = now
                }

                for (let i = fireworkParticles.length - 1; i >= 0; i--) {
                    const p = fireworkParticles[i]
                    p.prevX = p.x
                    p.prevY = p.y
                    p.x += p.vx
                    p.y += p.vy
                    p.vy += 0.08 // Gravity
                    p.vx *= 0.98
                    p.alpha -= p.decay

                    if (p.alpha <= 0) {
                        fireworkParticles.splice(i, 1)
                        continue
                    }

                    ctx.save()
                    ctx.globalAlpha = Math.max(0, p.alpha)
                    ctx.shadowBlur = 10
                    ctx.shadowColor = p.color
                    ctx.fillStyle = p.color
                    ctx.strokeStyle = p.color

                    // Spark trail
                    ctx.lineWidth = p.size * 0.7
                    ctx.beginPath()
                    ctx.moveTo(p.prevX, p.prevY)
                    ctx.lineTo(p.x, p.y)
                    ctx.stroke()

                    // Glowing spark head
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }
            }

            // --- Render Snow ---
            if (snowMode) {
                snowAngle += 0.01

                for (let i = 0; i < flakes.length; i++) {
                    const f = flakes[i]
                    f.y += Math.cos(snowAngle + f.density) + 1.2 + f.radius / 2
                    f.x += Math.sin(snowAngle) * 0.9

                    if (f.y > height) {
                        f.y = -10
                        f.x = Math.random() * width
                    }
                    if (f.x > width + 10) f.x = -10
                    if (f.x < -10) f.x = width + 10

                    ctx.save()
                    ctx.globalAlpha = f.alpha
                    ctx.shadowBlur = 6
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
                    ctx.fillStyle = '#ffffff'
                    ctx.beginPath()
                    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }
            }

            animationId = requestAnimationFrame(render)
        }

        animationId = requestAnimationFrame(render)

        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationId)
        }
    }, [fireworksMode, snowMode, reducedMotion])

    return (
        <>
            {/* Atmospheric dark backdrop ensuring fireworks and snow are intensely visible in both light & dark themes */}
            {(fireworksMode || snowMode) && (
                <div
                    className="fixed inset-0 pointer-events-none z-[9988] bg-black/60 backdrop-blur-[0.5px] transition-opacity duration-300"
                    data-no-leet
                />
            )}

            {(fireworksMode || snowMode) && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 pointer-events-none z-[9990]"
                    style={{ width: '100vw', height: '100vh' }}
                />
            )}

            {neonMode && (
                <div
                    className="fixed inset-0 pointer-events-none z-[9989]"
                    style={{
                        boxShadow: 'inset 0 0 80px rgba(66, 133, 244, 0.4), inset 0 0 160px rgba(52, 168, 83, 0.25)',
                        filter: 'contrast(1.08) saturate(1.3)'
                    }}
                />
            )}
        </>
    )
}

export default VisualFXOverlay
