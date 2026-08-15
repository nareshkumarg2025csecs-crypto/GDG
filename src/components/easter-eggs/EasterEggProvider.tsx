/**
 * EasterEggProvider.tsx
 * 
 * Wrapper component that provides all Easter egg functionality.
 * Includes:
 * - Keyboard hooks (terminal toggle, Konami code)
 * - Overlay components (terminal, CRT, physics)
 * - Reduced motion detection
 */

import { useEffect } from 'react'
import { useTerminalKeyboard } from '@/hooks/useTerminalKeyboard'
import { useKonami } from '@/hooks/useKonami'
import { useEasterEggStore } from '@/store/easterEggStore'
import { QuakeTerminal } from './QuakeTerminal'
import { CRTOverlay } from './CRTOverlay'
import { PhysicsOverlay } from './PhysicsOverlay'
import { MatrixOverlay } from './MatrixOverlay'
import { PartyOverlay } from './PartyOverlay'
import { LeetProvider } from './LeetProvider'
import { HackerOverlay } from './HackerOverlay'

interface EasterEggProviderProps {
    children: React.ReactNode
}

export function EasterEggProvider({ children }: EasterEggProviderProps) {
    const { setReducedMotion } = useEasterEggStore()

    // Initialize keyboard listeners
    useTerminalKeyboard()
    useKonami()

    // Detect reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReducedMotion(mediaQuery.matches)

        const handleChange = (e: MediaQueryListEvent) => {
            setReducedMotion(e.matches)
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [setReducedMotion])

    return (
        <LeetProvider>
            <div data-no-leet data-easter-overlay="root">
                <QuakeTerminal />
                <CRTOverlay />
                <PhysicsOverlay />
                <MatrixOverlay />
                <PartyOverlay />
                <HackerOverlay />
            </div>

            {children}
        </LeetProvider>
    )
}

export default EasterEggProvider
