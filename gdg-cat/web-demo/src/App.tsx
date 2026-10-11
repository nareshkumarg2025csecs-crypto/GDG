import { useState } from 'react';
import { motion } from 'framer-motion';
import GdgCatMascot from './components/3d/GdgCatMascot';

// Camera presets for the eight reference angles (distance 5.2 from the kitten, looking at the chest).
const R = 5.2;
const at = (deg: number): [number, number, number] => {
  const a = (deg * Math.PI) / 180;
  return [R * Math.sin(a), 1.15, -R * Math.cos(a)];
};
const VIEWS: Record<string, number> = {
  Front: 0, 'Front-left': 45, Left: 90, 'Back-left': 135, Back: 180, 'Back-right': -135, Right: -90, 'Front-right': -45,
};

export default function App() {
  const [view, setView] = useState('Front');
  const [mode, setMode] = useState<'interactive' | 'hero'>('interactive');
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>GDG Kitten Mascot</h1>
      <p>Drag to rotate (interactive mode). Buttons jump to the eight reference angles.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.keys(VIEWS).map((v) => (
          <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
            style={{ padding: '6px 10px', fontWeight: view === v ? 700 : 400 }}>{v}</button>
        ))}
        <button onClick={() => setMode(mode === 'hero' ? 'interactive' : 'hero')}>Mode: {mode}</button>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 420, margin: '0 auto', background: 'linear-gradient(#e8f0fe,#fff)', borderRadius: 16 }}>
        <GdgCatMascot
          key={`${view}-${mode}`}
          cameraPosition={at(VIEWS[view])}
          interactive={mode === 'interactive'}
          animate={mode === 'hero'}
        />
      </motion.div>
    </main>
  );
}
