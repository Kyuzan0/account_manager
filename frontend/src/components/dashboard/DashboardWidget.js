import React from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const DashboardWidget = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'blue', 
  loading = false, 
  error = null,
  actions = [],
  className = '' 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getIconComponent = () => {
    const iconClass = "w-6 h-6";
    switch (Icon) {
      case 'chart':
        return <ChartBarIcon className={iconClass} />;
      case 'users':
        return <UserGroupIcon className={iconClass} />;
      case 'dollar':
        return <CurrencyDollarIcon className={iconClass} />;
      case 'cart':
        return <ShoppingCartIcon className={iconClass} />;
      case 'document':
        return <DocumentTextIcon className={iconClass} />;
      case 'cog':
        return <CogIcon className={iconClass} />;
      default:
        return <ChartBarIcon className={iconClass} />;
    }
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    lime: 'bg-lime-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    fuchsia: 'bg-fuchsia-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
    zinc: 'bg-zinc-500',
    neutral: 'bg-neutral-500',
    stone: 'bg-stone-500',
  };

  const bgColorClass = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      className={`bg-dark-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${bgColorClass} text-white mr-4`}>
            {getIconComponent()}
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        {actions.length > 0 && (
          <div className="flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="p-2 rounded-md hover:bg-dark-700 transition-colors"
                aria-label={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-600 border-t-primary-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-4">
          {error}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">{value}</div>
          
          {trend && (
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DashboardWidget;