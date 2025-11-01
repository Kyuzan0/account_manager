import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  SignalIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PerformanceMonitoring = ({ 
  enableRUM = true,
  enableErrorTracking = true,
  apiEndpoint = '/api/performance',
  sampleRate = 1.0
}) => {
  const [metrics, setMetrics] = useState({
    pageLoad: [],
    apiResponse: [],
    userInteractions: [],
    errors: [],
    coreWebVitals: {
      LCP: [],
      FID: [],
      CLS: [],
      FCP: [],
      TTFB: []
    },
    resourceTiming: [],
    memoryUsage: []
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('pageLoad');
  const [timeRange, setTimeRange] = useState('1h');
  const [performanceScore, setPerformanceScore] = useState(100);
  const [errorRate, setErrorRate] = useState(0);
  
  const observerRef = useRef(null);
  const performanceEntriesRef = useRef([]);
  const errorEntriesRef = useRef([]);

  // Core Web Vitals thresholds
  const vitalsThresholds = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 }
  };

  // Initialize performance monitoring
  useEffect(() => {
    if (!enableRUM && !enableErrorTracking) return;

    const initializeMonitoring = () => {
      // Start monitoring
      setIsMonitoring(true);
      
      // Set up performance observers
      if (enableRUM) {
        setupPerformanceObservers();
        setupUserInteractionTracking();
        setupResourceTimingTracking();
      }
      
      // Set up error tracking
      if (enableErrorTracking) {
        setupErrorTracking();
      }
      
      // Start periodic data collection
      const interval = setInterval(collectMetrics, 5000);
      return () => clearInterval(interval);
    };

    const cleanup = initializeMonitoring();
    return cleanup;
  }, [enableRUM, enableErrorTracking]);

  // Setup performance observers
  const setupPerformanceObservers = useCallback(() => {
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            recordMetric('LCP', entry.startTime, entry);
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.processingStart) {
              recordMetric('FID', entry.processingStart - entry.startTime, entry);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              recordMetric('CLS', clsValue, entry);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            recordMetric('FCP', entry.startTime, entry);
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        observerRef.current = { lcpObserver, fidObserver, clsObserver, fcpObserver };
      } catch (error) {
        console.error('Failed to setup performance observers:', error);
      }
    }
  }, []);

  // Setup user interaction tracking
  const setupUserInteractionTracking = useCallback(() => {
    const interactions = [];
    
    const trackInteraction = (event) => {
      const startTime = performance.now();
      
      const interaction = {
        type: event.type,
        target: event.target.tagName,
        timestamp: startTime,
        duration: null
      };
      
      interactions.push(interaction);
      
      // Measure interaction duration
      requestAnimationFrame(() => {
        interaction.duration = performance.now() - startTime;
        recordUserInteraction(interaction);
      });
    };

    // Track clicks, taps, and keyboard inputs
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });

    return () => {
      ['click', 'touchstart', 'keydown'].forEach(eventType => {
        document.removeEventListener(eventType, trackInteraction);
      });
    };
  }, []);

  // Setup resource timing tracking
  const setupResourceTimingTracking = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.initiatorType) {
          recordResourceTiming({
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize || 0,
            timestamp: entry.startTime
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    return observer;
  }, []);

  // Setup error tracking
  const setupErrorTracking = useCallback(() => {
    // Track JavaScript errors
    const handleError = (event) => {
      recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    };

    // Track unhandled promise rejections
    const handleRejection = (event) => {
      recordError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    };

    // Track resource loading errors
    const handleResourceError = (event) => {
      recordError({
        type: 'resource',
        message: `Failed to load resource: ${event.target.src || event.target.href}`,
        element: event.target.tagName,
        timestamp: Date.now()
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  // Record metric
  const recordMetric = useCallback((type, value, entry) => {
    const metric = {
      type,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    performanceEntriesRef.current.push(metric);
    
    // Update state
    setMetrics(prev => ({
      ...prev,
      coreWebVitals: {
        ...prev.coreWebVitals,
        [type]: [...(prev.coreWebVitals[type] || []), metric]
      }
    }));

    // Check for performance alerts
    checkPerformanceAlerts(type, value);
  }, []);

  // Record user interaction
  const recordUserInteraction = useCallback((interaction) => {
    setMetrics(prev => ({
      ...prev,
      userInteractions: [...prev.userInteractions.slice(-99), interaction]
    }));
  }, []);

  // Record resource timing
  const recordResourceTiming = useCallback((resource) => {
    setMetrics(prev => ({
      ...prev,
      resourceTiming: [...prev.resourceTiming.slice(-199), resource]
    }));
  }, []);

  // Record error
  const recordError = useCallback((error) => {
    errorEntriesRef.current.push(error);
    
    setMetrics(prev => ({
      ...prev,
      errors: [...prev.errors.slice(-99), error]
    }));

    // Check for error rate alerts
    checkErrorAlerts();
  }, []);

  // Check performance alerts
  const checkPerformanceAlerts = useCallback((type, value) => {
    const threshold = vitalsThresholds[type];
    if (!threshold) return;

    let severity = 'info';
    if (value > threshold.needsImprovement) {
      severity = 'error';
    } else if (value > threshold.good) {
      severity = 'warning';
    }

    if (severity !== 'info') {
      const alert = {
        id: Date.now(),
        type: 'performance',
        severity,
        metric: type,
        value,
        threshold: threshold.good,
        message: `${type} is ${severity}: ${value.toFixed(2)}ms (threshold: ${threshold.good}ms)`,
        timestamp: Date.now()
      };

      setAlerts(prev => [...prev.slice(-9), alert]);
    }
  }, []);

  // Check error alerts
  const checkErrorAlerts = useCallback(() => {
    const recentErrors = errorEntriesRef.current.filter(
      error => Date.now() - error.timestamp < 60000 // Last minute
    );

    const errorRate = recentErrors.length / 60; // Errors per second
    setErrorRate(errorRate);

    if (errorRate > 0.1) { // More than 1 error per 10 seconds
      const alert = {
        id: Date.now(),
        type: 'error',
        severity: 'error',
        metric: 'errorRate',
        value: errorRate,
        message: `High error rate detected: ${errorRate.toFixed(2)} errors/sec`,
        timestamp: Date.now()
      };

      setAlerts(prev => [...prev.slice(-9), alert]);
    }
  }, []);

  // Collect metrics periodically
  const collectMetrics = useCallback(() => {
    // Page load time
    if (performance.timing) {
      const pageLoad = {
        value: performance.timing.loadEventEnd - performance.timing.navigationStart,
        timestamp: Date.now()
      };
      
      setMetrics(prev => ({
        ...prev,
        pageLoad: [...prev.pageLoad.slice(-59), pageLoad]
      }));
    }

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: [...prev.memoryUsage.slice(-59), memory]
      }));
    }

    // Calculate performance score
    calculatePerformanceScore();
  }, []);

  // Calculate performance score
  const calculatePerformanceScore = useCallback(() => {
    const recentMetrics = performanceEntriesRef.current.slice(-10);
    if (recentMetrics.length === 0) return;

    let score = 100;
    const weights = { LCP: 0.25, FID: 0.25, CLS: 0.2, FCP: 0.15, TTFB: 0.15 };

    Object.entries(weights).forEach(([metric, weight]) => {
      const metricData = recentMetrics.filter(m => m.type === metric);
      if (metricData.length === 0) return;

      const avgValue = metricData.reduce((sum, m) => sum + m.value, 0) / metricData.length;
      const threshold = vitalsThresholds[metric];
      
      if (!threshold) return;

      let metricScore = 100;
      if (avgValue > threshold.needsImprovement) {
        metricScore = 0;
      } else if (avgValue > threshold.good) {
        const ratio = (avgValue - threshold.good) / (threshold.needsImprovement - threshold.good);
        metricScore = 100 * (1 - ratio);
      }

      score -= (100 - metricScore) * weight;
    });

    setPerformanceScore(Math.max(0, Math.round(score)));
  }, []);

  // Get chart data based on selected metric
  const getChartData = useCallback(() => {
    switch (selectedMetric) {
      case 'pageLoad':
        return metrics.pageLoad.map((entry, index) => ({
          time: new Date(entry.timestamp).toLocaleTimeString(),
          value: entry.value
        }));
      
      case 'coreWebVitals':
        return Object.entries(metrics.coreWebVitals).map(([type, entries]) => ({
          name: type,
          data: entries.slice(-20).map(entry => ({
            time: new Date(entry.timestamp).toLocaleTimeString(),
            value: entry.value
          }))
        }));
      
      case 'errors':
        const errorCounts = {};
        metrics.errors.forEach(error => {
          errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
        });
        
        return Object.entries(errorCounts).map(([type, count]) => ({
          name: type,
          value: count
        }));
      
      case 'resourceTiming':
        return metrics.resourceTiming.slice(-20).map(resource => ({
          name: resource.name.split('/').pop(),
          duration: resource.duration,
          size: resource.size / 1024 // KB
        }));
      
      default:
        return [];
    }
  }, [selectedMetric, metrics]);

  // Send data to server
  const sendDataToServer = useCallback(async () => {
    const data = {
      metrics: performanceEntriesRef.current,
      errors: errorEntriesRef.current,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }, [apiEndpoint]);

  // Send data periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(sendDataToServer, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isMonitoring, sendDataToServer]);

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2 text-blue-500" />
            Performance Monitoring
          </h2>
          <p className="text-gray-600 mt-1">Real-time performance metrics and error tracking</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              performanceScore >= 90 ? 'text-green-600' :
              performanceScore >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {performanceScore}
            </div>
            <div className="text-sm text-gray-500">Performance Score</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              errorRate < 0.01 ? 'text-green-600' :
              errorRate < 0.1 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(errorRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Error Rate</div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Monitoring Status</p>
              <p className="text-xs text-gray-500 mt-1">
                {isMonitoring ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              isMonitoring ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Page Load</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.pageLoad.length > 0 
                  ? `${metrics.pageLoad[metrics.pageLoad.length - 1].value.toFixed(0)}ms`
                  : 'N/A'
                }
              </p>
            </div>
            <ClockIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Errors</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.errors.length} total
              </p>
            </div>
            <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Memory</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.memoryUsage.length > 0 
                  ? `${(metrics.memoryUsage[metrics.memoryUsage.length - 1].used / 1024 / 1024).toFixed(1)}MB`
                  : 'N/A'
                }
              </p>
            </div>
            <CpuChipIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
            Recent Alerts
          </h3>
          
          <div className="space-y-2">
            {alerts.slice(-5).map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'error' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      alert.severity === 'error' ? 'text-red-800' :
                      alert.severity === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'error' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Selection and Charts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pageLoad">Page Load Time</option>
              <option value="coreWebVitals">Core Web Vitals</option>
              <option value="errors">Error Distribution</option>
              <option value="resourceTiming">Resource Timing</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="5m">Last 5 minutes</option>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
          
          <button
            onClick={sendDataToServer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Data
          </button>
        </div>

        {/* Chart */}
        <div className="h-80">
          {selectedMetric === 'pageLoad' && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Page Load (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedMetric === 'coreWebVitals' && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData[0]?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name={chartData[0]?.name || ''}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedMetric === 'errors' && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#3B82F6'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          {selectedMetric === 'resourceTiming' && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="duration" fill="#8B5CF6" name="Duration (ms)" />
                <Bar dataKey="size" fill="#10B981" name="Size (KB)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitoring;