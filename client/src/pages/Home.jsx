import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Vote,
  Eye,
  Cpu,
  Search,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export default function Home() {
  const { isAuth, user } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider backdrop-blur">
          <ShieldCheck className="w-4 h-4" />
          <span>Final-Year Capstone Project • AI & Cryptographic Governance</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          AI-Powered Secure Online Voting With{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Biometric & Ledger Integrity
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A trustworthy web-based voting platform enforcing strict One-Person-One-Vote guarantees, 128-d face recognition with liveness anti-spoofing, behavioral anomaly detection, and tamper-evident SHA-256 blockchain ledgers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {isAuth ? (
            <Link
              to={user?.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard'}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Vote className="w-5 h-5" />
              <span>Go to {user?.role === 'admin' ? 'Admin Dashboard' : 'Elections Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Register as Voter</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}

          <Link
            to="/verify-receipt"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span>Audit a Receipt</span>
          </Link>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Security & ML Innovation Architecture</h2>
          <p className="text-sm text-slate-400">Four integrated layers engineered for election transparency and privacy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Biometric Face Recognition</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts 128-dimensional biometric facial embeddings with OpenCV and verifies identity against registered KYC before casting ballots.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Liveness Anti-Spoofing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates Eye Aspect Ratio (EAR) across frame bursts to detect natural blinks, thwarting photo presentation or video replay spoofing.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Isolation Forest Fraud ML</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes voting telemetry (time-to-vote, IP switches, failed attempts) to flag automated bot attacks and credential stuffing.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Hash-Chained Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ballots form an immutable SHA-256 blockchain ledger. Decoupled voter records ensure Secret Ballot anonymity with mathematical proof.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Step-by-Step */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white">How The Voting Lifecycle Works</h2>
            <p className="text-xs text-slate-400">From registration to cryptographic receipt verification</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Register & Capture Face</h4>
              <p className="text-xs text-slate-400">
                Citizen registers with Voter ID, email, and webcam photo. Receives 6-digit email OTP.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Official KYC Approval</h4>
              <p className="text-xs text-slate-400">
                Election officials review submitted voter profile and approve voting eligibility.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Biometric Ballot Cast</h4>
              <p className="text-xs text-slate-400">
                Selects candidate, completes live blink check, and casts one anonymous ballot.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                4
              </div>
              <h4 className="font-bold text-white text-sm">Audit Your Receipt</h4>
              <p className="text-xs text-slate-400">
                Receive anonymous receipt token to independently verify inclusion on the ledger anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

