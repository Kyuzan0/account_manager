# Account Generator Multi-Platform Application

A comprehensive web application for managing accounts across multiple platforms with advanced features including activity logging, performance monitoring, and security tracking.

## 🚀 Features

### Core Functionality
- **Multi-Platform Account Management**: Create and manage accounts for various platforms (Roblox, Google, Facebook, etc.)
- **User Authentication**: Secure registration and login system with JWT tokens
- **Account History**: Track all account activities with detailed logs
- **Name Data Management**: Upload and manage name datasets for different platforms
- **Platform Configuration**: Dynamic platform setup with customizable fields and validation

### Advanced Features
- **Activity Logging**: Comprehensive tracking of all user actions with detailed metadata
- **Performance Monitoring**: Real-time performance metrics and analysis
- **Security Monitoring**: Suspicious activity detection and risk scoring
- **Data Import/Export**: Support for CSV and Excel file formats
- **Responsive Design**: Mobile-optimized interface with Tailwind CSS
- **Real-time Updates**: Live activity feeds and notifications

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Frontend
- **React 18** with React Router
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** for form management
- **React Toastify** for notifications
- **Framer Motion** for animations
- **Recharts** for data visualization

### Development Tools
- **Concurrently** for running multiple processes
- **Nodemon** for development server
- **Docker** for containerization

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd account_manager
```

### 2. Install dependencies
```bash
npm run setup
```

This will install dependencies for the root, backend, and frontend directories, and copy environment files.

### 3. Configure environment variables
```bash
# Root directory
cp .env.example .env

# Backend directory
cp backend/.env.example backend/.env
```

Edit the environment files with your configuration:
- MongoDB connection string
- JWT secret key
- Server port
- Frontend URL

### 4. Start the development servers
```bash
npm run dev
```

This will start both the backend and frontend servers concurrently.

### 5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000

## 📁 Project Structure

```
account_manager/
├── backend/                 # Backend API server
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── uploads/           # File upload directory
│   └── server.js          # Main server file
├── frontend/               # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service functions
│   │   └── utils/        # Utility functions
│   └── package.json
├── docs/                  # Documentation files
└── package.json           # Root package.json
```

## 🔧 Available Scripts

### Root Directory Scripts
- `npm run setup` - Install all dependencies and setup environment files
- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend server
- `npm run build` - Build the frontend for production
- `npm run start` - Start the backend production server

### Docker Scripts
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:prod` - Start production environment with Docker
- `npm run docker:stop` - Stop Docker containers
- `npm run docker:clean` - Clean up Docker containers and volumes

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### Accounts
- `GET /api/accounts` - Get all user accounts
- `POST /api/accounts` - Create a new account
- `GET /api/accounts/:id` - Get account by ID
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/platform/:platform` - Get accounts by platform

### Names
- `GET /api/names` - Get all names
- `POST /api/names` - Add name manually
- `POST /api/names/upload` - Upload CSV/Excel file
- `GET /api/names/random/:platform` - Get random name for platform
- `DELETE /api/names/:id` - Delete name

### Platforms
- `GET /api/platforms` - Get all platforms
- `GET /api/platforms/:id` - Get platform by ID
- `POST /api/platforms` - Add new platform (admin only)
- `PUT /api/platforms/:id` - Update platform (admin only)
- `DELETE /api/platforms/:id` - Delete platform (admin only)

### Activity Logs
- `GET /api/activity-logs/user` - Get user activities
- `GET /api/activity-logs/account/:accountId` - Get account activities
- `GET /api/activity-logs/stats` - Get activity statistics
- `GET /api/activity-logs/security` - Get security events (admin only)
- `GET /api/activity-logs/export` - Export activity logs (admin only)

### Health Check
- `GET /api/health` - API health check

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication:

1. Register or login to receive a token
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```
3. Tokens expire after 7 days (configurable)

## 📈 Activity Logging System

The application includes a comprehensive activity logging system that tracks:

- Account creation, updates, and deletion
- User authentication events
- System operations
- Performance metrics
- Security events with risk scoring

### Log Features
- **Automatic Logging**: All API endpoints are automatically logged
- **Detailed Context**: IP address, user agent, request details
- **Performance Tracking**: Response times and resource usage
- **Security Monitoring**: Suspicious activity detection
- **Data Retention**: Configurable retention policies

## 🛡️ Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Security Monitoring**: Real-time detection of suspicious activities

## 📱 Frontend Features

### Pages
- **Dashboard**: Overview of accounts and recent activities
- **History**: Account management and history
- **Performance**: System performance metrics
- **Logs**: Activity log viewer
- **Name Data**: Name dataset management
- **Upload Data**: File upload interface

### Components
- **Authentication**: Login and registration forms
- **Account Management**: Create, edit, and delete accounts
- **Activity Monitoring**: Real-time activity feeds
- **Data Visualization**: Charts and graphs for analytics
- **Responsive Layout**: Mobile-optimized design

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
MONGODB_URI=mongodb://localhost:27017/account-generator
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 Development Notes

### Code Style
- ES6+ JavaScript syntax
- Functional React components with hooks
- RESTful API design
- MongoDB with Mongoose ODM

### Best Practices
- Error handling with proper HTTP status codes
- Input validation and sanitization
- Secure password handling
- Environment-based configuration
- Comprehensive logging

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Development environment
npm run docker:dev

# Production environment
npm run docker:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

## 🆘 Support

If you encounter any issues or have questions, please:

1. Check the existing documentation
2. Search through existing issues
3. Create a new issue with detailed information
4. Include error messages, steps to reproduce, and environment details

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication
  - Account management
  - Activity logging
  - Performance monitoring
  - Security features

---

Built with ❤️ using the MERN stack
