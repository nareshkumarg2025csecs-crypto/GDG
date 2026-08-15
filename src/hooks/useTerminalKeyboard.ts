/**
 * useTerminalKeyboard.ts
 * 
 * Hook to detect ` or ~ keypress to toggle terminal.
 * Ignores input when user is typing in forms or with modifier keys.
 */

import { useEffect } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'

// Check if the event target is an input element
function isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false

    const tagName = target.tagName.toLowerCase()

    // Standard input elements
    if (['input', 'textarea', 'select'].includes(tagName)) return true

    // Contenteditable
    if (target.isContentEditable) return true

    // Check for common editor classes
    if (target.closest('[contenteditable="true"]')) return true
    if (target.closest('.CodeMirror, .monaco-editor, .ace_editor')) return true

    return false
}

// Check if modifier keys are held
function hasModifier(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.metaKey || e.altKey
}

export function useTerminalKeyboard() {
    const { setTerminalOpen, terminalOpen } = useEasterEggStore()

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Don't trigger if typing in input
            if (isInputElement(e.target)) return

            // Don't trigger with modifier keys
            if (hasModifier(e)) return

            // Ignore long-press repeats for secret controls
            if (e.repeat) return

            // Toggle terminal on backtick or tilde
            if (e.key === '`' || e.key === '~') {
                e.preventDefault()
                setTerminalOpen(!useEasterEggStore.getState().terminalOpen)
            }

            // Close terminal on Escape
            if (e.key === 'Escape' && terminalOpen) {
                e.preventDefault()
                setTerminalOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [setTerminalOpen, terminalOpen])
}

export default useTerminalKeyboard
