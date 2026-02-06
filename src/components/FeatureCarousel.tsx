import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, Database, Activity } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface Props {
  productName: string;
  onSelectFeature: (featureId: string) => void;
  onBack: () => void;
}

export const FeatureCarousel: React.FC<Props> = ({ productName, onSelectFeature, onBack }) => {
  // Define features
  const features: Feature[] = React.useMemo(() => [
    {
      id: 'data-test-management',
      name: 'Data Test Management',
      description: 'Manage and view all your test data',
      icon: <Database className="w-16 h-16" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'test-coverage',
      name: 'Test Coverage',
      description: 'View and analyze test coverage',
      icon: <Activity className="w-16 h-16" />,
      color: 'from-green-500 to-green-600'
    }
  ], []);

  // Memoize texts to prevent unnecessary re-renders
  const texts = React.useMemo(() => ({
    title: 'Qollect',
    subtitle: 'One place to collect all your test data',
    pickFeature: `Pick a feature for ${productName}`,
    backToProducts: 'Back to Products'
  }), [productName]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col px-4 py-4 sm:py-8 lg:py-12">
      {/* Back Button */}
      <div className="w-full max-w-6xl mx-auto mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">{texts.backToProducts}</span>
        </button>
      </div>

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

        {/* Pick Feature + Grid */}
        <div className="w-full max-w-4xl mx-auto text-center">
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-8 sm:mb-10 lg:mb-12">
            {texts.pickFeature}
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-4xl mx-auto px-4">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => onSelectFeature(feature.id)}
                className="cursor-pointer"
              >
                <div className={`
                  h-80 sm:h-96 rounded-2xl shadow-lg hover:shadow-2xl 
                  transition-all duration-300 flex flex-col justify-between p-6
                  bg-gradient-to-br ${feature.color} text-white
                  border border-opacity-20 border-white
                  cursor-pointer group
                `}>
                  {/* Feature Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white bg-opacity-20 rounded-full group-hover:bg-opacity-30 transition-all duration-300">
                      {feature.icon}
                    </div>
                  </div>

                  {/* Feature Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3">
                      {feature.name}
                    </h3>
                    <p className="text-sm sm:text-base text-white text-opacity-90">
                      {feature.description}
                    </p>
                  </div>

                 
                </div>
              </motion.div>
            ))}
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
