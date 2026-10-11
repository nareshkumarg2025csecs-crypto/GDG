/**
 * CRTOverlay.tsx
 *
 * Retro CRT monitor effect overlay with a subtle power-on transition.
 */

import { useEasterEggStore } from '@/store/easterEggStore'

export function CRTOverlay() {
    const { crtEnabled, reducedMotion } = useEasterEggStore()

    if (!crtEnabled) return null

    return (
        <>
            <div
                className="fixed inset-0 z-[9991] pointer-events-none crt-shell"
                data-no-leet
                data-easter-overlay="crt"
            >
                {/* Light retro scanlines overlay without dark background */}
                <div className="absolute inset-0 crt-power-on" />
                <div className="absolute inset-0 crt-scanlines" />
                <div className="absolute inset-0 crt-vignette" />
                <div className="absolute inset-0 crt-rgb-shift" />
                {!reducedMotion && <div className="hidden sm:block absolute inset-0 crt-flicker" />}
            </div>

            <style>{`
                .crt-shell {
                    animation: crt-power-on 280ms ease-out;
                }

                .crt-scanlines {
                    background-image:
                        repeating-linear-gradient(
                            0deg,
                            transparent 0px,
                            transparent 2px,
                            rgba(0, 0, 0, 0.12) 2px,
                            rgba(0, 0, 0, 0.12) 4px
                        );
                    opacity: 0.65;
                }

                .crt-vignette {
                    background:
                        radial-gradient(circle at center, transparent 60%, rgba(0, 0, 0, 0.2) 100%);
                }

                .crt-rgb-shift {
                    opacity: 0.08;
                    background:
                        linear-gradient(90deg, rgba(66, 133, 244, 0.05), transparent 22%, transparent 78%, rgba(234, 67, 53, 0.05));
                }

                .crt-flicker {
                    background: rgba(255, 255, 255, 0.015);
                    animation: crt-flicker 220ms steps(2) infinite;
                }

                .crt-power-on {
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.04), transparent 65%);
                    animation: crt-glow 500ms ease-out;
                }

                @keyframes crt-power-on {
                    0% {
                        opacity: 0;
                        transform: scaleY(0.06);
                    }
                    60% {
                        opacity: 1;
                        transform: scaleY(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: scaleY(1);
                    }
                }

                @keyframes crt-glow {
                    0% { opacity: 0.25; }
                    100% { opacity: 0; }
                }

                @keyframes crt-flicker {
                    0%, 100% { opacity: 0.01; }
                    50% { opacity: 0.025; }
                }

                @media (max-width: 768px) {
                    .crt-flicker {
                        display: none;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .crt-shell,
                    .crt-power-on,
                    .crt-flicker {
                        animation: none;
                    }
                }
            `}</style>
        </>
    )
}

export default CRTOverlay
