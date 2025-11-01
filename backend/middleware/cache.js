const cache = new Map();

// Simple in-memory cache with TTL
const cacheMiddleware = (ttl = 5 * 60 * 1000) => { // Default 5 minutes
  return (req, res, next) => {
    const key = req.originalUrl + req.user.id; // Include user ID for personalization
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('Cache hit for:', key);
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
      console.log('Cache set for:', key);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Clear cache for specific user
const clearUserCache = (userId) => {
  for (const [key] of cache.entries()) {
    if (key.includes(userId)) {
      cache.delete(key);
    }
  }
};

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutes max age
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

module.exports = {
  cacheMiddleware,
  clearUserCache
};