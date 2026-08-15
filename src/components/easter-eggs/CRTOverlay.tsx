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
                <div className="absolute inset-0 crt-power-on" />
                <div className="absolute inset-0 crt-scanlines" />
                <div className="absolute inset-0 crt-vignette" />
                <div className="absolute inset-0 crt-rgb-shift" />
                {!reducedMotion && <div className="absolute inset-0 crt-flicker" />}
            </div>

            <style>{`
                .crt-shell {
                    animation: crt-power-on 280ms ease-out;
                }

                .crt-scanlines {
                    background-image:
                        repeating-linear-gradient(
                            0deg,
                            rgba(255, 255, 255, 0.02) 0px,
                            rgba(255, 255, 255, 0.02) 1px,
                            rgba(0, 0, 0, 0.14) 1px,
                            rgba(0, 0, 0, 0.14) 3px
                        );
                    opacity: 0.42;
                }

                .crt-vignette {
                    background:
                        radial-gradient(circle at center, transparent 42%, rgba(0, 0, 0, 0.18) 72%, rgba(0, 0, 0, 0.5) 100%);
                }

                .crt-rgb-shift {
                    opacity: 0.16;
                    background:
                        linear-gradient(90deg, rgba(66, 133, 244, 0.08), transparent 22%, transparent 78%, rgba(234, 67, 53, 0.08)),
                        linear-gradient(180deg, transparent, rgba(251, 188, 4, 0.03), transparent);
                    mix-blend-mode: screen;
                }

                .crt-flicker {
                    background: rgba(255, 255, 255, 0.03);
                    animation: crt-flicker 180ms steps(2) infinite;
                }

                .crt-power-on {
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.06), transparent 65%);
                    animation: crt-glow 600ms ease-out;
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
                    0% { opacity: 0.35; }
                    100% { opacity: 0; }
                }

                @keyframes crt-flicker {
                    0%, 100% { opacity: 0.02; }
                    50% { opacity: 0.045; }
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
