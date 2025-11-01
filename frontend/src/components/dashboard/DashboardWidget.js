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
  className = '',
  compact = false
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getIconComponent = () => {
    const iconClass = compact ? "w-4 h-4" : "w-6 h-6";
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
      className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl
                 border border-gray-700/50 ${compact ? 'rounded-lg shadow-xl p-3' : 'rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6'}
                 hover:shadow-3xl transition-all duration-500 ${compact ? 'hover:scale-[1.02]' : 'hover:scale-[1.02] sm:hover:scale-[1.03]'}
                 hover:border-gray-600/70 overflow-hidden group ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 20px -5px rgba(99, 102, 241, 0.1)"
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className={`absolute top-0 right-0 ${compact ? 'w-16 h-16' : 'w-32 h-32'} bg-gradient-to-br ${bgColorClass} opacity-10 rounded-full blur-3xl transform ${compact ? 'translate-x-8 -translate-y-8' : 'translate-x-16 -translate-y-16'}`} />
      
      <div className="relative z-10">
        <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4 sm:mb-6'}`}>
          <div className="flex items-center">
            <div className={`${compact ? 'p-2 rounded-lg' : 'p-3 sm:p-4 rounded-xl sm:rounded-2xl'} ${bgColorClass} text-white ${compact ? 'mr-2' : 'mr-3 sm:mr-4'} shadow-lg
                           transform transition-all duration-300 group-hover:scale-110
                           group-hover:rotate-3`}>
              {getIconComponent()}
            </div>
            <div>
              <h3 className={`${compact ? 'text-xs' : 'text-sm sm:text-lg'} font-semibold text-white ${compact ? 'mb-0' : 'mb-1'}`}>{title}</h3>
              {!compact && <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />}
            </div>
          </div>
          
          {actions.length > 0 && (
            <div className="flex space-x-1 sm:space-x-2">
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={action.onClick}
                  className={`${compact ? 'p-1.5 rounded-md' : 'p-2 sm:p-2.5 rounded-lg sm:rounded-xl'} bg-gray-700/50 hover:bg-gray-600/70
                           text-gray-400 hover:text-white transition-all duration-200
                           backdrop-blur-sm border border-gray-600/30`}
                  aria-label={action.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.icon}
                </motion.button>
              ))}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className={`flex justify-center items-center ${compact ? 'py-2' : 'py-8 sm:py-12'}`}>
            <div className="relative">
              <div className={`animate-spin rounded-full ${compact ? 'h-4 w-4' : 'h-8 w-8 sm:h-10 sm:w-10'} border-2 border-gray-600 border-t-primary-500`}></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-md"></div>
            </div>
          </div>
        ) : error ? (
          <div className={`text-red-400 text-center ${compact ? 'py-2' : 'py-4 sm:py-6'} bg-red-500/10 ${compact ? 'rounded-md' : 'rounded-lg sm:rounded-xl'} border border-red-500/20`}>
            <div className={`font-medium ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>{error}</div>
          </div>
        ) : (
          <div className={`space-y-${compact ? '1' : '3 sm:space-y-4'}`}>
            <motion.div
              className={`${compact ? 'text-lg' : 'text-2xl sm:text-4xl'} font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {value}
            </motion.div>
            
            {trend && (
              <motion.div
                className="flex items-center space-x-2 sm:space-x-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div className={`${compact ? 'p-0.5' : 'p-1 sm:p-1.5'} rounded-lg ${
                  trend === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {getTrendIcon()}
                </div>
                <span className={`font-medium ${
                  trend === 'up' ? 'text-green-400' : 'text-red-400'
                } ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                  {trendValue}
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
};

export default DashboardWidget;