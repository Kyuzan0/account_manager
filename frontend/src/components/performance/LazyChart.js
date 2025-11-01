import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';

const LazyChart = ({ 
  component: Component, 
  fallback = null, 
  delay = 200,
  ...props 
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const defaultFallback = (
    <div className="flex items-center justify-center h-64 bg-dark-800 rounded-lg">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-dark-600 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-dark-600 rounded w-3/4"></div>
          <div className="h-4 bg-dark-600 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  if (!shouldRender) {
    return fallback || defaultFallback;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Component {...props} />
      </motion.div>
    </Suspense>
  );
};

export default LazyChart;