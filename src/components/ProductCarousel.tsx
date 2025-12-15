import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { Zap } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface Props {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductCarousel: React.FC<Props> = ({ products, onSelectProduct }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cardDimensions, setCardDimensions] = useState({
    cardWidth: 265,
    gap: 24
  });

  // Enhanced loading with minimum display time
  React.useEffect(() => {
    // Show loading for at least 2 seconds for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Memoize texts to prevent unnecessary re-renders
  const texts = React.useMemo(() => ({
    title: 'Qollect',
    subtitle: 'One place to collect all your test data',
    pickProduct: 'Pick your product',
  }), []);

  // Memoize card dimensions calculation
  React.useEffect(() => {
    const updateDimensions = () => {
      const cardWidth = window.innerWidth < 640 ? 280 : window.innerWidth < 1024 ? 320 : 280;
      const gap = window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28;
      setCardDimensions({ cardWidth, gap });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Duplicate list for seamless infinite
  const duplicatedProducts = React.useMemo(() => [...products, ...products], [products]);
  const totalWidth = React.useMemo(() => 
    duplicatedProducts.length * (cardDimensions.cardWidth + cardDimensions.gap), 
    [products.length, cardDimensions]
  );

  // Memoize event handlers
  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleDragStart = React.useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = React.useCallback((event: any, info: any) => {
    setCurrentX(prevX => {
      let newX = prevX + info.offset.x;
      // Keep within bounds for seamless infinite scroll
      const singleSetWidth = products.length * (cardDimensions.cardWidth + cardDimensions.gap);
      if (newX > 0) newX = -singleSetWidth + newX;
      if (Math.abs(newX) >= singleSetWidth) newX = newX + singleSetWidth;
      return newX;
    });
    
    // Resume auto-scroll after a short delay
    setTimeout(() => {
      setIsDragging(false);
    }, 1000);
  }, [products.length, cardDimensions]);

  useEffect(() => {
    if (!isHovered && !isDragging && products.length > 0) {
      const singleSetWidth = products.length * (cardDimensions.cardWidth + cardDimensions.gap);
      const interval = setInterval(() => {
        setCurrentX(prevX => {
          const newX = prevX - 0.5; // Slower, smoother animation
          // Reset to 0 when we've scrolled through all original products
          if (Math.abs(newX) >= singleSetWidth) {
            return 0;
          }
          return newX;
        });
      }, 16); // 60fps for smoother animation
      return () => clearInterval(interval);
    }
  }, [isHovered, isDragging, products.length, cardDimensions]);

  // Show enhanced loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If no products, show empty carousel
  if (!products || products.length === 0) {
    // Return empty div or redirect to settings
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col px-4 py-4 sm:py-8 lg:py-12">
        <div className="w-full max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
                alt="Qollect Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4 leading-tight">
              {texts.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {texts.subtitle}
            </p>
          </div>

          {/* Empty state with same layout */}
          <div className="w-full max-w-6xl text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4 sm:mb-6">
              {texts.pickProduct}
            </p>

            <div className="relative w-full flex justify-center">
              <div className="overflow-hidden w-full max-w-5xl px-2 sm:px-4 py-2 sm:py-4">
                <div className="flex gap-4 sm:gap-6 justify-center">
                  {/* Empty carousel - no products to show */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-4 sm:mt-8 lg:mt-12 text-center w-full py-4 sm:py-6 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4 text-yellow-500" />
          <p className="text-sm sm:text-base">
            Powered by <span className="font-bold">Qollect</span>
          </p>
        </footer>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col px-4 py-4 sm:py-8 lg:py-12">
      <div className="w-full max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
              alt="Qollect Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4 leading-tight">
            {texts.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {texts.subtitle}
          </p>
        </div>

        {/* Pick Product + Carousel */}
        <div className="w-full max-w-6xl text-center">
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4 sm:mb-6">
            {texts.pickProduct}
          </p>

          <div className="relative w-full flex justify-center">
            <motion.div
              ref={carouselRef}
              className="overflow-hidden w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6"
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
            >
              <motion.div
                className="flex gap-4 sm:gap-6 select-none"
                animate={{ x: currentX }}
                transition={{ 
                  type: 'tween', 
                  ease: 'linear', 
                  duration: isDragging ? 0 : 0.02 
                }}
                drag="x"
                dragConstraints={{ left: -totalWidth * 0.8, right: totalWidth * 0.2 }}
                dragElastic={0.2}
                dragMomentum={false}
                dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                data-dragging={isDragging}
                style={{ 
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  minHeight: '320px',
                  width: `${totalWidth}px`, // กำหนดความกว้างแน่นอน
                }}
              >
                {duplicatedProducts.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="flex-shrink-0"
                    style={{
                      width: `${cardDimensions.cardWidth}px`,
                      minWidth: `${cardDimensions.cardWidth}px`,
                      maxWidth: `${cardDimensions.cardWidth}px`
                    }}
                  >
                    <ProductCard
                      product={product}
                      onSelect={onSelectProduct}
                      isDragging={isDragging}
                    />
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 sm:mt-8 lg:mt-12 text-center w-full py-4 sm:py-6 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
        <Zap className="w-4 h-4 text-yellow-500" />
        <p className="text-sm sm:text-base">
          Powered by <span className="font-bold">Qollect</span>
        </p>
      </footer>
    </div>
  );
};

// Memoized ProductCard component for better performance
const ProductCard = React.memo<{ 
  product: Product; 
  onSelect: (product: Product) => void;
  isDragging: boolean;
}>(
  ({ product, onSelect, isDragging }) => (
    <motion.div
      onClick={(e) => {
        // ป้องกันการ click เมื่อกำลัง drag
        if (!isDragging) {
          onSelect(product);
        }
      }}
      whileHover={{
        scale: 1.05,
        zIndex: 10,
        y: -8,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.97 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform border border-gray-200 dark:border-gray-700 relative select-none"
      style={{ 
        cursor: isDragging ? 'grabbing' : 'pointer',
        pointerEvents: 'auto',
        height: '100%',
      }}
    >
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 sm:mb-4 lg:mb-6 overflow-hidden flex items-center justify-center">
        <img
          src={product.logo}
          alt={product.name}
          className="w-full h-full object-contain"
          style={{ padding: '12px' }}
          loading="lazy"
        />
      </div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center text-gray-800 dark:text-white leading-tight">
        {product.name}
      </h3>
    </motion.div>
  )
);

ProductCard.displayName = 'ProductCard';