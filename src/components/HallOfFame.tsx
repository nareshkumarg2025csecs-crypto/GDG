import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import { Suspense } from 'react';

const helmets = [
  { id: 1, name: 'Season', year: '2025', color: '#d4ff00' },
  { id: 2, name: 'Discoball', year: '2025', color: '#c0c0c0' },
  { id: 3, name: 'Dark Glitter', year: '2025', color: '#1a1a2e' },
  { id: 4, name: 'Season', year: '2024', color: '#ff6b00' },
  { id: 5, name: 'Porcelain', year: '2024', color: '#f5f5f5' },
  { id: 6, name: 'Japan', year: '2024', color: '#ff0000' },
  { id: 7, name: 'GIF', year: '2024', color: '#00ff88' },
  { id: 8, name: 'Dark Mode', year: '2024', color: '#0a0a0a' },
];

const MiniHelmet = ({ color, hovered }: { color: string; hovered: boolean }) => {
  return (
    <Float speed={hovered ? 4 : 2} rotationIntensity={hovered ? 1 : 0.3} floatIntensity={0.3}>
      <mesh scale={hovered ? 1.2 : 1}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          distort={hovered ? 0.2 : 0.1}
          speed={3}
        />
      </mesh>
      <mesh position={[0, 0.1, 0.8]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1, 0.3, 0.15]} />
        <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
      </mesh>
    </Float>
  );
};

const HelmetCard = ({ helmet, index }: { helmet: typeof helmets[0]; index: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-pointer"
    >
      <div className="aspect-square bg-gradient-to-b from-muted to-cream-dark rounded-2xl overflow-hidden relative">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-lime border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[5, 5, 5]} intensity={1} color={helmet.color} />
            <pointLight position={[-5, -5, 5]} intensity={0.5} />
            <MiniHelmet color={helmet.color} hovered={hovered} />
            <Environment preset="studio" />
          </Canvas>
        </Suspense>

        {/* Hover gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-lime/80 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4"
        animate={{ y: hovered ? -10 : 0 }}
      >
        <h4 className="font-display text-xl">{helmet.name}</h4>
        <p className="text-sm text-muted-foreground">{helmet.year}</p>
      </motion.div>

      {/* Corner accents on hover */}
      <motion.div
        className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-lime"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.5 }}
      />
      <motion.div
        className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-lime"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.5 }}
      />
    </motion.div>
  );
};

const HallOfFame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <section ref={containerRef} className="py-32 bg-gradient-to-b from-background to-cream-dark relative overflow-hidden">
      {/* Large rotating helmet in background */}
      <motion.div
        style={{ rotateY }}
        className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 pointer-events-none"
      >
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.3} />
          <mesh scale={3}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#d4ff00" metalness={0.5} roughness={0.5} wireframe />
          </mesh>
        </Canvas>
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-lime mb-4">Helmets</p>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-display">
            HALL OF FAME
          </h2>
          <p className="mt-6 text-muted-foreground font-body max-w-xl">
            From his iconic blobs to innovative one-off designs, Lando has always been
            passionate about designing innovative and memorable helmets.
          </p>
        </motion.div>

        {/* Helmet grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {helmets.map((helmet, index) => (
            <HelmetCard key={helmet.id} helmet={helmet} index={index} />
          ))}
        </div>

        {/* View more link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <motion.a
            href="#on-track"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-body font-medium"
          >
            View On Track
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HallOfFame;
