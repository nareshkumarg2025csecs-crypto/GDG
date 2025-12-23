
import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";

interface ScatteredGalleryProps {
    images: string[];
}

const ScatteredGallery = ({ images }: ScatteredGalleryProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Create a larger set of images for the scatter effect if we don't have enough
    const displayImages = images.length < 5 ? [...images, ...images, ...images].slice(0, 12) : images;

    return (
        <div className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center perspective-[2000px]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black pointer-events-none z-20" />

            {/* 3D Scatter Container */}
            <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
                {displayImages.map((src, i) => {
                    // Random positions for "scatter" effect
                    const randomX = (i % 2 === 0 ? 1 : -1) * (Math.random() * 40 + 10);
                    const randomY = (i % 3 === 0 ? -1 : 1) * (Math.random() * 30 + 10);
                    const randomRotate = (Math.random() - 0.5) * 40;
                    const randomZ = Math.random() * 200;

                    return (
                        <motion.div
                            key={i}
                            className="absolute w-[250px] md:w-[350px] aspect-[4/3] bg-white p-2 shadow-2xl rounded-sm will-change-transform"
                            style={{
                                x: `${randomX}%`,
                                y: `${randomY}%`,
                                z: randomZ,
                                rotate: randomRotate,
                            }}
                            initial={{ opacity: 0, scale: 0.5, z: -1000 }}
                            whileInView={{
                                opacity: 1,
                                scale: 1,
                                z: randomZ,
                                transition: { duration: 1, delay: i * 0.1, ease: "easeOut" }
                            }}
                            whileHover={{
                                scale: 1.2,
                                zIndex: 50,
                                rotate: 0,
                                transition: { duration: 0.3 }
                            }}
                            viewport={{ once: true }}
                        >
                            <div className="w-full h-full overflow-hidden bg-gray-100 relative group">
                                <img
                                    src={src}
                                    alt="Gallery Archive"
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Ambient Text */}
            <div className="absolute bottom-10 left-10 z-30 pointer-events-none">
                <h3 className="text-white/20 text-6xl font-display uppercase tracking-widest blur-[2px]">Archive</h3>
            </div>
        </div>
    );
};

export default ScatteredGallery;
