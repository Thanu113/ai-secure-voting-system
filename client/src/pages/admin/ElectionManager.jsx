import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { electionService } from '../../services/electionService';
import {
  Vote,
  Plus,
  Play,
  Square,
  ShieldCheck,
  Calendar,
  AlertCircle,
  X,
  Users,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

export default function ElectionManager() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [candidates, setCandidates] = useState([
    { name: '', party: '', manifesto: '' },
    { name: '', party: '', manifesto: '' },
  ]);
  const [creating, setCreating] = useState(false);

  // Audit Ledger Modal State
  const [auditReport, setAuditReport] = useState(null);
  const [auditing, setAuditing] = useState(false);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const res = await electionService.getElections();
      setElections(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load elections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleCandidateChange = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', manifesto: '' }]);
  };

  const removeCandidate = (index) => {
    if (candidates.length <= 2) return;
    setCandidates(candidates.filter((_, idx) => idx !== index));
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminService.createElection({
        ...formData,
        candidates,
      });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', startDate: '', endDate: '' });
      fetchElections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create election.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminService.updateElectionStatus(id, newStatus);
      fetchElections();
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition failed.');
    }
  };

  const handleAuditLedger = async (id) => {
    setAuditing(true);
    try {
      const res = await adminService.auditLedger(id);
      setAuditReport(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Cryptographic audit failed.');
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Vote className="w-8 h-8 text-blue-400" />
            <span>Election Operations & Blockchain Ledger</span>
          </h1>
          <p className="text-sm text-slate-400">
            Schedule elections, manage candidate rosters, and audit hash-chained ballot ledgers
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Election</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Elections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elections.map((elec) => (
          <div
            key={elec._id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    elec.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : elec.status === 'draft'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {elec.status}
                </span>

                <span className="text-xs text-slate-400 font-mono font-bold">
                  {elec.totalVotesCast} Ballots
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">{elec.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{elec.description}</p>

              <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
                <div>Start: {new Date(elec.startDate).toLocaleDateString()}</div>
                <div>End:   {new Date(elec.endDate).toLocaleDateString()}</div>
              </div>

              {/* Candidate Vote Counts & Standings */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center space-x-1">
                    <Vote className="w-3.5 h-3.5 text-blue-400" />
                    <span>Candidate Live Tally</span>
                  </span>
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {elec.totalVotesCast || 0} Total {elec.totalVotesCast === 1 ? 'Vote' : 'Votes'}
                  </span>
                </div>

                <div className="space-y-2">
                  {elec.candidates?.map((c) => {
                    const total = elec.totalVotesCast || 0;
                    const pct = total > 0 ? ((c.voteCount / total) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={c.candidateId || c._id}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-white">{c.name}</span>
                            {c.party && (
                              <span className="text-[11px] text-slate-400 block truncate">
                                {c.party}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-emerald-400 shrink-0 text-right">
                            {c.voteCount || 0} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
            </div>

            {/* Admin Controls */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2">
                {elec.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange(elec._id, 'active')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open Polls</span>
                  </button>
                )}

                {elec.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(elec._id, 'closed')}
                    className="flex-1 py-2 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Close Polls</span>
                  </button>
                )}

                <button
                  onClick={() => handleAuditLedger(elec._id)}
                  disabled={auditing}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                  title="Run mathematical SHA-256 hash audit"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Audit Ledger</span>
                </button>
              </div>

              <Link
                to={`/elections/${elec._id}/results`}
                className="w-full py-2 px-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700/60 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Full Tally & Analytics</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative text-slate-100 my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Create New Election</h2>
              <p className="text-xs text-slate-400">Configure election dates and candidate roster</p>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 2026 Student Council President Election"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Official election statement and guidelines..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Candidates Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Candidates (At least 2 required)</span>
                  <button
                    type="button"
                    onClick={addCandidate}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Candidate</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {candidates.map((cand, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Candidate #{idx + 1}</span>
                        {candidates.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeCandidate(idx)}
                            className="text-rose-400 hover:text-rose-300 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Candidate Name"
                          value={cand.name}
                          onChange={(e) => handleCandidateChange(idx, 'name', e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Political Party / Affiliation"
                          value={cand.party}
                          onChange={(e) => handleCandidateChange(idx, 'party', e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Campaign Manifesto / Slogan"
                        value={cand.manifesto}
                        onChange={(e) => handleCandidateChange(idx, 'manifesto', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                {creating ? 'Creating Election...' : 'Save & Publish Election'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cryptographic Ledger Audit Modal */}
      {auditReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative text-slate-100">
            <button
              onClick={() => setAuditReport(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                auditReport.isLedgerTamperFree
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Cryptographic Ledger Audit</h2>
              <p className="text-xs text-slate-400">{auditReport.electionTitle}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-sans">Chain Integrity:</span>
                <span className={`font-bold ${auditReport.isLedgerTamperFree ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {auditReport.isLedgerTamperFree ? 'TAMPER-FREE (AUTHENTIC)' : 'TAMPER DETECTED'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-sans">Audited Blocks:</span>
                <span className="text-white font-bold">{auditReport.totalBlocksAudited}</span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-sans">Vote Tallies Match:</span>
                <span className="text-emerald-400 font-bold">{auditReport.countsMatch ? 'YES (100% Valid)' : 'NO'}</span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-500 font-sans text-[11px] block">Genesis Seed Hash:</span>
                <span className="text-slate-400 text-[10px] break-all block bg-slate-900 p-2 rounded">
                  {auditReport.genesisHash}
                </span>
              </div>
            </div>

            <button
              onClick={() => setAuditReport(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Close Audit Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

