"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader() {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState("");
    const fullText = "npm run build: masterpiece";

    useEffect(() => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setTimeout(() => setLoading(false), 500);
            }
            setProgress(Math.round(currentProgress));
        }, 150);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
            }
        }, 50);

        return () => clearInterval(typingInterval);
    }, []);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.5,
                        filter: "blur(20px)",
                        transition: { duration: 0.8, ease: "circOut" }
                    }}
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black font-mono text-white"
                >
                    <div className="w-full max-w-md p-6 border border-white/20 bg-zinc-900 rounded-lg shadow-2xl">
                        <div className="flex gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex text-blue-400">
                                <span className="mr-2">$</span>
                                <span>{text}</span>
                                <motion.span
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="w-2 h-5 bg-white ml-1"
                                />
                            </div>
                            <div className="w-full bg-white/10 h-1 mt-6 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-google-blue"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500 mt-2">
                                <span>Building chunks...</span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
