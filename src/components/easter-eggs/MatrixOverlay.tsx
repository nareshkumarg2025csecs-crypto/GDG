/**
 * MatrixOverlay.tsx
 *
 * High-performance 2D Canvas Matrix Rain effect.
 * Overlays the entire screen with capped DPR/FPS and pauses when hidden.
 */

import { useEffect, useRef } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'

const GDG_COLORS = [
    '#4285F4',
    '#EA4335',
    '#FBBC04',
    '#34A853',
]

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>[]{}/\\|!@#$%^&*()_+-=モエヤキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

export function MatrixOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { matrixMode, reducedMotion } = useEasterEggStore()

    useEffect(() => {
        if (!matrixMode || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        const fontSize = reducedMotion ? 18 : 16
        const targetFrameTime = reducedMotion ? 1000 / 18 : 1000 / 30

        let width = 0
        let height = 0
        let dpr = 1
        let columns = 0
        let drops: number[] = []
        let speeds: number[] = []
        let colors: string[] = []
        let rafId = 0
        let lastFrame = 0
        let running = !document.hidden

        const setupColumns = () => {
            columns = Math.max(1, Math.ceil(width / fontSize))
            drops = Array.from({ length: columns }, () => Math.random() * (height / fontSize))
            speeds = Array.from({ length: columns }, () => (reducedMotion ? 0.35 : 0.6) + Math.random() * 0.9)
            colors = Array.from({ length: columns }, () => GDG_COLORS[Math.floor(Math.random() * GDG_COLORS.length)])
        }

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            width = window.innerWidth
            height = window.innerHeight

            canvas.width = Math.floor(width * dpr)
            canvas.height = Math.floor(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            setupColumns()
        }

        const trailLength = reducedMotion ? 8 : 14

        const draw = (time: number) => {
            if (!running) return

            if (time - lastFrame < targetFrameTime) {
                rafId = window.requestAnimationFrame(draw)
                return
            }
            lastFrame = time

            // Clear canvas completely each frame so the page behind is 100% visible
            ctx.clearRect(0, 0, width, height)
            ctx.font = `${fontSize}px monospace`
            ctx.textBaseline = 'top'

            for (let i = 0; i < columns; i++) {
                const x = i * fontSize
                const leadY = drops[i]

                // Draw leading head and fading trail characters
                for (let t = 0; t < trailLength; t++) {
                    const charY = (leadY - t) * fontSize
                    if (charY < -fontSize || charY > height + fontSize) continue

                    const alpha = Math.max(0.08, 1 - t / trailLength)
                    const char = CHARS[(Math.floor(leadY * 2) + t * 7 + i) % CHARS.length]

                    ctx.save()
                    if (t === 0) {
                        // Leading character is brilliant white/ice with colored glow
                        ctx.fillStyle = '#FFFFFF'
                        ctx.shadowBlur = 10
                        ctx.shadowColor = colors[i]
                        ctx.globalAlpha = 0.95
                    } else {
                        // Trail characters fade gently in Google / Matrix colors
                        ctx.fillStyle = colors[i]
                        ctx.shadowBlur = t < 3 ? 4 : 0
                        ctx.shadowColor = colors[i]
                        ctx.globalAlpha = alpha * 0.85
                    }

                    ctx.fillText(char, x, charY)
                    ctx.restore()
                }

                drops[i] += speeds[i]

                if (leadY * fontSize > height + trailLength * fontSize + 20 && Math.random() > 0.96) {
                    drops[i] = -Math.random() * 8
                    speeds[i] = (reducedMotion ? 0.35 : 0.6) + Math.random() * 0.9
                    colors[i] = GDG_COLORS[Math.floor(Math.random() * GDG_COLORS.length)]
                }
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
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('resize', resize)

        if (running) {
            rafId = window.requestAnimationFrame(draw)
        }

        return () => {
            running = false
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('resize', resize)
            if (rafId) {
                window.cancelAnimationFrame(rafId)
            }
        }
    }, [matrixMode, reducedMotion])

    if (!matrixMode) return null

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[9982] pointer-events-none"
            data-no-leet
            data-easter-overlay="matrix"
        />
    )
}

export default MatrixOverlay
