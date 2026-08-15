import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

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

/**
 * Initialize smooth scroll behavior using CSS and GSAP
 * This is a lightweight alternative to Lenis that works without additional packages
 */
export function initSmoothScroll(): void {
    if (scrollState.isEnabled) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    scrollState.isEnabled = true;

    // Apply smooth scroll CSS
    document.documentElement.style.scrollBehavior = 'smooth';

    // Track scroll velocity for effects
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();

    const updateVelocity = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        const deltaY = window.scrollY - lastScrollY;

        scrollState.velocity = deltaY / Math.max(deltaTime, 1) * 16; // Normalize to ~60fps
        scrollState.currentY = window.scrollY;

        lastScrollY = window.scrollY;
        lastTime = currentTime;

        // Decay velocity
        scrollState.velocity *= 0.95;

        requestAnimationFrame(updateVelocity);
    };

    requestAnimationFrame(updateVelocity);

    // Update ScrollTrigger on scroll
    window.addEventListener('scroll', () => {
        ScrollTrigger.update();
    }, { passive: true });
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
    scrollState.isEnabled = false;
    document.documentElement.style.scrollBehavior = '';
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
            // Don't destroy on unmount as it's global
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

    const top = element.getBoundingClientRect().top + window.scrollY + offset;

    gsap.to(window, {
        scrollTo: { y: top, autoKill: false },
        duration: 1,
        ease: 'power2.inOut',
    });
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
