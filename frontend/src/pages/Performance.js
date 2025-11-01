import React, { useState, useEffect } from 'react';
import PerformanceMonitoring from '../components/performance/PerformanceMonitoring';
import LazyLoad from '../components/performance/LazyLoad';
import LazyChart from '../components/performance/LazyChart';

const Performance = () => {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0
  });

  const [optimizationTips, setOptimizationTips] = useState([]);

  useEffect(() => {
    // Simulate fetching performance metrics
    const fetchMetrics = async () => {
      try {
        // In a real app, this would be actual performance metrics
        setMetrics({
          pageLoadTime: 1.2,
          firstContentfulPaint: 0.8,
          largestContentfulPaint: 1.5,
          cumulativeLayoutShift: 0.1,
          firstInputDelay: 50
        });

        setOptimizationTips([
          'Compress images to reduce load time',
          'Minimize CSS and JavaScript files',
          'Use lazy loading for images and components',
          'Enable browser caching',
          'Reduce server response time'
        ]);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  const getPerformanceScore = () => {
    const { pageLoadTime, firstContentfulPaint, largestContentfulPaint, cumulativeLayoutShift, firstInputDelay } = metrics;
    
    let score = 100;
    
    // Deduct points based on metrics
    if (pageLoadTime > 2) score -= 20;
    if (firstContentfulPaint > 1.8) score -= 15;
    if (largestContentfulPaint > 2.5) score -= 15;
    if (cumulativeLayoutShift > 0.1) score -= 20;
    if (firstInputDelay > 100) score -= 10;
    
    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Performance Monitoring
        </h1>
        <p className="text-gray-400">
          Monitor and optimize your application's performance
        </p>
      </div>

      {/* Performance Score */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Overall Performance Score
            </h2>
            <p className="text-gray-400">
              Based on Core Web Vitals and other performance metrics
            </p>
          </div>
          <div className={`text-5xl font-bold ${getScoreColor(performanceScore)}`}>
            {performanceScore}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Page Load Time
          </h3>
          <p className="text-3xl font-bold text-blue-400">
            {metrics.pageLoadTime}s
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Target: {'<'} 2s
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            First Contentful Paint
          </h3>
          <p className="text-3xl font-bold text-green-400">
            {metrics.firstContentfulPaint}s
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Target: {'<'} 1.8s
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Largest Contentful Paint
          </h3>
          <p className="text-3xl font-bold text-yellow-400">
            {metrics.largestContentfulPaint}s
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Target: {'<'} 2.5s
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Cumulative Layout Shift
          </h3>
          <p className="text-3xl font-bold text-purple-400">
            {metrics.cumulativeLayoutShift}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Target: {'<'} 0.1
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            First Input Delay
          </h3>
          <p className="text-3xl font-bold text-red-400">
            {metrics.firstInputDelay}ms
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Target: {'<'} 100ms
          </p>
        </div>
      </div>

      {/* Performance Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Performance Monitoring
          </h2>
          <PerformanceMonitoring />
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Performance Chart
          </h2>
          <LazyChart />
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Optimization Tips
        </h2>
        <ul className="space-y-2">
          {optimizationTips.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span className="text-gray-300">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Lazy Loading Demo */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Lazy Loading Demo
        </h2>
        <LazyLoad />
      </div>
    </div>
  );
};

export default Performance;