import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const LazyLoad = ({ 
  children, 
  fallback = null, 
  rootMargin = '100px',
  threshold = 0.1,
  className = '',
  animation = true
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const content = hasLoaded ? children : fallback;

  return (
    <div ref={elementRef} className={className}>
      {animation ? (
        <motion.div
          variants={variants}
          initial="hidden"
          animate={hasLoaded ? "visible" : "hidden"}
        >
          {content}
        </motion.div>
      ) : (
        content
      )}
    </div>
  );
};

export default LazyLoad;