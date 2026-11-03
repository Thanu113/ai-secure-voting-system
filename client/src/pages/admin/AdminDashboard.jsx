import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { electionService } from '../../services/electionService';
import {
  Users,
  Vote,
  ShieldCheck,
  AlertTriangle,
  History,
  Activity,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Search,
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, elecsRes] = await Promise.all([
          adminService.getDashboardStats(),
          electionService.getElections(),
        ]);
        setStats(statsRes.data);
        setElections(elecsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch administration metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Election Administration & Security Operations
          </h1>
          <p className="text-sm text-slate-400">
            Real-time voter biometric KYC review, election oversight, and ML fraud surveillance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/elections"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-1.5"
          >
            <Vote className="w-4 h-4" />
            <span>Manage Elections</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Approved Voters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Voters</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.voterMetrics?.approved || 0}
            </span>
            <span className="text-xs text-slate-400">
              / {stats?.voterMetrics?.total || 0} registered
            </span>
          </div>
          <Link
            to="/admin/voters?status=pending"
            className="text-xs text-blue-400 hover:underline flex items-center space-x-1 pt-1"
          >
            <span>{stats?.voterMetrics?.pending || 0} pending KYC approvals</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Turnout & Ballots */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ballots Cast</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.electionMetrics?.totalBallots || 0}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {stats?.electionMetrics?.overallTurnoutPercent || 0}% turnout
            </span>
          </div>
          <p className="text-xs text-slate-400 pt-1">Across all registered active elections</p>
        </div>

        {/* Active Elections */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Elections</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.electionMetrics?.active || 0}
            </span>
            <span className="text-xs text-slate-400">
              / {stats?.electionMetrics?.total || 0} total
            </span>
          </div>
          <Link to="/admin/elections" className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 pt-1">
            <span>View all scheduled elections</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ML Fraud Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Flagged ML Anomalies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.securityMetrics?.flaggedAlerts || 0}
            </span>
            <span className="text-xs text-rose-400 font-semibold">Requiring Review</span>
          </div>
          <Link to="/admin/fraud-alerts" className="text-xs text-rose-400 hover:underline flex items-center space-x-1 pt-1">
            <span>Investigate Isolation Forest flags</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Live Election Standings & Candidate Vote Counts (Active Polls Only) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Active Elections Live Standings ({elections.filter((e) => e.status === 'active').length})</span>
          </h2>
          <Link
            to="/admin/elections"
            className="text-xs text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
          >
            <span>Full Election Manager (All Polls)</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {elections.filter((e) => e.status === 'active').length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            No active polls are currently ongoing. Go to Election Manager to launch an upcoming poll.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {elections
              .filter((elec) => elec.status === 'active')
              .map((elec) => {
                const total = elec.totalVotesCast || 0;
                return (
                  <div
                    key={elec._id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Poll
                        </span>
                        <h3 className="text-base font-bold text-white pt-1">{elec.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-mono font-extrabold text-white">{total}</span>
                        <span className="text-[11px] text-slate-400 block">Total Ballots</span>
                      </div>
                    </div>

                    {/* Candidate Vote Breakdown */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      {elec.candidates?.map((c) => {
                        const pct = total > 0 ? ((c.voteCount / total) * 100).toFixed(1) : 0;
                        return (
                          <div key={c.candidateId || c._id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200">{c.name}</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {c.voteCount || 0} votes ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Operational Modules Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Module 1: Voter Approvals */}
        <Link
          to="/admin/voters"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl space-y-3 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
            Voter KYC & Identity Queue
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review submitted government IDs and biometric face photos. Approve legitimate voters to grant voting rights.
          </p>
        </Link>

        {/* Module 2: ML Anomaly Surveillance */}
        <Link
          to="/admin/fraud-alerts"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl space-y-3 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
            ML Fraud & Bot Detection
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Investigate behavioral voting vectors flagged by the Isolation Forest model (sub-second script bots, proxy hopping).
          </p>
        </Link>

        {/* Module 3: Blockchain Ledger Audit */}
        <Link
          to="/admin/elections"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl space-y-3 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
            Immutable Ledger Verification
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execute cryptographic SHA-256 hash audits verifying chain linkage and guaranteeing zero ballot alteration.
          </p>
        </Link>
      </div>
    </div>
  );
}

