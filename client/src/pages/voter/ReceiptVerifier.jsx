import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { voteService } from '../../services/voteService';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';

export default function ReceiptVerifier() {
  const [searchParams] = useSearchParams();
  const initialHash = searchParams.get('hash') || '';

  const [receiptHash, setReceiptHash] = useState(initialHash);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!receiptHash.trim()) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await voteService.verifyReceipt(receiptHash.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Receipt token not found in the cryptographic blockchain ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialHash) {
      handleVerify();
    }
  }, [initialHash]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Public Ledger Receipt Auditor
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Verify that your anonymous ballot was cryptographically included in the tamper-proof SHA-256 election ledger.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={receiptHash}
              onChange={(e) => setReceiptHash(e.target.value)}
              placeholder="e.g. REC-8A9F32BC..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !receiptHash.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Audit Receipt</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Verified Receipt Card */}
      {result && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ballot Verified on Cryptographic Ledger</h3>
              <p className="text-xs text-emerald-400 font-medium">Valid Block Integrity • Mathematically Immutable</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400 font-sans">Election:</span>
              <span className="text-slate-200 font-semibold">{result.electionTitle}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400 font-sans">Sequence Position:</span>
              <span className="text-blue-400 font-bold">Block #{result.sequenceNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400 font-sans">Recorded Timestamp:</span>
              <span className="text-slate-300">{new Date(result.timestamp).toLocaleString()}</span>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-slate-400 font-sans block">Block SHA-256 Hash:</span>
              <span className="text-slate-300 text-[11px] break-all bg-slate-900 p-2 rounded block border border-slate-800">
                {result.blockHash}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-slate-400 font-sans block">Previous Block Linked Hash (prevHash):</span>
              <span className="text-slate-500 text-[11px] break-all bg-slate-900 p-2 rounded block border border-slate-800">
                {result.prevHash}
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300">
            <strong>Cryptographic Privacy Guarantee:</strong> The voter's candidate choice is stored separately from identity and cannot be reverse-engineered from this receipt. This mathematically proves your ballot was tallied while ensuring absolute secret ballot privacy.
          </div>
        </div>
      )}
    </div>
  );
}

