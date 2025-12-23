/**
 * EventsSection.tsx
 * 
 * Wrapper component for the Events experience.
 * Handles mobile detection and renders the 3D experience.
 * 
 * Future: Can add toggle for 2D horizontal fallback view.
 */

import { useState, useEffect } from 'react'
import { Events3DExperience } from './Events3DExperience'

/**
 * Detects if the user is on a mobile device.
 */
function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [breakpoint])

    return isMobile
}

/**
 * Main Events section wrapper.
 * Currently renders the 3D experience.
 * Can be extended to support a 2D fallback toggle.
 */
export function EventsSection() {
    const isMobile = useIsMobile()

    return <Events3DExperience isMobile={isMobile} />
}

export default EventsSection
