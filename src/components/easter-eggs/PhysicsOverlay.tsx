/**
 * PhysicsOverlay.tsx
 *
 * Matter.js powered physics mode for explicitly tagged UI elements.
 */

import { useEffect, useRef, useCallback } from 'react'
import Matter from 'matter-js'
import { type PhysicsGravity, useEasterEggStore } from '@/store/easterEggStore'

const TARGET_SELECTOR = '[data-physics]'

interface PhysicsElement {
    id: string
    rect: DOMRect
    element: HTMLElement
    body: Matter.Body | null
    clone: HTMLElement | null
    originalVisibility: string
    originalDisplay: string
}

function getGravityConfig(gravity: PhysicsGravity) {
    switch (gravity) {
        case 'moon':
            return { x: 0, y: 0.35, scale: 0.001 }
        case 'chaos':
            return { x: 0.35, y: 0.85, scale: 0.0012 }
        case 'earth':
        default:
            return { x: 0, y: 1, scale: 0.001 }
    }
}

export function PhysicsOverlay() {
    const { physicsEnabled, physicsGravity, disablePhysics } = useEasterEggStore()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const runnerRef = useRef<Matter.Runner | null>(null)
    const elementsRef = useRef<PhysicsElement[]>([])
    const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null)

    const applyGravityPreset = useCallback((gravity: PhysicsGravity) => {
        if (!engineRef.current) return
        engineRef.current.gravity = { ...getGravityConfig(gravity) }
    }, [])

    const initPhysics = useCallback(() => {
        if (!containerRef.current || !canvasRef.current) return

        const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter

        const engine = Engine.create({
            gravity: getGravityConfig(useEasterEggStore.getState().physicsGravity),
        })
        engineRef.current = engine

        const render = Render.create({
            element: containerRef.current,
            canvas: canvasRef.current,
            engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent',
                showVelocity: false,
                showAngleIndicator: false,
            },
        })
        renderRef.current = render

        const runner = Runner.create()
        runnerRef.current = runner

        const floor = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight + 30,
            window.innerWidth * 2,
            60,
            { isStatic: true, label: 'floor' }
        )
        const leftWall = Bodies.rectangle(
            -30,
            window.innerHeight / 2,
            60,
            window.innerHeight * 2,
            { isStatic: true, label: 'leftWall' }
        )
        const rightWall = Bodies.rectangle(
            window.innerWidth + 30,
            window.innerHeight / 2,
            60,
            window.innerHeight * 2,
            { isStatic: true, label: 'rightWall' }
        )

        Composite.add(engine.world, [floor, leftWall, rightWall])

        const elements = document.querySelectorAll<HTMLElement>(TARGET_SELECTOR)
        const physicsElements: PhysicsElement[] = []

        elements.forEach((element, index) => {
            if (element.closest('.physics-overlay')) return
            if (element.closest('[data-easter-overlay]')) return
            if (element.closest('[data-no-physics]')) return
            if (!element.offsetParent) return

            const rect = element.getBoundingClientRect()

            if (rect.width < 32 || rect.height < 24) return
            if (rect.top > window.innerHeight || rect.bottom < 0) return
            if (rect.left > window.innerWidth || rect.right < 0) return
            if (index >= 60) return

            const body = Bodies.rectangle(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                rect.width,
                rect.height,
                {
                    restitution: 0.55,
                    friction: 0.2,
                    frictionAir: 0.015,
                    label: `element-${index}`,
                    angularVelocity: (Math.random() - 0.5) * 0.08,
                }
            )

            const clone = element.cloneNode(true) as HTMLElement
            clone.style.position = 'fixed'
            clone.style.left = `${rect.left}px`
            clone.style.top = `${rect.top}px`
            clone.style.width = `${rect.width}px`
            clone.style.height = `${rect.height}px`
            clone.style.margin = '0'
            clone.style.zIndex = '9980'
            clone.style.pointerEvents = 'none'
            clone.style.transformOrigin = 'center center'
            clone.style.willChange = 'transform'
            clone.classList.add('physics-clone')
            clone.setAttribute('data-no-leet', 'true')
            clone.removeAttribute('data-physics')

            const originalVisibility = element.style.visibility
            const originalDisplay = element.style.display

            element.style.visibility = 'hidden'

            containerRef.current?.appendChild(clone)
            Composite.add(engine.world, body)

            physicsElements.push({
                id: `element-${index}`,
                rect,
                element,
                body,
                clone,
                originalVisibility,
                originalDisplay,
            })
        })

        elementsRef.current = physicsElements

        const mouse = Mouse.create(containerRef.current)
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false },
            },
        })
        mouseConstraintRef.current = mouseConstraint
        Composite.add(engine.world, mouseConstraint)

        Events.on(mouseConstraint, 'mousedown', (event) => {
            const mousePosition = event.mouse.position
            const clickedBody = Matter.Query.point(Composite.allBodies(engine.world), mousePosition)[0]

            if (!clickedBody || clickedBody.isStatic) return

            const bodies = Composite.allBodies(engine.world)
            const explosionRadius = 260
            const maxImpulse = useEasterEggStore.getState().physicsGravity === 'chaos' ? 0.08 : 0.05

            bodies.forEach((body, bodyIndex) => {
                if (body.isStatic) return

                const dx = body.position.x - mousePosition.x
                const dy = body.position.y - mousePosition.y
                const rawDistance = Math.hypot(dx, dy)
                if (rawDistance > explosionRadius) return

                const distance = Math.max(rawDistance, 24)
                const normalizedX = rawDistance < 1 ? Math.cos(bodyIndex) : dx / distance
                const normalizedY = rawDistance < 1 ? Math.sin(bodyIndex) : dy / distance
                const impulseScale = Math.max(0, 1 - distance / explosionRadius)
                const forceMagnitude = Math.min(maxImpulse, maxImpulse * impulseScale)

                Matter.Body.applyForce(body, body.position, {
                    x: normalizedX * forceMagnitude,
                    y: normalizedY * forceMagnitude,
                })
            })
        })

        render.mouse = mouse

        Events.on(engine, 'afterUpdate', () => {
            physicsElements.forEach(({ body, clone, rect }) => {
                if (!body || !clone) return

                const x = body.position.x - rect.width / 2
                const y = body.position.y - rect.height / 2
                const angle = body.angle * (180 / Math.PI)

                clone.style.transform = `translate(${x - rect.left}px, ${y - rect.top}px) rotate(${angle}deg)`
            })
        })

        Render.run(render)
        Runner.run(runner, engine)
    }, [])

    const cleanupPhysics = useCallback(() => {
        const { Render, Runner, Engine, Composite } = Matter

        elementsRef.current.forEach(({ element, clone, originalVisibility, originalDisplay }) => {
            element.style.visibility = originalVisibility
            element.style.display = originalDisplay
            clone?.remove()
        })
        elementsRef.current = []

        if (renderRef.current) {
            Render.stop(renderRef.current)
            renderRef.current.canvas.remove()
            renderRef.current = null
        }

        if (runnerRef.current) {
            Runner.stop(runnerRef.current)
            runnerRef.current = null
        }

        if (engineRef.current) {
            Composite.clear(engineRef.current.world, false)
            Engine.clear(engineRef.current)
            engineRef.current = null
        }

        mouseConstraintRef.current = null
    }, [])

    useEffect(() => {
        if (physicsEnabled) {
            const timer = window.setTimeout(initPhysics, 60)
            return () => window.clearTimeout(timer)
        }

        cleanupPhysics()
        return undefined
    }, [physicsEnabled, initPhysics, cleanupPhysics])

    useEffect(() => {
        applyGravityPreset(physicsGravity)
    }, [applyGravityPreset, physicsGravity])

    useEffect(() => {
        return () => cleanupPhysics()
    }, [cleanupPhysics])

    useEffect(() => {
        if (!physicsEnabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                disablePhysics()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [physicsEnabled, disablePhysics])

    if (!physicsEnabled) return null

    return (
        <div
            ref={containerRef}
            className="physics-overlay fixed inset-0 z-[9985]"
            style={{ background: 'transparent' }}
            data-no-leet
            data-easter-overlay="physics"
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none opacity-0"
            />

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] bg-black/80 text-white px-4 py-2 rounded-full text-sm font-mono backdrop-blur-sm">
                {`🎮 Physics Mode Active - ${physicsGravity.toUpperCase()} gravity - Press ESC to exit`}
            </div>
        </div>
    )
}

export default PhysicsOverlay
