import { useLayoutEffect, useRef, useEffect } from 'react';
import { Flip } from 'gsap/all';
import gsap from 'gsap';
import { GalleryItem } from './data/galleryData';
import { useTheme } from '@/contexts/ThemeContext';

gsap.registerPlugin(Flip);

interface GalleryGridProps {
    items: GalleryItem[];
    onItemClick: (item: GalleryItem) => void;
    // We pass a key to force re-running the flip logic significantly if needed, 
    // but usually items dependency is enough.
}

const GalleryGrid = ({ items, onItemClick }: GalleryGridProps) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const q = gsap.utils.selector(containerRef);

    // Store the state of the layout
    const stateRef = useRef<Flip.FlipState | null>(null);

    // 1. Before the DOM updates (via props change), we need to capture state?
    // React updates verify quickly. 
    // The common pattern for GSAP Flip in React is to use `useLayoutEffect`.
    // When `items` changes, React renders the new DOM immediately.
    // BUT `useLayoutEffect` runs *after* the DOM mutation but *before* the browser paints.
    // So we are already in the "Final" state.
    // We needed the "Initial" state.

    // To solve this, we need to capture the state *before* the update.
    // This usually requires the parent to orchestrate:
    // Parent: 
    //   const state = Flip.getState(".item");
    //   setFilter(newFilter);
    //   <LayoutEffect> Flip.from(state) </LayoutEffect>

    // Since we are building the `GalleryGrid`, let's make it a "dumb" component 
    // that just renders, and let the `Gallery.tsx` page handle the Flip orchestration 
    // because *it* controls the state change.

    // HOWEVER, I will include the structure here to be styled correctly for Flip (absolute positioning rules etc usually handled by Flip).
    // Actually, Flip works great with flex/grid.

    return (
        <div
            ref={containerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 min-h-[50vh]"
        >
            {items.map((item) => (
                <div
                    className="gallery-item group relative aspect-[4/5] w-full overflow-hidden rounded-xl cursor-pointer transition-colors duration-300"
                    style={{
                        backgroundColor: theme === 'light' ? 'rgb(var(--creme-200))' : '#171717',
                        borderColor: theme === 'light' ? 'rgb(var(--creme-300))' : 'rgba(255,255,255,0.1)'
                    }}
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    data-flip-id={item.id}
                >
                    {/* Image Layer */}
                    <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 opacity-80"
                        style={{
                            background: theme === 'light'
                                ? 'linear-gradient(to top, rgb(var(--creme-200)), transparent)'
                                : 'linear-gradient(to top, #050505, transparent)'
                        }}
                    />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-6 w-full transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="flex justify-between items-end mb-2">
                            <span
                                className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-widest rounded backdrop-blur-md"
                                style={{
                                    color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : '#4285F4',
                                    background: theme === 'light' ? 'rgb(var(--creme-300))' : '#4285F41A',
                                    border: theme === 'light' ? '1px solid rgb(var(--creme-300))' : '1px solid rgba(66,133,244,0.2)'
                                }}
                            >
                                {item.category}
                            </span>
                            {item.featured && <span className="text-[10px] font-mono" style={{ color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : '#FBBC04' }}>★</span>}
                        </div>
                        <h3 className="text-xl font-display mb-1 leading-tight" style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : 'white' }}>{item.title}</h3>
                        <p className="text-xs font-mono" style={{ color: theme === 'light' ? 'rgba(var(--text-primary-raw), 0.7)' : 'rgba(255,255,255,0.5)' }}>{item.date}</p>
                    </div>

                    {/* 3D Indicator */}
                    {item.splatUrl && (
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-[#4285F4]/50 transition-colors">
                            <div className="w-2 h-2 bg-[#4285F4] rounded-full animate-pulse shadow-[0_0_10px_#4285F4]" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default GalleryGrid;
