import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Splat, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GalleryItem } from './data/galleryData';
import { motion, AnimatePresence } from 'framer-motion';

interface SplatViewerProps {
    item: GalleryItem | null;
    onClose: () => void;
}

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}



const SplatViewer = ({ item, onClose }: SplatViewerProps) => {
    // Reset state when item changes
    const [mountKey, setMountKey] = useState(0);

    useEffect(() => {
        if (item) {
            setMountKey(k => k + 1);
        }
    }, [item]);

    if (!item) return null;

    // 2D Fallback View
    const FallbackView = () => (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
                src={item.fallbackImage}
                alt={item.title}
                className="max-w-full max-h-4/5 object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-10 left-0 w-full text-center">
                <p className="text-white/50 text-xs font-mono mb-2">3D MEMORY UNAVAILABLE</p>
                <h2 className="text-2xl font-display text-white">{item.title}</h2>
            </div>
        </div>
    );

    const LoadingView = () => (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-[#4285F4] font-mono text-xs tracking-widest animate-pulse">
                LOADING MEMORY...
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {item && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 p-4 text-white hover:text-red-500 transition-colors"
                    >
                        CLOSE [X]
                    </button>

                    <div className="w-full h-full relative">
                        {/* 3D Scene */}
                        {!item.splatUrl ? (
                            <FallbackView />
                        ) : (
                            <div className="w-full h-full cursor-move">
                                <ErrorBoundary key={mountKey} fallback={<FallbackView />}>
                                    <Canvas dpr={[1, 2]}>
                                        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
                                        <OrbitControls
                                            enableZoom={true}
                                            enablePan={true}
                                            rotateSpeed={0.5}
                                            autoRotate={false}
                                        />
                                        <ambientLight intensity={0.5} />
                                        <group rotation={[0, 0, 0]}>
                                            <Suspense fallback={null}>
                                                <Splat
                                                    src={item.splatUrl}
                                                    scale={1.5}
                                                    position={[0, 0, 0]}
                                                />
                                            </Suspense>
                                        </group>
                                    </Canvas>
                                    {/* Suspense for loading UI overlay - actually Canvas Suspense is internal. 
                                        We can put a Loader URL or just rely on the Canvas 'onCreated' or separate state.
                                        For now, keeping it simple. */}
                                </ErrorBoundary>
                            </div>
                        )}

                        {/* Caption Overlay */}
                        <div className="absolute bottom-10 left-10 pointer-events-none">
                            <h2 className="text-4xl font-display text-white mb-2">{item.title}</h2>
                            <p className="text-white/60 font-mono text-sm max-w-md">
                                {item.description || "Interactive 3D capture from the event."}
                            </p>
                            <div className="mt-4 flex gap-4 text-[10px] font-mono text-[#4285F4]">
                                <span>[ LMB ] ROTATE</span>
                                <span>[ SCROLL ] ZOOM</span>
                                <span>[ RMB ] PAN</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplatViewer;
