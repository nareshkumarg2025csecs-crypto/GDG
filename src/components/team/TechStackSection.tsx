import { motion } from 'framer-motion';

const TECH_STACK = [
    { name: 'React + Vite', description: 'Modern React with fast HMR', icon: '⚡', color: '#61DAFB' },
    { name: 'React Three Fiber', description: 'React renderer for Three.js', icon: '🎮', color: '#000000' },
    { name: 'Three.js', description: 'WebGL 3D graphics library', icon: '🔺', color: '#049EF4' },
    { name: 'GSAP', description: 'Professional animation library', icon: '🎬', color: '#88CE02' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework', icon: '🎨', color: '#06B6D4' },
    { name: 'Zustand', description: 'Minimal state management', icon: '🐻', color: '#764ABC' },
    { name: '@react-three/drei', description: 'Useful R3F helpers', icon: '🧰', color: '#FF9800' },
    { name: 'InstancedMesh', description: 'GPU instancing for performance', icon: '📦', color: '#4CAF50' },
    { name: 'Custom GLSL', description: 'Holographic card effects', icon: '✨', color: '#E91E63' },
    { name: 'Framer Motion', description: 'React animation library', icon: '🎭', color: '#FF0055' },
];

interface TechStackSectionProps {
    className?: string;
}

export default function TechStackSection({ className }: TechStackSectionProps) {
    return (
        <section className={`${className}`} aria-labelledby="tech-stack-heading">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h2 id="tech-stack-heading" className="text-2xl font-bold text-white mb-2">
                    Built With
                </h2>
                <p className="text-white/60 mb-6">
                    The technology powering this interactive experience
                </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {TECH_STACK.map((tech, index) => (
                    <motion.div
                        key={tech.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="group relative p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                        <div className="text-2xl mb-2">{tech.icon}</div>
                        <h3 className="font-semibold text-white text-sm mb-1">{tech.name}</h3>
                        <p className="text-white/50 text-xs">{tech.description}</p>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-50 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: tech.color }}
                        />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
