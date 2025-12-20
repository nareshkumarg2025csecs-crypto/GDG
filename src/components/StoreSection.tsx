import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const products = [
  { id: 1, name: 'LN4 Racing Cap', price: '$45', color: '#d4ff00' },
  { id: 2, name: 'Team Hoodie', price: '$120', color: '#1a1a2e' },
  { id: 3, name: 'Racing Gloves', price: '$85', color: '#ff8000' },
  { id: 4, name: 'Signature Tee', price: '$55', color: '#f5f5f5' },
];

const StoreSection = () => {
  return (
    <section id="store" className="py-40 relative overflow-hidden noise">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-carbon to-background" />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 80px)` }} />
      <div className="container mx-auto px-6 relative z-10">
        <div className="overflow-hidden mb-20 -mx-6">
          <motion.div animate={{ x: [0, -1200] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="flex whitespace-nowrap">
            {Array(8).fill(null).map((_, i) => (<span key={i} className="text-sm uppercase tracking-[0.6em] text-lime/60 mx-16">LANDO STORE • EXCLUSIVE MERCH •</span>))}
          </motion.div>
        </div>
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}>
            <h2 className="text-display-md font-display leading-none mb-8">NEW COLLECTION:<br /><span className="text-lime glow-text">LN4 RACING</span></h2>
            <p className="text-muted-foreground text-xl mb-10 max-w-md leading-relaxed">Premium motorsport aesthetics meets modern streetwear. Built for speed, designed for life.</p>
            <motion.a href="#" whileHover={{ scale: 1.05, boxShadow: '0 0 40px hsl(75 100% 50% / 0.4)' }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-4 bg-lime text-background px-10 py-5 rounded-full font-body font-semibold text-lg">
              <ShoppingBag className="w-6 h-6" />Visit Store<ArrowRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
          <div className="grid grid-cols-2 gap-6">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }} whileHover={{ y: -8 }} className="group cursor-pointer">
                <div className="aspect-square rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden glass" style={{ backgroundColor: `${product.color}20` }}>
                  <span className="font-display text-5xl opacity-20" style={{ color: product.color }}>{product.id}</span>
                  <motion.div className="absolute inset-0 bg-lime/80 flex items-center justify-center" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}><ShoppingBag className="w-10 h-10 text-background" /></motion.div>
                </div>
                <h4 className="font-body font-medium">{product.name}</h4>
                <p className="text-lime font-semibold">{product.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
