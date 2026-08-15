/**
 * easterEggStore.ts
 * 
 * Zustand store for all Easter egg features.
 * Persists unlocks and preferences to localStorage.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Terminal output types
interface TerminalLine {
    type: 'input' | 'output' | 'error' | 'success' | 'system'
    text: string
    timestamp: number
}

// Unlocks object for granular feature access
interface Unlocks {
    matrix: boolean
    noclip: boolean
    physics: boolean
    allCards: boolean // godmode unlocks all cards
}

export type EasterEggEffect =
    | 'crt'
    | 'matrix'
    | 'physics'
    | 'noclip'
    | 'leet'
    | 'party'
    | 'hacker'

export type PhysicsGravity = 'earth' | 'moon' | 'chaos'

interface EasterEggState {
    // Terminal state
    terminalOpen: boolean
    terminalOutput: TerminalLine[]
    commandHistory: string[]
    historyIndex: number

    // Effects toggles
    crtEnabled: boolean
    matrixMode: boolean
    physicsEnabled: boolean
    noclipMode: boolean
    leetMode: boolean
    partyMode: boolean
    hackerMode: boolean
    physicsGravity: PhysicsGravity

    // Unlocks (persisted)
    unlocks: Unlocks
    godMode: boolean

    // Accessibility
    reducedMotion: boolean
}

interface EasterEggActions {
    // Terminal
    toggleTerminal: () => void
    setTerminalOpen: (open: boolean) => void
    openTerminal: () => void
    closeTerminal: () => void
    addOutput: (line: Omit<TerminalLine, 'timestamp'>) => void
    addToHistory: (command: string) => void
    clearOutput: () => void
    setHistoryIndex: (index: number) => void

    // Effects
    setEffectEnabled: (effect: EasterEggEffect, enabled: boolean) => void
    toggleCRT: () => void
    toggleMatrix: () => void
    togglePhysics: () => void
    toggleNoclip: () => void
    toggleLeet: () => void
    toggleParty: () => void
    toggleHacker: () => void
    setPhysicsGravity: (gravity: PhysicsGravity) => void

    // Modes
    unlockPhysics: () => void
    activateParty: () => void
    enableGodMode: () => void
    disablePhysics: () => void

    // System
    setReducedMotion: (reduced: boolean) => void
    reset: () => void
}

type EasterEggStore = EasterEggState & EasterEggActions

const MAX_HISTORY = 100
const MAX_OUTPUT = 200
const STORE_VERSION = 2

const initialUnlocks: Unlocks = {
    matrix: false,
    noclip: false,
    physics: false,
    allCards: false,
}

const initialPersistedState: {
    unlocks: Unlocks
    godMode: boolean
    commandHistory: string[]
    crtEnabled: boolean
    leetMode: boolean
    partyMode: boolean
    hackerMode: boolean
    physicsGravity: PhysicsGravity
} = {
    unlocks: initialUnlocks,
    godMode: false,
    commandHistory: [],
    crtEnabled: false,
    leetMode: false,
    partyMode: false,
    hackerMode: false,
    physicsGravity: 'earth' as PhysicsGravity,
}

function isValidPhysicsGravity(value: unknown): value is PhysicsGravity {
    return value === 'earth' || value === 'moon' || value === 'chaos'
}

export const useEasterEggStore = create<EasterEggStore>()(
    persist(
        (set, get) => ({
            // Initial state
            terminalOpen: false,
            terminalOutput: [],
            commandHistory: [],
            historyIndex: -1,
            crtEnabled: false,
            matrixMode: false,
            physicsEnabled: false,
            noclipMode: false,
            leetMode: false,
            partyMode: false,
            hackerMode: false,
            physicsGravity: 'earth',
            unlocks: initialUnlocks,
            godMode: false,
            reducedMotion: false,

            // Terminal actions
            toggleTerminal: () => set((state) => ({
                terminalOpen: !state.terminalOpen,
                historyIndex: -1
            })),

            setTerminalOpen: (open) => set({ terminalOpen: open, historyIndex: -1 }),

            openTerminal: () => set({ terminalOpen: true, historyIndex: -1 }),

            closeTerminal: () => set({ terminalOpen: false, historyIndex: -1 }),

            addOutput: (line) => set((state) => {
                const newOutput = [...state.terminalOutput, { ...line, timestamp: Date.now() }]
                // Cap output to prevent unbounded growth
                if (newOutput.length > MAX_OUTPUT) {
                    newOutput.splice(0, newOutput.length - MAX_OUTPUT)
                }
                return { terminalOutput: newOutput }
            }),

            addToHistory: (command) => set((state) => {
                // Don't add duplicates of the last command
                if (state.commandHistory[state.commandHistory.length - 1] === command) {
                    return { historyIndex: -1 }
                }
                const newHistory = [...state.commandHistory, command]
                // Cap history
                if (newHistory.length > MAX_HISTORY) {
                    newHistory.splice(0, newHistory.length - MAX_HISTORY)
                }
                return { commandHistory: newHistory, historyIndex: -1 }
            }),

            clearOutput: () => set({ terminalOutput: [] }),

            setHistoryIndex: (index) => set({ historyIndex: index }),

            // Effect toggles
            setEffectEnabled: (effect, enabled) => set((state) => {
                if (effect === 'physics' && enabled && !state.unlocks.physics && !state.godMode) {
                    get().addOutput({ type: 'error', text: 'Physics mode is locked. Try the Konami code!' })
                    return {}
                }

                if (effect === 'noclip' && enabled && !state.unlocks.noclip && !state.godMode) {
                    get().addOutput({ type: 'error', text: 'Noclip mode is locked. Try "godmode" first.' })
                    return {}
                }

                switch (effect) {
                    case 'crt':
                        return { crtEnabled: enabled }
                    case 'matrix':
                        return { matrixMode: enabled }
                    case 'physics':
                        return { physicsEnabled: enabled }
                    case 'noclip':
                        return { noclipMode: enabled }
                    case 'leet':
                        return { leetMode: enabled }
                    case 'party':
                        return { partyMode: enabled }
                    case 'hacker':
                        return { hackerMode: enabled }
                    default:
                        return {}
                }
            }),

            toggleCRT: () => {
                const { crtEnabled, setEffectEnabled } = get()
                setEffectEnabled('crt', !crtEnabled)
            },

            toggleMatrix: () => {
                const { matrixMode, setEffectEnabled } = get()
                setEffectEnabled('matrix', !matrixMode)
            },

            togglePhysics: () => {
                const { physicsEnabled, setEffectEnabled } = get()
                setEffectEnabled('physics', !physicsEnabled)
            },

            toggleNoclip: () => {
                const { noclipMode, setEffectEnabled } = get()
                setEffectEnabled('noclip', !noclipMode)
            },

            toggleLeet: () => {
                const { leetMode, setEffectEnabled } = get()
                setEffectEnabled('leet', !leetMode)
            },

            toggleParty: () => {
                const { partyMode, setEffectEnabled } = get()
                setEffectEnabled('party', !partyMode)
            },

            toggleHacker: () => {
                const { hackerMode, setEffectEnabled } = get()
                setEffectEnabled('hacker', !hackerMode)
            },

            setPhysicsGravity: (gravity) => {
                if (!isValidPhysicsGravity(gravity)) return
                set({ physicsGravity: gravity })
            },

            // Mode actions
            unlockPhysics: () => set((state) => ({
                unlocks: {
                    ...state.unlocks,
                    physics: true,
                },
            })),

            activateParty: () => {
                get().setEffectEnabled('party', true)
            },

            enableGodMode: () => set({
                godMode: true,
                unlocks: {
                    matrix: true,
                    noclip: true,
                    physics: true,
                    allCards: true,
                }
            }),

            disablePhysics: () => set({ physicsEnabled: false }),

            // System
            setReducedMotion: (reduced) => set({ reducedMotion: reduced }),

            reset: () => set({
                terminalOpen: false,
                terminalOutput: [],
                crtEnabled: false,
                matrixMode: false,
                physicsEnabled: false,
                noclipMode: false,
                leetMode: false,
                partyMode: false,
                hackerMode: false,
                physicsGravity: 'earth',
                historyIndex: -1,
            }),
        }),
        {
            name: 'gdg-easter-eggs',
            version: STORE_VERSION,
            // Only persist certain fields
            partialize: (state) => ({
                unlocks: state.unlocks,
                godMode: state.godMode,
                commandHistory: state.commandHistory,
                crtEnabled: state.crtEnabled,
                leetMode: state.leetMode,
                partyMode: state.partyMode,
                hackerMode: state.hackerMode,
                physicsGravity: state.physicsGravity,
            }),
            migrate: (persistedState) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return initialPersistedState
                }

                const state = persistedState as Partial<typeof initialPersistedState> & {
                    unlocks?: Partial<Unlocks>
                    physicsGravity?: unknown
                }

                return {
                    ...initialPersistedState,
                    ...state,
                    unlocks: {
                        ...initialUnlocks,
                        ...(state.unlocks ?? {}),
                    },
                    physicsGravity: isValidPhysicsGravity(state.physicsGravity)
                        ? state.physicsGravity
                        : 'earth',
                }
            },
        }
    )
)

export default useEasterEggStore
