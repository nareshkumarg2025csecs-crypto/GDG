import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, Sparkles } from '@react-three/drei';
import { Suspense } from 'react';

const helmets = [
  { id: 1, name: 'Season 2025', year: '2025', color: '#d4ff00', accent: '#ff8000' },
  { id: 2, name: 'Discoball', year: '2025', color: '#c0c0c0', accent: '#ffffff' },
  { id: 3, name: 'Dark Glitter', year: '2025', color: '#1a1a2e', accent: '#d4ff00' },
  { id: 4, name: 'Monaco Special', year: '2024', color: '#ff6b00', accent: '#d4ff00' },
  { id: 5, name: 'Porcelain', year: '2024', color: '#f5f5f5', accent: '#0a0a0a' },
  { id: 6, name: 'Japan GP', year: '2024', color: '#ff0000', accent: '#ffffff' },
  { id: 7, name: 'Miami Neon', year: '2024', color: '#00ff88', accent: '#ff00ff' },
  { id: 8, name: 'Stealth Mode', year: '2024', color: '#0a0a0a', accent: '#d4ff00' },
];

const MiniHelmet = ({ color, accent, hovered }: { color: string; accent: string; hovered: boolean }) => (
  <Float speed={hovered ? 4 : 2} rotationIntensity={hovered ? 1.5 : 0.5} floatIntensity={0.4}>
    <group scale={hovered ? 1.15 : 1}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial color={color} metalness={0.95} roughness={0.08} distort={hovered ? 0.15 : 0.08} speed={3} envMapIntensity={2} />
      </mesh>
      <mesh position={[0, 0.1, 0.8]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.1, 0.35, 0.2]} />
        <meshStandardMaterial color="#0a0a0a" metalness={1} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[1.02, 0.025, 16, 100]} />
        <meshStandardMaterial color={accent} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
    {hovered && <Sparkles count={30} scale={3} size={3} speed={0.5} color={color} />}
  </Float>
);

const HelmetCard = ({ helmet, index }: { helmet: typeof helmets[0]; index: number }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-pointer"
    >
      <motion.div 
        className="aspect-square rounded-2xl overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, hsl(220 15% 12%), hsl(220 20% 8%))` }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4 }}
      >
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 border-2 border-lime border-t-transparent rounded-full animate-spin" /></div>}>
          <Canvas camera={{ position: [0, 0, 4], fov: 40 }} dpr={[1, 2]}>
            <ambientLight intensity={0.4} />
            <spotLight position={[5, 5, 5]} intensity={1.5} color={helmet.color} />
            <pointLight position={[-5, -5, 5]} intensity={0.5} color={helmet.accent} />
            <MiniHelmet color={helmet.color} accent={helmet.accent} hovered={hovered} />
            <Environment preset="studio" />
          </Canvas>
        </Suspense>
        <motion.div className="absolute inset-0 bg-gradient-to-t from-lime/60 via-transparent to-transparent" initial={{ opacity: 0 }} animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }} />
        <motion.div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-lime" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.5 }} />
        <motion.div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-lime" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.5 }} />
      </motion.div>
      <motion.div className="mt-4 flex justify-between items-end" animate={{ y: hovered ? -5 : 0 }}>
        <div>
          <h4 className="font-display text-xl text-foreground">{helmet.name}</h4>
          <p className="text-sm text-muted-foreground">{helmet.year}</p>
        </div>
        <motion.div className="w-4 h-4 rounded-full" style={{ backgroundColor: helmet.color }} animate={{ scale: hovered ? 1.2 : 1 }} />
      </motion.div>
    </motion.div>
  );
};

const HallOfFame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <section id="hall-of-fame" ref={containerRef} className="py-32 relative overflow-hidden noise">
      <div className="absolute inset-0 gradient-hero opacity-30" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <p className="text-sm uppercase tracking-[0.4em] text-lime mb-4">Helmet Collection</p>
          <h2 className="text-display-lg font-display">HALL OF <span className="text-lime glow-text">FAME</span></h2>
          <p className="mt-6 text-muted-foreground font-body max-w-xl text-lg">Iconic designs that push the boundaries of motorsport aesthetics.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {helmets.map((helmet, index) => (<HelmetCard key={helmet.id} helmet={helmet} index={index} />))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 text-center">
          <motion.a href="#on-track" whileHover={{ scale: 1.05, boxShadow: '0 0 40px hsl(75 100% 50% / 0.4)' }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-3 bg-lime text-background px-10 py-5 rounded-full font-body font-semibold text-lg">View Full Collection</motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HallOfFame;
