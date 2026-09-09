import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Lenis from 'lenis';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Simple smooth scroll state
interface SmoothScrollState {
    isEnabled: boolean;
    velocity: number;
    currentY: number;
    targetY: number;
}

const scrollState: SmoothScrollState = {
    isEnabled: false,
    velocity: 0,
    currentY: 0,
    targetY: 0,
};

let lenisInstance: Lenis | null = null;

/**
 * Initialize smooth scroll behavior using Lenis
 */
export function initSmoothScroll(): void {
    if (lenisInstance) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    scrollState.isEnabled = true;

    // Remove legacy smooth scroll css if present
    document.documentElement.style.scrollBehavior = 'auto';

    lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
        prevent: (node: any) => {
            if (!node) return false;
            const el = node as HTMLElement;
            const tagName = el.tagName?.toLowerCase();
            if (tagName === 'textarea' || tagName === 'input' || tagName === 'select' || tagName === 'pre' || tagName === 'code') {
                return true;
            }
            if (el.hasAttribute && el.hasAttribute('data-lenis-prevent')) {
                return true;
            }
            if (el.closest && el.closest('[data-lenis-prevent], textarea, pre, .overflow-y-auto, .overflow-auto')) {
                return true;
            }
            return false;
        },
    });

    lenisInstance.on('scroll', (e: any) => {
        scrollState.currentY = window.scrollY;
        scrollState.velocity = e.velocity * 10; // Normalize velocity roughly to previous values
        ScrollTrigger.update();
    });

    gsap.ticker.add((time) => {
        if (lenisInstance) {
            lenisInstance.raf(time * 1000);
        }
    });

    gsap.ticker.lagSmoothing(0);
}

/**
 * Get current scroll velocity
 */
export function getScrollVelocity(): number {
    return scrollState.velocity;
}

/**
 * Destroy smooth scroll
 */
export function destroySmoothScroll(): void {
    if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
    }
    scrollState.isEnabled = false;
    document.documentElement.style.scrollBehavior = '';
}

/**
 * Scroll to top immediately or smoothly (ideal for page transitions)
 */
export function scrollToTop(immediate: boolean = true): void {
    if (lenisInstance) {
        lenisInstance.scrollTo(0, { immediate });
    } else {
        window.scrollTo(0, 0);
    }
}

/**
 * Pause smooth scroll (e.g. when modal is open)
 */
export function stopLenis(): void {
    if (lenisInstance) {
        lenisInstance.stop();
    }
}

/**
 * Resume smooth scroll (e.g. when modal closes)
 */
export function startLenis(): void {
    if (lenisInstance) {
        lenisInstance.start();
    }
}

/**
 * Custom hook for using smooth scroll in React components
 */
export function useLenis(callback?: (state: SmoothScrollState) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            return;
        }

        initSmoothScroll();

        // Call callback with initial state
        if (callbackRef.current) {
            callbackRef.current(scrollState);
        }

        return () => {
            // We keep Lenis running globally, but we could add cleanup if needed
        };
    }, []);

    return scrollState;
}

/**
 * Create a velocity-based skew effect for DOM elements
 */
export function createVelocitySkew(element: HTMLElement, maxSkew: number = 5) {
    let animationId: number;

    const update = () => {
        const skew = Math.min(Math.max(scrollState.velocity * 0.1, -maxSkew), maxSkew);

        gsap.to(element, {
            skewY: skew,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: true,
        });

        animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);

    // Return cleanup function
    return () => {
        cancelAnimationFrame(animationId);
        gsap.to(element, { skewY: 0, duration: 0.3 });
    };
}

/**
 * Create GSAP ScrollTrigger timeline for camera bay navigation
 */
export function createBayScrollTimeline(
    containerSelector: string,
    onBayChange: (bayIndex: number, progress: number) => void
) {
    const container = document.querySelector(containerSelector);
    if (!container) return null;

    const timeline = gsap.timeline({
        scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                const totalBays = 5; // Leads, TechOps, Design, Media, Logistics
                const bayIndex = Math.min(Math.floor(progress * totalBays), totalBays - 1);
                onBayChange(bayIndex, progress);
            },
        },
    });

    return timeline;
}

/**
 * Animate camera to a specific position using GSAP
 */
export function animateCameraTo(
    camera: { position: { x: number; y: number; z: number } },
    target: { x: number; y: number; z: number },
    duration: number = 1.5
) {
    return gsap.to(camera.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease: 'power2.inOut',
    });
}

/**
 * Smooth scroll to an element
 */
export function scrollToElement(selector: string, offset: number = 0) {
    const element = document.querySelector(selector);
    if (!element) return;

    if (lenisInstance) {
        lenisInstance.scrollTo(element, { offset });
    } else {
        const top = element.getBoundingClientRect().top + window.scrollY + offset;
        gsap.to(window, {
            scrollTo: { y: top, autoKill: false },
            duration: 1,
            ease: 'power2.inOut',
        });
    }
}

export default {
    initSmoothScroll,
    destroySmoothScroll,
    useLenis,
    getScrollVelocity,
    createVelocitySkew,
    createBayScrollTimeline,
    animateCameraTo,
    scrollToElement,
};
