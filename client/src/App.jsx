import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public & Auth Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import ReceiptVerifier from './pages/voter/ReceiptVerifier';
import ElectionResults from './pages/voter/ElectionResults';

// Voter Pages
import VoterDashboard from './pages/voter/VoterDashboard';
import BallotBooth from './pages/voter/BallotBooth';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VoterApprovals from './pages/admin/VoterApprovals';
import ElectionManager from './pages/admin/ElectionManager';
import FraudAlerts from './pages/admin/FraudAlerts';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/verify-receipt" element={<ReceiptVerifier />} />
              <Route path="/elections/:id/results" element={<ElectionResults />} />

              {/* Voter Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['voter', 'admin']} />}>
                <Route path="/voter/dashboard" element={<VoterDashboard />} />
                <Route path="/voter/ballot/:id" element={<BallotBooth />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/voters" element={<VoterApprovals />} />
                <Route path="/admin/elections" element={<ElectionManager />} />
                <Route path="/admin/fraud-alerts" element={<FraudAlerts />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
            <p>AI-Based Secure Online Voting System • MERN Stack & Machine Learning</p>
            <p className="mt-1 text-[11px] text-slate-600 font-mono">
              SHA-256 Hash Chained Ledger • 128-d Biometric Embeddings • Isolation Forest Anomaly Detection
            </p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

