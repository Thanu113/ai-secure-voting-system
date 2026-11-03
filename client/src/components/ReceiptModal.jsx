import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, Copy, Check, Printer, Shield, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReceiptModal({ isOpen, onClose, receiptData }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti on modal open
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen || !receiptData) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(receiptData.receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Ballot Cryptographically Sealed</h2>
          <p className="text-sm text-slate-400">
            Your vote is recorded anonymously on the immutable ledger. Save your receipt below to verify it later.
          </p>
        </div>

        {/* Receipt Ticket Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-slate-400 font-sans text-xs">Election:</span>
            <span className="font-semibold text-slate-200 text-right">{receiptData.electionTitle || 'Official Election'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-sans text-xs block">Voter Receipt Token (Save this!):</span>
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-700">
              <span className="text-blue-400 font-bold text-sm tracking-wider select-all break-all">
                {receiptData.receiptHash}
              </span>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-slate-400 font-sans text-xs block">Ledger Block #:</span>
              <span className="text-slate-200 font-bold">{receiptData.sequenceNumber || 1}</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans text-xs block">Timestamp:</span>
              <span className="text-slate-300">
                {new Date(receiptData.timestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-500 font-sans text-[11px] block">SHA-256 Ledger Hash:</span>
            <span className="text-slate-400 text-[10px] break-all select-all block">
              {receiptData.blockHash}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={printReceipt}
            className="w-full sm:w-1/2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <Link
            to={`/verify-receipt?hash=${encodeURIComponent(receiptData.receiptHash)}`}
            onClick={onClose}
            className="w-full sm:w-1/2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30"
          >
            <Shield className="w-4 h-4" />
            <span>Audit on Ledger</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

