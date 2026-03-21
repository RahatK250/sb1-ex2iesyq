import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, Database, Activity, ArrowRight } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  accentFrom: string;
  accentTo: string;
  badge: string;
}

interface Props {
  productName: string;
  onSelectFeature: (featureId: string) => void;
  onBack: () => void;
}

export const FeatureCarousel: React.FC<Props> = ({ productName, onSelectFeature, onBack }) => {
  const features: Feature[] = React.useMemo(() => [
    {
      id: 'data-test-management',
      name: 'Data Test Management',
      description: 'Collect, organise and review all your test data in one unified workspace.',
      icon: <Database className="w-7 h-7" />,
      gradient: 'from-blue-600 via-blue-500 to-indigo-600',
      accentFrom: 'from-blue-400',
      accentTo: 'to-indigo-400',
      badge: 'Data',
    },
    {
      id: 'test-coverage',
      name: 'Test Coverage',
      description: 'Visualise and analyse coverage across modules, track gaps and drive quality.',
      icon: <Activity className="w-7 h-7" />,
      gradient: 'from-emerald-500 via-green-500 to-teal-600',
      accentFrom: 'from-emerald-400',
      accentTo: 'to-teal-400',
      badge: 'Coverage',
    },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Back Button */}
      <div className="px-6 pt-6 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl scale-150" />
            <img
              src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
              alt="Qollect"
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">Qollect</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">One place to collect all your test data</p>
        </div>

        {/* Section heading */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            Select a feature
          </p>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
            What would you like to do with&nbsp;
            <span className="text-orange-400">{productName}</span>?
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          {features.map((feature, i) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectFeature(feature.id)}
              className="group relative overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              {/* Card background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`} />

              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 -left-6 w-44 h-44 rounded-full bg-black/10" />

              {/* Content */}
              <div className="relative p-6 flex flex-col h-52 sm:h-56">
                {/* Badge + Icon row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors flex items-center justify-center text-white shadow-lg">
                    {feature.icon}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/60 pt-1">
                    {feature.badge}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 leading-tight">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                    {feature.description}
                  </p>
                </div>

                {/* Footer CTA */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider group-hover:text-white/90 transition-colors">
                    Open
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white/30 transition-colors flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center flex items-center justify-center gap-1.5 text-gray-400 dark:text-gray-600">
        <Zap className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-xs">Powered by <span className="font-semibold text-gray-500 dark:text-gray-400">Qollect</span></span>
      </footer>
    </div>
  );
};
