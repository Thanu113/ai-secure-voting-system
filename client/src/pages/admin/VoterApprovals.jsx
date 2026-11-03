import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Trash2,
  X
} from 'lucide-react';

export default function VoterApprovals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [voters, setVoters] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchVoters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await adminService.getVoters(params);
      setVoters(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load voters list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVoters();
  };

  const handleUpdateStatus = async (id, status, reason = '') => {
    try {
      await adminService.updateVoterStatus(id, status, reason);
      // Update local state
      setVoters((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status, rejectionReason: reason || null } : v))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update voter status.');
    }
  };

  const handleDeleteVoter = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}'s voter registration?`)) {
      try {
        await adminService.deleteVoter(id);
        setVoters((prev) => prev.filter((v) => v._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete voter registration.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <span>Voter Identity & KYC Approvals</span>
          </h1>
          <p className="text-sm text-slate-400">
            Review registered citizen identities, inspect biometric photos, and grant official voting rights
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        {/* Status Pills */}
        <div className="flex items-center space-x-2">
          {['', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setSearchParams(st ? { status: st } : {});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st || 'All Registrations'}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Voters Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : voters.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No voter records found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Biometric Face</th>
                  <th className="py-3.5 px-4">Voter Name</th>
                  <th className="py-3.5 px-4">Voter ID</th>
                  <th className="py-3.5 px-4">Email Status</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {voters.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {v.faceImageUrl ? (
                        <button
                          onClick={() => setSelectedPhoto({ url: v.faceImageUrl, name: v.name })}
                          className="relative group w-10 h-10 rounded-full overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-950"
                        >
                          <img src={v.faceImageUrl} alt={v.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold">
                          {v.name.charAt(0)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{v.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{v.email}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {v.voterId}
                    </td>

                    <td className="py-3 px-4">
                      {v.isEmailVerified ? (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          v.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : v.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {v.status}
                      </span>
                      {v.rejectionReason && (
                        <p className="text-[10px] text-rose-400 mt-0.5 line-clamp-1">{v.rejectionReason}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      {v.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(v._id, 'approved')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow text-xs"
                        >
                          Approve
                        </button>
                      )}
                      {v.status !== 'rejected' && (
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason (e.g. Blurry photo, mismatched ID):');
                            if (reason !== null) {
                              handleUpdateStatus(v._id, 'rejected', reason);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg font-semibold transition-colors text-xs"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVoter(v._id, v.name)}
                        title="Permanently Delete Registration"
                        className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-600/80 text-red-400 hover:text-white rounded-lg font-semibold transition-colors border border-red-800/40 text-xs inline-flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Biometric KYC Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-white text-base">Registered Biometric Face</h3>
            <p className="text-xs text-slate-400">{selectedPhoto.name}</p>
            <div className="w-56 h-56 mx-auto rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
              <img src={selectedPhoto.url} alt="Face" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

