import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { electionService } from '../../services/electionService';
import { authService } from '../../services/authService';
import {
  Vote,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Trash2
} from 'lucide-react';

export default function VoterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDeleteMyAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your voter account and biometric face registration? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await authService.deleteMyAccount();
      await logout();
      navigate('/register', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await electionService.getElections();
        setElections(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load elections.');
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const activeElections = elections.filter((e) => e.status === 'active');
  const closedElections = elections.filter((e) => e.status === 'closed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Voter Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user?.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : user?.status === 'pending'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              KYC {user?.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Voter ID: <span className="font-mono text-slate-200">{user?.voterId}</span> • Registered Email:{' '}
            <span className="font-mono text-slate-200">{user?.email}</span>
          </p>
        </div>

        {/* KYC Notification Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {user?.status === 'pending' && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center space-x-3 max-w-md">
              <Clock className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                Your facial biometric registration is currently under official review. Voting access will unlock once approved.
              </p>
            </div>
          )}

          {user?.status === 'rejected' && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center space-x-3 max-w-md">
              <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300">
                Registration Rejected: {user?.rejectionReason || 'Identity verification mismatch. Please contact election officials.'}
              </p>
            </div>
          )}

          <button
            onClick={handleDeleteMyAccount}
            className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-600/80 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-800/40 transition-colors flex items-center space-x-1.5 shadow"
            title="Permanently remove your voter registration & biometrics"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Active Elections Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Vote className="w-5 h-5 text-blue-400" />
                  <span>Active Elections ({activeElections.length})</span>
                </h2>
                <p className="text-xs text-slate-400">Cast your one verifiable vote for ongoing democratic elections</p>
              </div>
            </div>

            {activeElections.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                There are no elections currently open for voting.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeElections.map((elec) => (
                  <div
                    key={elec._id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Poll
                        </span>
                        {elec.hasVoted && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Voted</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {elec.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{elec.description}</p>

                      <div className="pt-2 text-xs text-slate-400 space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ends: {new Date(elec.endDate).toLocaleDateString()} at {new Date(elec.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Candidates: <span className="text-slate-300 font-medium">{elec.candidates?.length || 0} rostered</span></span>
                          <span className="font-mono text-emerald-400 font-semibold">{elec.totalVotesCast || 0} votes cast</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80">
                      {elec.hasVoted ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Ballot Recorded</span>
                        </div>
                      ) : user?.status !== 'approved' ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 text-slate-500 text-xs font-medium text-center">
                          Awaiting KYC Approval to Vote
                        </div>
                      ) : (
                        <Link
                          to={`/voter/ballot/${elec._id}`}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/20"
                        >
                          <span>Proceed to Voting Booth</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past / Closed Elections */}
          {closedElections.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <span>Closed Elections & Certified Results ({closedElections.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {closedElections.map((elec) => (
                  <div
                    key={elec._id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg"
                  >
                    <div className="space-y-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                        Closed
                      </span>
                      <h3 className="text-base font-bold text-white">{elec.title}</h3>
                      <p className="text-xs text-slate-400">Total votes audited: {elec.totalVotesCast}</p>
                    </div>

                    <Link
                      to={`/elections/${elec._id}/results`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View Certified Results</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

