/**
 * QuakeTerminal.tsx
 * 
 * Quake-style drop-down terminal with GSAP animation.
 * Features:
 * - Slides down from top with bounce
 * - Command history (↑/↓)
 * - Tab autocomplete
 * - Full command set
 */

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useEasterEggStore } from '@/store/easterEggStore'

// Available commands (whitelist)
const COMMANDS: Record<string, { description: string; action: (args: string[], store: ReturnType<typeof useEasterEggStore.getState>) => string | void }> = {
    help: {
        description: 'List all available commands',
        action: () => {
            const lines = [
                '╔═══════════════════════════════════════╗',
                '║      GDG TERMINAL v1.2 - COMMANDS     ║',
                '╠═══════════════════════════════════════╣',
                '║  help      - Show this help message   ║',
                '║  clear     - Clear terminal output    ║',
                '║  about     - About this terminal      ║',
                '║  matrix     / rain - Toggle Matrix    ║',
                '║  crt       - Toggle CRT overlay       ║',
                '║  physics   - Toggle physics mode      ║',
                '║  gravity   - Cycle gravity preset     ║',
                '║  noclip    - Toggle free camera       ║',
                '║  leet      - Toggle 1337-speak        ║',
                '║  party     - Toggle Party mode        ║',
                '║  hack      - Toggle Hacker mode       ║',
                '║  godmode   - Unlock all features      ║',
                '║  status    - Show current status      ║',
                '║  reset     - Reset all effects        ║',
                '║  exit      - Close terminal           ║',
                '╚═══════════════════════════════════════╝',
            ]
            return lines.join('\n')
        }
    },
    clear: {
        description: 'Clear terminal output',
        action: (_, store) => {
            store.clearOutput()
        }
    },
    about: {
        description: 'About this terminal',
        action: () => {
            return `GDG on Campus Terminal\nBuilt for hidden dev-mode chaos.\nPress \` or ~ to toggle.\nTap the GDG logo 7 times on touch devices.\nType 'help' for commands.`
        }
    },
    matrix: {
        description: 'Toggle Matrix rain effect',
        action: (_, store) => {
            const nextEnabled = !store.matrixMode
            store.setEffectEnabled('matrix', nextEnabled)
            return nextEnabled ? 'Matrix mode: ON - Wake up, Neo...' : 'Matrix mode: OFF'
        }
    },
    rain: {
        description: 'Alias for Matrix rain effect',
        action: (_, store) => COMMANDS.matrix.action(_, store)
    },
    crt: {
        description: 'Toggle CRT overlay',
        action: (_, store) => {
            const nextEnabled = !store.crtEnabled
            store.setEffectEnabled('crt', nextEnabled)
            return nextEnabled ? 'CRT overlay: ON - Retro vibes activated' : 'CRT overlay: OFF'
        }
    },
    physics: {
        description: 'Toggle physics mode',
        action: (_, store) => {
            if (!store.unlocks.physics && !store.godMode) {
                return '🔒 Physics mode locked. Try the Konami code: ↑↑↓↓←→←→BA'
            }
            const nextEnabled = !store.physicsEnabled
            store.setEffectEnabled('physics', nextEnabled)
            return nextEnabled
                ? `Physics mode: ON - Elements falling! Gravity: ${store.physicsGravity.toUpperCase()}`
                : 'Physics mode: OFF'
        }
    },
    gravity: {
        description: 'Cycle physics gravity preset',
        action: (_, store) => {
            if (!store.unlocks.physics && !store.godMode) {
                return '🔒 Gravity controls are locked. Unlock physics first.'
            }

            if (!store.physicsEnabled) {
                store.setPhysicsGravity('earth')
                store.setEffectEnabled('physics', true)
                return 'Physics mode: ON - Gravity preset set to EARTH'
            }

            const gravityOrder = ['earth', 'moon', 'chaos'] as const
            const currentIndex = gravityOrder.indexOf(store.physicsGravity)
            const nextGravity = gravityOrder[(currentIndex + 1) % gravityOrder.length]
            store.setPhysicsGravity(nextGravity)

            return `Gravity preset: ${nextGravity.toUpperCase()}`
        }
    },
    leet: {
        description: 'Toggle 1337-speak',
        action: (_, store) => {
            const nextEnabled = !store.leetMode
            store.setEffectEnabled('leet', nextEnabled)
            return nextEnabled ? 'Leet mode: ON - 1337 h4x0r 4c71v473d' : 'Leet mode: OFF'
        }
    },
    party: {
        description: 'Toggle Party mode',
        action: (_, store) => {
            const nextEnabled = !store.partyMode
            store.setEffectEnabled('party', nextEnabled)
            return nextEnabled ? 'Party mode: ON - TIME TO PARTY! 🥳' : 'Party mode: OFF'
        }
    },
    hack: {
        description: 'Toggle Hacker mode',
        action: (_, store) => {
            const nextEnabled = !store.hackerMode
            store.setEffectEnabled('hacker', nextEnabled)
            return nextEnabled ? 'Hacker mode: ON - System compromised.' : 'Hacker mode: OFF'
        }
    },
    noclip: {
        description: 'Toggle free camera mode',
        action: (_, store) => {
            if (!store.unlocks.noclip && !store.godMode) {
                return '🔒 Noclip mode locked. Try "godmode" first.'
            }
            const nextEnabled = !store.noclipMode
            store.setEffectEnabled('noclip', nextEnabled)
            return nextEnabled ? 'Noclip: ON - Free camera enabled' : 'Noclip: OFF'
        }
    },
    godmode: {
        description: 'Unlock all features',
        action: (_, store) => {
            store.enableGodMode()
            return '🎮 GOD MODE ACTIVATED\nAll features unlocked!\nMatrix, Noclip, Physics - all yours.'
        }
    },
    status: {
        description: 'Show current status',
        action: (_, store) => {
            return [
                '┌──────────────────────────────┐',
                '│        SYSTEM STATUS         │',
                '├──────────────────────────────┤',
                `│  God Mode:   ${store.godMode ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Matrix:     ${store.matrixMode ? '✓ ON ' : '✗ OFF'}        │`,
                `│  CRT:        ${store.crtEnabled ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Physics:    ${store.physicsEnabled ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Gravity:    ${store.physicsGravity.toUpperCase().padEnd(6, ' ')}      │`,
                `│  Noclip:     ${store.noclipMode ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Leet:       ${store.leetMode ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Party:      ${store.partyMode ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Hacker:     ${store.hackerMode ? '✓ ON ' : '✗ OFF'}        │`,
                `│  Physics UL: ${store.unlocks.physics ? '✓ YES' : '✗ NO '}        │`,
                `│  Noclip UL:  ${store.unlocks.noclip ? '✓ YES' : '✗ NO '}        │`,
                '└──────────────────────────────┘'
            ].join('\n')
        }
    },
    reset: {
        description: 'Reset all effects',
        action: (_, store) => {
            store.reset()
            return 'All effects reset to default.'
        }
    },
    exit: {
        description: 'Close terminal',
        action: (_, store) => {
            setTimeout(() => store.closeTerminal(), 100)
            return 'Closing terminal...'
        }
    },
    echo: {
        description: 'Echo text',
        action: (args) => args.join(' ') || ''
    },
}

const COMMAND_NAMES = Object.keys(COMMANDS)

export function QuakeTerminal() {
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const outputRef = useRef<HTMLDivElement>(null)
    const [input, setInput] = useState('')

    const {
        terminalOpen,
        terminalOutput,
        commandHistory,
        historyIndex,
        addOutput,
        addToHistory,
        setHistoryIndex,
    } = useEasterEggStore()

    // GSAP animation for open/close
    useEffect(() => {
        if (!containerRef.current) return

        if (terminalOpen) {
            gsap.to(containerRef.current, {
                y: 0,
                duration: 0.4,
                ease: 'elastic.out(1, 0.5)',
            })
            // Focus input after animation
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            gsap.to(containerRef.current, {
                y: '-100%',
                duration: 0.2,
                ease: 'power2.in',
            })
        }
    }, [terminalOpen])

    // Auto-scroll to bottom
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [terminalOutput])

    // Process command
    const processCommand = (cmd: string) => {
        const trimmed = cmd.trim()
        if (!trimmed) return

        addOutput({ type: 'input', text: `> ${trimmed}` })
        addToHistory(trimmed)

        const [cmdName, ...args] = trimmed.split(' ')
        const command = COMMANDS[cmdName.toLowerCase()]

        if (command) {
            const store = useEasterEggStore.getState()
            const result = command.action(args, store)
            if (result) {
                addOutput({ type: 'output', text: result })
            }
        } else {
            addOutput({ type: 'error', text: `Command not found: ${cmdName}. Type 'help' for available commands.` })
        }

        setInput('')
    }

    // Handle key events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // History navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (commandHistory.length === 0) return
            const newIndex = historyIndex === -1
                ? commandHistory.length - 1
                : Math.max(0, historyIndex - 1)
            setHistoryIndex(newIndex)
            setInput(commandHistory[newIndex] || '')
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (historyIndex === -1) return
            const newIndex = historyIndex + 1
            if (newIndex >= commandHistory.length) {
                setHistoryIndex(-1)
                setInput('')
            } else {
                setHistoryIndex(newIndex)
                setInput(commandHistory[newIndex] || '')
            }
        }

        // Tab autocomplete
        if (e.key === 'Tab') {
            e.preventDefault()
            const matches = COMMAND_NAMES.filter(c => c.startsWith(input.toLowerCase()))
            if (matches.length === 1) {
                setInput(matches[0])
            } else if (matches.length > 1) {
                addOutput({ type: 'system', text: `Matches: ${matches.join(', ')}` })
            }
        }

        // Submit
        if (e.key === 'Enter') {
            processCommand(input)
        }
    }

    // Show welcome message on first open
    useEffect(() => {
        if (terminalOpen && terminalOutput.length === 0) {
            addOutput({
                type: 'system',
                text: '╔═══════════════════════════════════════════╗\n║  GDG on Campus Terminal v1.2              ║\n║  Type "help" for available commands       ║\n╚═══════════════════════════════════════════╝'
            })
        }
    }, [terminalOpen, terminalOutput.length, addOutput])

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 right-0 z-[9999] font-mono"
            data-no-leet
            data-easter-overlay="terminal"
            style={{ transform: 'translateY(-100%)' }}
        >
            {/* Terminal container */}
            <div className="bg-black/95 border-b-4 border-green-500 shadow-2xl shadow-green-500/20 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 border-b border-green-500/30">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-green-500 text-xs tracking-wider">GDG://TERMINAL</span>
                    <span className="text-green-500/50 text-xs">Press ` or ESC to close</span>
                </div>

                {/* Output area */}
                <div
                    ref={outputRef}
                    className="h-[300px] overflow-y-auto p-4 text-sm"
                >
                    {terminalOutput.map((line, i) => (
                        <div
                            key={i}
                            className={`whitespace-pre-wrap mb-1 ${line.type === 'input' ? 'text-cyan-400' :
                                    line.type === 'error' ? 'text-red-400' :
                                        line.type === 'success' ? 'text-green-400' :
                                            line.type === 'system' ? 'text-yellow-400' :
                                                'text-gray-300'
                                }`}
                        >
                            {line.text}
                        </div>
                    ))}
                </div>

                {/* Input area */}
                <div className="flex items-center px-4 py-3 bg-black/50 border-t border-green-500/20">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-green-400 outline-none placeholder-green-500/30"
                        placeholder="Type a command..."
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    )
}

export default QuakeTerminal
