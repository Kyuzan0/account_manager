import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';

// Import pages
import Dashboard from './pages/Dashboard';
import Performance from './pages/Performance';
import Accounts from './pages/Accounts';
import NameData from './pages/NameData';
import Logs from './pages/Logs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/performance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Performance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Accounts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/names"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NameData />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Logs */}
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Logs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
        
        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
