/**
 * useKonami.ts
 * 
 * Hook to detect the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
 * Uses a circular buffer of last 10 keystrokes.
 * Shows toast on activation.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'
import { useToast } from '@/hooks/use-toast'

// Konami code sequence
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
]

// GDG secret code
const GDG_CODE = ['g', 'd', 'g']

// Check if the event target is an input element
function isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false

    const tagName = target.tagName.toLowerCase()
    if (['input', 'textarea', 'select'].includes(tagName)) return true
    if (target.isContentEditable) return true
    if (target.closest('[contenteditable="true"]')) return true

    return false
}

function hasModifier(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.metaKey || e.altKey
}

export function useKonami() {
    const bufferRef = useRef<string[]>([])
    const { toast } = useToast()

    const checkSequence = useCallback((sequence: string[]) => {
        if (bufferRef.current.length < sequence.length) return false
        const recent = bufferRef.current.slice(-sequence.length)
        return sequence.every((key, i) => recent[i].toLowerCase() === key.toLowerCase())
    }, [])

    const activatePhysics = useCallback(() => {
        const store = useEasterEggStore.getState()
        store.unlockPhysics()
        store.setEffectEnabled('physics', true)

        toast({
            title: "🎮 KONAMI CODE ACTIVATED",
            description: "Physics mode enabled! Elements are now falling...",
            duration: 4000,
        })
    }, [toast])

    const activateGDG = useCallback(() => {
        const store = useEasterEggStore.getState()
        store.activateParty()
        store.addOutput({ type: 'success', text: 'GDG Secret Code Activated! Time to party!' })
        
        toast({
            title: "🚀 GDG MODE ACTIVATED",
            description: "Welcome to the inner circle! 🥳",
            duration: 4000,
        })
    }, [toast])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Don't listen if typing in input
            if (isInputElement(e.target)) return

            // Ignore modifier combos and long-press repeats
            if (hasModifier(e) || e.repeat) return

            // Don't listen if terminal is open
            if (useEasterEggStore.getState().terminalOpen) return

            // Add to circular buffer (max 20 to accommodate multiple sequences)
            bufferRef.current.push(e.key)
            if (bufferRef.current.length > 20) {
                bufferRef.current.shift()
            }

            // Check sequences
            if (checkSequence(KONAMI_CODE)) {
                activatePhysics()
                bufferRef.current = [] // Reset buffer
            } else if (checkSequence(GDG_CODE)) {
                activateGDG()
                bufferRef.current = [] // Reset buffer
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [checkSequence, activatePhysics, activateGDG])
}

export default useKonami
