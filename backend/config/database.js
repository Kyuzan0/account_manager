const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect with authentication and specific options
    const hostPort = process.env.MONGODB_URI.replace('mongodb://', '');
    const authURI = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${hostPort}`;
    
    console.log('Attempting to connect to MongoDB with authentication...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    console.log('Username:', process.env.MONGODB_USERNAME);
    
    const conn = await mongoose.connect(authURI, {
      authSource: 'admin', // Specify the authentication database
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.name);
    
    // Test database connection by listing collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Try with different auth source if admin fails
    try {
      console.log('Trying with authSource: account-generator...');
      const hostPort = process.env.MONGODB_URI.replace('mongodb://', '');
      const authURI = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${hostPort}`;
      
      const conn = await mongoose.connect(authURI, {
        authSource: 'account-generator', // Try with the database name
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log('Database name:', conn.connection.name);
      
      // Test database connection by listing collections
      const collections = await conn.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
    } catch (secondError) {
      console.error('Second authentication attempt failed:', secondError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;