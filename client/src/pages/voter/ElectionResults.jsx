import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { electionService } from '../../services/electionService';
import { Trophy, BarChart3, AlertCircle, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';

export default function ElectionResults() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await electionService.getResults(id);
        setResults(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Election results are sealed until poll close.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Results Unavailable</h3>
        <p className="text-sm text-slate-400">{error || 'Election results could not be retrieved.'}</p>
        <Link
          to="/voter/dashboard"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Elections</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              Certified Results
            </span>
            <span className="text-xs text-slate-400">Total Turnout: {results.totalVotesCast} votes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{results.title}</h1>
        </div>

        <Link
          to="/verify-receipt"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Audit Your Receipt</span>
        </Link>
      </div>

      {/* Winner Spotlight Banner */}
      {results.winner && results.totalVotesCast > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex items-center space-x-6 shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Projected Winner</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">{results.winner.name}</h2>
            <p className="text-xs text-slate-300">
              {results.winner.party} • Secured <strong className="text-amber-300">{results.winner.voteCount}</strong> votes ({results.winner.percentage}%)
            </p>
          </div>
        </div>
      )}

      {/* Candidate Breakdown Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>Candidate Vote Breakdown</span>
        </h3>

        <div className="space-y-5">
          {results.candidates?.map((cand, idx) => (
            <div key={cand.candidateId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-white">{cand.name}</span>
                  <span className="text-xs text-slate-400">({cand.party})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white text-sm">{cand.voteCount} votes</span>
                  <span className="text-xs text-slate-400 ml-2">({cand.percentage}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    idx === 0
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${Math.max(1, cand.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-start">
        <Link
          to="/voter/dashboard"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Elections</span>
        </Link>
      </div>
    </div>
  );
}

