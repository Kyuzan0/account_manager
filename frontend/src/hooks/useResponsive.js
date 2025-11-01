import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLargeDesktop, setIsLargeDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Breakpoints
      setIsMobile(width < 640);        // sm
      setIsTablet(width >= 640 && width < 1024);  // sm to md
      setIsDesktop(width >= 1024 && width < 1280); // md to lg
      setIsLargeDesktop(width >= 1280);  // lg and up
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive values based on screen size
  const getResponsiveValue = (values) => {
    if (typeof values === 'string' || typeof values === 'number') {
      return values;
    }
    
    if (isLargeDesktop && values.lg) return values.lg;
    if (isDesktop && values.md) return values.md;
    if (isTablet && values.sm) return values.sm;
    if (isMobile && values.xs) return values.xs;
    
    return values.md || values.sm || values.xs;
  };

  // Grid columns based on screen size
  const getGridCols = (breakpoints = { xs: 1, sm: 2, md: 3, lg: 4 }) => {
    return getResponsiveValue(breakpoints);
  };

  // Spacing based on screen size
  const getSpacing = (breakpoints = { xs: 2, sm: 4, md: 6, lg: 8 }) => {
    return getResponsiveValue(breakpoints);
  };

  // Font sizes
  const getFontSize = (breakpoints = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl' }) => {
    return getResponsiveValue(breakpoints);
  };

  // Padding based on screen size
  const getPadding = (breakpoints = { xs: 'p-2', sm: 'p-4', md: 'p-6', lg: 'p-8' }) => {
    return getResponsiveValue(breakpoints);
  };

  // Container max width
  const getContainerMaxWidth = () => {
    if (isMobile) return 'max-w-full';
    if (isTablet) return 'max-w-2xl';
    if (isDesktop) return 'max-w-4xl';
    if (isLargeDesktop) return 'max-w-6xl';
    return 'max-w-7xl';
  };

  // Touch device detection
  const isTouchDevice = () => {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  };

  // Orientation detection
  const getOrientation = () => {
    if (screenSize.width > screenSize.height) {
      return 'landscape';
    } else {
      return 'portrait';
    }
  };

  return {
    // Screen info
    screenSize,
    width: screenSize.width,
    height: screenSize.height,
    
    // Device type
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isTouchDevice: isTouchDevice(),
    orientation: getOrientation(),
    
    // Responsive utilities
    getResponsiveValue,
    getGridCols,
    getSpacing,
    getFontSize,
    getPadding,
    getContainerMaxWidth,
    
    // Breakpoint helpers
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop || isLargeDesktop,
    
    // Common responsive patterns
    cardGrid: `grid grid-cols-1 ${isTablet ? 'md:grid-cols-2' : ''} ${isDesktop ? 'lg:grid-cols-3' : ''} ${isLargeDesktop ? 'xl:grid-cols-4' : ''} gap-4`,
    formLayout: `space-y-4 ${isTablet ? 'md:space-y-6' : ''}`,
    navigationLayout: isMobile ? 'flex-col' : 'flex-row',
    textAlignment: isMobile ? 'text-left' : 'text-center',
    buttonSize: isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base',
    iconSize: isMobile ? 'w-4 h-4' : 'w-5 h-5',
    chartHeight: isMobile ? 'h-64' : isTablet ? 'h-80' : 'h-96',
    sidebarWidth: isMobile ? 'w-64' : isTablet ? 'w-72' : 'w-80',
  };
};

export default useResponsive;