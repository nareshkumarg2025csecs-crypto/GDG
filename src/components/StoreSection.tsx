import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const products = [
  { id: 1, name: 'LN4 Racing Cap', price: '$45', color: '#d4ff00' },
  { id: 2, name: 'Team Hoodie', price: '$120', color: '#1a1a2e' },
  { id: 3, name: 'Racing Gloves', price: '$85', color: '#ff6b00' },
  { id: 4, name: 'Signature Tee', price: '$55', color: '#f5f5f5' },
];

const StoreSection = () => {
  return (
    <section className="py-32 bg-foreground text-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`,
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Marquee header */}
        <div className="overflow-hidden mb-16 -mx-6">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="flex whitespace-nowrap"
          >
            {Array(6).fill(null).map((_, i) => (
              <span key={i} className="text-sm uppercase tracking-[0.5em] text-lime mx-12">
                LANDO STORE • LANDO STORE • LANDO STORE •
              </span>
            ))}
          </motion.div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display leading-none mb-6">
              NEW IN: <br />
              <span className="text-lime">LN4 RACING</span>
            </h2>
            <p className="text-background/70 font-body text-lg mb-8 max-w-md">
              A collection built for performance and speed, combining classic motorsport 
              aesthetics & modern craftsmanship.
            </p>

            <motion.a
              href="#store"
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-lime text-foreground px-8 py-4 rounded-full font-body font-semibold"
            >
              <ShoppingBag className="w-5 h-5" />
              Visit Store
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </motion.div>

          {/* Right - Products preview */}
          <div className="grid grid-cols-2 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
              >
                <div 
                  className="aspect-square rounded-2xl mb-3 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: product.color }}
                >
                  <span className="font-display text-4xl opacity-30">
                    {product.id}
                  </span>
                  
                  {/* Hover overlay */}
                  <motion.div
                    className="absolute inset-0 bg-lime/90 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <ShoppingBag className="w-8 h-8 text-foreground" />
                  </motion.div>
                </div>
                <h4 className="font-body font-medium text-sm">{product.name}</h4>
                <p className="text-lime text-sm">{product.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
