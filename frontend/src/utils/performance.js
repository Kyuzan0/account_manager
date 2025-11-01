// Performance monitoring and optimization utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      componentRender: {},
      apiCalls: {},
      userInteractions: {}
    };
    this.observers = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing a performance metric
  startTimer(name, category = 'general') {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    const id = `${category}_${name}_${Date.now()}`;
    
    return {
      id,
      startTime,
      category,
      name
    };
  }

  // End timing and record the metric
  endTimer(timer) {
    if (!this.isEnabled || !timer) return;
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    this.recordMetric(timer.category, timer.name, duration);
    
    // Log in development
    if (this.isEnabled) {
      console.log(`⏱️ ${timer.category}.${timer.name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Record a performance metric
  recordMetric(category, name, value) {
    if (!this.metrics[category]) {
      this.metrics[category] = {};
    }
    
    if (!this.metrics[category][name]) {
      this.metrics[category][name] = [];
    }
    
    this.metrics[category][name].push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only last 10 measurements to avoid memory leaks
    if (this.metrics[category][name].length > 10) {
      this.metrics[category][name].shift();
    }
  }

  // Get performance statistics
  getStats(category = null, name = null) {
    if (category && name) {
      const measurements = this.metrics[category]?.[name] || [];
      return this.calculateStats(measurements);
    }
    
    if (category) {
      const categoryStats = {};
      Object.keys(this.metrics[category] || {}).forEach(metricName => {
        const measurements = this.metrics[category][metricName];
        categoryStats[metricName] = this.calculateStats(measurements);
      });
      return categoryStats;
    }
    
    // Return all stats
    const allStats = {};
    Object.keys(this.metrics).forEach(cat => {
      allStats[cat] = {};
      Object.keys(this.metrics[cat]).forEach(metricName => {
        const measurements = this.metrics[cat][metricName];
        allStats[cat][metricName] = this.calculateStats(measurements);
      });
    });
    return allStats;
  }

  // Calculate statistics for measurements
  calculateStats(measurements) {
    if (!measurements || measurements.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }
    
    const values = measurements.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      count: values.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      median: median.toFixed(2),
      last: values[values.length - 1].toFixed(2)
    };
  }

  // Monitor page load performance
  observePageLoad() {
    if (!this.isEnabled) return;
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.recordMetric('pageLoad', 'domContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.recordMetric('pageLoad', 'loadComplete', navigation.loadEventEnd - navigation.loadEventStart);
          this.recordMetric('pageLoad', 'totalLoadTime', navigation.loadEventEnd - navigation.fetchStart);
        }
      }, 0);
    });
  }

  // Monitor component render performance
  observeComponentRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction;
    
    return (...args) => {
      const timer = this.startTimer(componentName, 'componentRender');
      const result = renderFunction(...args);
      this.endTimer(timer);
      return result;
    };
  }

  // Monitor API call performance
  observeApiCall(apiName, apiFunction) {
    if (!this.isEnabled) return apiFunction;
    
    return async (...args) => {
      const timer = this.startTimer(apiName, 'apiCalls');
      try {
        const result = await apiFunction(...args);
        this.endTimer(timer);
        return result;
      } catch (error) {
        this.endTimer(timer);
        throw error;
      }
    };
  }

  // Monitor user interaction performance
  observeInteraction(interactionName, callback) {
    if (!this.isEnabled) return callback;
    
    return (...args) => {
      const timer = this.startTimer(interactionName, 'userInteractions');
      const result = callback(...args);
      this.endTimer(timer);
      return result;
    };
  }

  // Get memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2), // MB
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2), // MB
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) // MB
      };
    }
    return null;
  }

  // Get network performance
  getNetworkStats() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      return {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        serverResponse: navigation.responseEnd - navigation.requestStart,
        domProcessing: navigation.domComplete - navigation.responseEnd,
        pageRender: navigation.loadEventEnd - navigation.domComplete
      };
    }
    return null;
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      memory: this.getMemoryUsage(),
      network: this.getNetworkStats(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    return report;
  }

  // Clear all metrics
  clear() {
    this.metrics = {
      pageLoad: {},
      componentRender: {},
      apiCalls: {},
      userInteractions: {}
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export const usePerformance = (componentName) => {
  const [metrics, setMetrics] = React.useState({});

  React.useEffect(() => {
    if (performanceMonitor.isEnabled) {
      const updateMetrics = () => {
        const stats = performanceMonitor.getStats('componentRender', componentName);
        setMetrics(stats);
      };

      // Update metrics every 5 seconds
      const interval = setInterval(updateMetrics, 5000);
      
      return () => clearInterval(interval);
    }
  }, [componentName]);

  const measureRender = React.useCallback((renderFunction) => {
    return performanceMonitor.observeComponentRender(componentName, renderFunction);
  }, [componentName]);

  return {
    metrics,
    measureRender,
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    endTimer: performanceMonitor.endTimer.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor)
  };
};

// Performance optimization utilities
export const PerformanceUtils = {
  // Debounce function for performance optimization
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle function for performance optimization
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize expensive calculations
  memoize(func) {
    const cache = new Map();
    return function executedFunction(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    };
  },

  // Lazy load images
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  // Optimize animations for device capabilities
  shouldReduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if device is low-end
  isLowEndDevice() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const isLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    
    return isSlowConnection || isLowMemory || isLowCores;
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.observePageLoad();
  
  // Log performance stats every 30 seconds in development
  if (performanceMonitor.isEnabled) {
    setInterval(() => {
      const report = performanceMonitor.generateReport();
      console.log('📊 Performance Report:', report);
    }, 30000);
  }
}

export default performanceMonitor;