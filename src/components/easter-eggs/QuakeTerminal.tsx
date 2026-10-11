/**
 * QuakeTerminal.tsx
 * 
 * Ultra-responsive, visual-focused developer drop-down Quake terminal.
 * Features:
 * - Dedicated visual effects: matrix, party, hack, fireworks, snow, crt, neon
 * - Lightweight Web Audio API sound synthesizers for meow, party, matrix, hack, fireworks
 * - Toggleable audio via titlebar sound icon (🔊 / 🔇)
 * - Single-active visual effect rule (enabling one closes the previous)
 * - 'clear' completely resets terminal output and all visual effects
 * - Touch-friendly quick chips bar for mobile
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { useEasterEggStore } from '@/store/easterEggStore'
import { useTheme } from '@/contexts/ThemeContext'
import {
    Terminal,
    Maximize2,
    Minimize2,
    X,
    Volume2,
    VolumeX,
    Play,
    ArrowUp,
    ArrowDown,
    Copy,
    Check,
    Sparkles
} from 'lucide-react'

// --- Lightweight Web Audio Synthesizers (Zero external files, mobile-friendly) ---

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
    try {
        if (!sharedAudioContext) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            if (!AudioContextClass) return null
            sharedAudioContext = new AudioContextClass()
        }
        if (sharedAudioContext.state === 'suspended') {
            sharedAudioContext.resume().catch(() => {})
        }
        return sharedAudioContext
    } catch {
        return null
    }
}

// 1. Playful Kitten Meow
function playMeowSound() {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(360, now)
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.16)
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.4)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.45)
}

// 2. Upbeat 8-Bit Party Chime Fanfare
function playPartySound() {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.08
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, noteTime)

        gain.gain.setValueAtTime(0.05, noteTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.22)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(noteTime)
        osc.stop(noteTime + 0.24)
    })
}

// 3. Cyber Matrix Sub-bass Sweep
function playMatrixSound() {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.32)

    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.38)
}

// 4. Glitch Hacker Data Burst
function playHackSound() {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const freqs = [1200, 350, 1600, 420, 880]
    freqs.forEach((freq, i) => {
        const t = now + i * 0.04
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.025, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.04)
    })
}

// 5. Festive Fireworks Pop
function playFireworksSound() {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(340, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.24)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.28)
}

// 6. Mechanical Keystroke Click
function playMechanicalClick() {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(450 + Math.random() * 150, now)
    gain.gain.setValueAtTime(0.02, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.035)
}

// --- Visual & Experiential Commands Map ---

const COMMANDS: Record<
    string,
    {
        description: string
        action: (args: string[], store: ReturnType<typeof useEasterEggStore.getState>) => string | void
    }
> = {
    help: {
        description: 'Show visual effects commands',
        action: () => {
            return [
                'GDG TERMINAL - VISUAL PLAYGROUND',
                '─────────────────────────────────────────────────',
                'VISUAL EFFECTS:',
                '  matrix    - Digital green code rain (alias: rain) [Audio FX]',
                '  party     - Confetti bursts & rave celebration [Audio FX]',
                '  hack      - Cyberpunk glitch & radar breach [Audio FX]',
                '  fireworks - Google fireworks particle bursts [Audio FX]',
                '  snow      - Gentle ambient tech snowfall',
                '  crt       - Retro arcade CRT scanlines & curvature',
                '  neon      - High-contrast cyberpunk glow filter',
                '',
                'MASCOT & AUDIO:',
                '  meow      - Interact with Pixel the Kitten [Meow Audio]',
                '  mascot    - Meet Pixel with official ASCII badge',
                '',
                'SYSTEM CONTROLS:',
                '  clear     - Clear screen & turn off all visual effects',
                '  exit      - Close drop-down terminal',
                '─────────────────────────────────────────────────',
                'Tip: Tap the quick buttons below or click 🔊 to toggle audio.'
            ].join('\n')
        }
    },
    matrix: {
        description: 'Toggle Matrix rain effect',
        action: (_, store) => {
            const next = !store.matrixMode
            store.setEffectEnabled('matrix', next)
            if (next && store.soundEnabled) playMatrixSound()
            return next ? 'Matrix Mode: ON (other active visual effects closed)' : 'Matrix Mode: OFF'
        }
    },
    rain: {
        description: 'Alias for Matrix rain',
        action: (args, store) => COMMANDS.matrix.action(args, store)
    },
    party: {
        description: 'Toggle Party rave & confetti mode',
        action: (_, store) => {
            const next = !store.partyMode
            store.setEffectEnabled('party', next)
            if (next && store.soundEnabled) playPartySound()
            return next ? 'Party Mode: ON - Confetti & Disco Activated! 🎉' : 'Party Mode: OFF'
        }
    },
    hack: {
        description: 'Toggle Cyberpunk hacker overlay',
        action: (_, store) => {
            const next = !store.hackerMode
            store.setEffectEnabled('hacker', next)
            if (next && store.soundEnabled) playHackSound()
            return next ? 'Hacker Mode: ON - System compromised.' : 'Hacker Mode: OFF'
        }
    },
    fireworks: {
        description: 'Toggle Google fireworks burst mode',
        action: (_, store) => {
            const next = !store.fireworksMode
            store.setEffectEnabled('fireworks', next)
            if (next && store.soundEnabled) playFireworksSound()
            return next ? 'Fireworks: ON - Google colors exploding!' : 'Fireworks: OFF'
        }
    },
    snow: {
        description: 'Toggle tech snowfall mode',
        action: (_, store) => {
            const next = !store.snowMode
            store.setEffectEnabled('snow', next)
            return next ? 'Snow Mode: ON - Soft ambient particles falling.' : 'Snow Mode: OFF'
        }
    },
    crt: {
        description: 'Toggle retro CRT scanlines',
        action: (_, store) => {
            const next = !store.crtEnabled
            store.setEffectEnabled('crt', next)
            return next ? 'CRT Filter: ON - Retro scanlines activated.' : 'CRT Filter: OFF'
        }
    },
    neon: {
        description: 'Toggle cyber neon glow',
        action: (_, store) => {
            const next = !store.neonMode
            store.setEffectEnabled('neon', next)
            return next ? 'Neon Glow: ON - Cyber saturation boosted.' : 'Neon Glow: OFF'
        }
    },
    meow: {
        description: 'Say meow to Pixel',
        action: (_, store) => {
            if (store.soundEnabled) playMeowSound()
            return [
                '   /\\_/\\  ',
                '  ( =^･ω･^= )  🐾 *purrrrrrr* Pixel is happy!',
                '   >  ❤  <    "Meow! Welcome to GDG REC!"'
            ].join('\n')
        }
    },
    mascot: {
        description: 'Meet Pixel the GDG Mascot',
        action: (_, store) => {
            if (store.soundEnabled) playMeowSound()
            return [
                '   /\\_/\\  ',
                '  ( o.o )  🐾 "Meow World! I\'m Pixel the GDG Mascot!"',
                '   > ^ <   [Wearing GDG Varsity Jacket]',
                '──────────────────────────────────────────────',
                'Role: Chief Morale Officer & Lead Bug Hunter',
                'Status: Purring loudly & reviewing pull requests',
                'Tip: Check the About Us page for community perks & secrets!'
            ].join('\n')
        }
    },
    pixel: {
        description: 'Alias for mascot',
        action: (args, store) => COMMANDS.mascot.action(args, store)
    },
    cat: {
        description: 'Alias for mascot',
        action: (args, store) => COMMANDS.mascot.action(args, store)
    },
    clear: {
        description: 'Clear screen & reset all active visual effects',
        action: (_, store) => {
            store.clearOutput()
        }
    },
    exit: {
        description: 'Close terminal',
        action: (_, store) => {
            setTimeout(() => store.closeTerminal(), 100)
            return 'Closing terminal...'
        }
    }
}

const COMMAND_NAMES = Object.keys(COMMANDS)

// Visual quick-action chips for mobile and desktop
const QUICK_CHIPS = ['matrix', 'party', 'hack', 'fireworks', 'snow', 'crt', 'neon', 'meow', 'clear', 'help', 'exit']

export function QuakeTerminal() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const outputRef = useRef<HTMLDivElement>(null)
    const hasGreetedRef = useRef(false)
    const [input, setInput] = useState('')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [copied, setCopied] = useState(false)

    const {
        terminalOpen,
        terminalOutput,
        commandHistory,
        historyIndex,
        soundEnabled,
        toggleSound,
        addOutput,
        addToHistory,
        setHistoryIndex,
        closeTerminal,
        clearOutput
    } = useEasterEggStore()

    // GSAP animation for slide open/close
    useEffect(() => {
        if (!containerRef.current) return

        if (terminalOpen) {
            gsap.to(containerRef.current, {
                y: 0,
                duration: 0.35,
                ease: 'power3.out'
            })
            setTimeout(() => inputRef.current?.focus(), 120)
        } else {
            gsap.to(containerRef.current, {
                y: '-100%',
                duration: 0.22,
                ease: 'power2.in'
            })
        }
    }, [terminalOpen])

    // Auto-scroll output
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [terminalOutput])

    // Process a command
    const processCommand = useCallback(
        (cmd: string) => {
            const trimmed = cmd.trim()
            if (!trimmed) return

            if (soundEnabled) playMechanicalClick()

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
                addOutput({
                    type: 'error',
                    text: `Unknown command: "${cmdName}". Type "help" or tap the buttons below.`
                })
            }

            setInput('')
        },
        [addOutput, addToHistory, soundEnabled]
    )

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (soundEnabled && e.key.length === 1) {
            playMechanicalClick()
        }

        // History Up
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (commandHistory.length === 0) return
            const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
            setHistoryIndex(newIndex)
            setInput(commandHistory[newIndex] || '')
        }

        // History Down
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

        // Tab Autocomplete
        if (e.key === 'Tab') {
            e.preventDefault()
            const matches = COMMAND_NAMES.filter((c) => c.startsWith(input.toLowerCase()))
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

        // Ctrl + L clear
        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault()
            clearOutput()
        }
    }

    // Touch history stepper
    const handleHistoryStep = (direction: 'up' | 'down') => {
        if (commandHistory.length === 0) return
        if (direction === 'up') {
            const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
            setHistoryIndex(newIndex)
            setInput(commandHistory[newIndex] || '')
        } else {
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
    }

    // Copy terminal logs
    const handleCopyLogs = async () => {
        const text = terminalOutput.map((l) => l.text).join('\n')
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
            } catch {
                // Clipboard write permission denied or unsupported
            }
        }
    }

    // Initial greeting per terminal opening session
    useEffect(() => {
        if (!terminalOpen) {
            hasGreetedRef.current = false
            return
        }

        if (!hasGreetedRef.current) {
            hasGreetedRef.current = true
            if (terminalOutput.length === 0) {
                addOutput({
                    type: 'system',
                    text: [
                        'GDG ON CAMPUS - VISUAL PLAYGROUND TERMINAL',
                        'Activate visual modes below: matrix, party, hack, fireworks, snow, crt, neon, meow.',
                        'Type "help" or tap the quick buttons below.'
                    ].join('\n')
                })
            }
        }
    }, [terminalOpen, addOutput])

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 right-0 z-[9999] font-mono select-none"
            data-no-leet
            data-easter-overlay="terminal"
            role="dialog"
            aria-label="Developer Quake Terminal"
            style={{ transform: 'translateY(-100%)' }}
        >
            {/* Terminal Window Frame */}
            <div
                className={`border-b-2 sm:border-b-4 backdrop-blur-xl flex flex-col transition-all duration-300 ${
                    isDark
                        ? 'bg-[#0a0e14]/98 border-emerald-500 shadow-2xl shadow-emerald-500/20'
                        : 'bg-white/98 border-emerald-600 shadow-2xl shadow-slate-900/15'
                } ${
                    isFullscreen
                        ? 'h-[90vh] sm:h-[92vh]'
                        : 'h-[360px] sm:h-[420px] md:h-[480px]'
                }`}
            >
                {/* Window Titlebar */}
                <div
                    className={`flex items-center justify-between px-3 sm:px-4 py-2 border-b shrink-0 transition-colors ${
                        isDark
                            ? 'bg-emerald-500/10 border-emerald-500/25'
                            : 'bg-emerald-50 border-emerald-200'
                    }`}
                >
                    {/* Traffic Lights */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => closeTerminal()}
                            className="w-3 h-3 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center text-[8px] text-red-950 font-bold transition-all cursor-pointer group"
                            title="Close Terminal (ESC or `)"
                            aria-label="Close Terminal"
                        >
                            <span className="opacity-0 group-hover:opacity-100">&times;</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => clearOutput()}
                            className="w-3 h-3 rounded-full bg-yellow-500/90 hover:bg-yellow-500 flex items-center justify-center text-[8px] text-yellow-950 font-bold transition-all cursor-pointer group"
                            title="Clear Screen & Reset Visuals"
                            aria-label="Clear Screen"
                        >
                            <span className="opacity-0 group-hover:opacity-100">&minus;</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen((prev) => !prev)}
                            className="w-3 h-3 rounded-full bg-emerald-500/90 hover:bg-emerald-500 flex items-center justify-center text-[7px] text-emerald-950 font-bold transition-all cursor-pointer group"
                            title="Toggle Fullscreen"
                            aria-label="Toggle Fullscreen"
                        >
                            <span className="opacity-0 group-hover:opacity-100">&plus;</span>
                        </button>

                        <div className={`hidden xs:flex items-center gap-1.5 ml-2 text-[11px] sm:text-xs font-semibold truncate ${
                            isDark ? 'text-emerald-400' : 'text-emerald-800'
                        }`}>
                            <span>gdg://visual-terminal</span>
                            <span className={`text-[10px] hidden sm:inline ${
                                isDark ? 'text-amber-400' : 'text-amber-600'
                            }`}>(v2.0)</span>
                        </div>
                    </div>

                    {/* Controls on Right */}
                    <div className="flex items-center gap-2 text-xs">
                        {/* Audio Toggle (Controls all visual & meow sounds) */}
                        <button
                            type="button"
                            onClick={toggleSound}
                            className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                                soundEnabled
                                    ? isDark
                                        ? 'text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30'
                                        : 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300/60'
                                    : isDark
                                        ? 'text-muted-foreground hover:text-foreground bg-muted/20'
                                        : 'text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200'
                            }`}
                            title={soundEnabled ? 'Audio Effects: ON (Click to mute)' : 'Audio Effects: MUTED (Click to enable)'}
                            aria-label={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
                        >
                            {soundEnabled ? (
                                <>
                                    <Volume2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                                    <span className="text-[10px] font-mono hidden sm:inline font-bold">SFX ON</span>
                                </>
                            ) : (
                                <>
                                    <VolumeX className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-mono hidden sm:inline">MUTED</span>
                                </>
                            )}
                        </button>

                        {/* Copy Logs */}
                        <button
                            type="button"
                            onClick={handleCopyLogs}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                                isDark
                                    ? 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/20'
                                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100'
                            }`}
                            title="Copy Terminal Logs"
                            aria-label="Copy Terminal Logs"
                        >
                            {copied ? (
                                <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsFullscreen((prev) => !prev)}
                            className={`p-1 rounded transition-colors cursor-pointer hidden sm:inline-flex ${
                                isDark
                                    ? 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/20'
                                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-100'
                            }`}
                            title="Toggle Fullscreen"
                            aria-label="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => closeTerminal()}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                                isDark
                                    ? 'text-emerald-400/80 hover:text-red-400 hover:bg-red-500/20'
                                    : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Close Terminal"
                            aria-label="Close"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Output Area */}
                <div
                    ref={outputRef}
                    className={`flex-1 overflow-y-auto p-3 sm:p-4 text-xs sm:text-sm font-mono space-y-1 select-text scrollbar-thin scrollbar-track-transparent ${
                        isDark ? 'scrollbar-thumb-emerald-500/30' : 'scrollbar-thumb-emerald-600/30'
                    }`}
                >
                    {terminalOutput.map((line, i) => (
                        <div
                            key={i}
                            className={`whitespace-pre-wrap break-all sm:break-normal leading-relaxed ${
                                line.type === 'input'
                                    ? isDark
                                        ? 'text-sky-300 font-semibold'
                                        : 'text-sky-700 font-bold'
                                    : line.type === 'error'
                                    ? isDark
                                        ? 'text-red-400 bg-red-950/20 px-2 py-0.5 rounded'
                                        : 'text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-semibold'
                                    : line.type === 'success'
                                    ? isDark
                                        ? 'text-emerald-300'
                                        : 'text-emerald-700 font-semibold'
                                    : line.type === 'system'
                                    ? isDark
                                        ? 'text-amber-300 font-medium'
                                        : 'text-amber-800 font-bold'
                                    : isDark
                                    ? 'text-gray-300'
                                    : 'text-slate-800 font-medium'
                            }`}
                        >
                            {line.text}
                        </div>
                    ))}
                </div>

                {/* Visual Quick Chips Bar */}
                <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 border-t overflow-x-auto scrollbar-none shrink-0 ${
                        isDark
                            ? 'bg-black/60 border-emerald-500/20'
                            : 'bg-slate-50 border-emerald-200'
                    }`}
                >
                    <span
                        className={`text-[10px] uppercase font-bold tracking-wider shrink-0 mr-1 hidden sm:inline ${
                            isDark ? 'text-emerald-500/60' : 'text-emerald-800'
                        }`}
                    >
                        Effects:
                    </span>
                    {QUICK_CHIPS.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => processCommand(chip)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer shrink-0 active:scale-95 ${
                                isDark
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-500 shadow-xs'
                            }`}
                        >
                            {chip}
                        </button>
                    ))}

                    {/* Touch History Steppers */}
                    <div className="ml-auto flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleHistoryStep('up')}
                            className={`p-1 rounded border cursor-pointer active:scale-90 transition-colors ${
                                isDark
                                    ? 'bg-muted/30 hover:bg-muted/50 text-emerald-400/80 hover:text-emerald-300 border-emerald-500/20'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-emerald-800 border-slate-300 shadow-xs'
                            }`}
                            title="Previous Command (↑)"
                            aria-label="Previous Command"
                        >
                            <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHistoryStep('down')}
                            className={`p-1 rounded border cursor-pointer active:scale-90 transition-colors ${
                                isDark
                                    ? 'bg-muted/30 hover:bg-muted/50 text-emerald-400/80 hover:text-emerald-300 border-emerald-500/20'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-emerald-800 border-slate-300 shadow-xs'
                            }`}
                            title="Next Command (↓)"
                            aria-label="Next Command"
                        >
                            <ArrowDown className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Input Row */}
                <div
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t shrink-0 ${
                        isDark
                            ? 'bg-black/90 border-emerald-500/30'
                            : 'bg-white border-emerald-200'
                    }`}
                >
                    <div className="flex items-center text-xs font-mono shrink-0 select-none">
                        <span className={`font-bold hidden xs:inline ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            gdg@fx
                        </span>
                        <span className={`font-bold xs:hidden ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            &gt;
                        </span>
                        <span className={`hidden xs:inline ${isDark ? 'text-muted-foreground' : 'text-slate-400'}`}>
                            :
                        </span>
                        <span className={`font-bold hidden sm:inline ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                            ~
                        </span>
                        <span className={`font-bold ml-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            $
                        </span>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`flex-1 bg-transparent text-xs sm:text-sm font-mono outline-none min-w-0 ${
                            isDark
                                ? 'text-emerald-300 placeholder-emerald-500/30'
                                : 'text-slate-900 placeholder-slate-400 font-medium'
                        }`}
                        placeholder="Type visual effect... (e.g., party, matrix, hack, fireworks, meow)"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                    />

                    {/* Run Button */}
                    <button
                        type="button"
                        onClick={() => processCommand(input)}
                        disabled={!input.trim()}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0 ${
                            isDark
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 disabled:hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white border border-emerald-600 shadow-xs'
                        }`}
                        aria-label="Execute Command"
                    >
                        <span>Run</span>
                        <Play className="w-2.5 h-2.5 fill-current" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default QuakeTerminal
