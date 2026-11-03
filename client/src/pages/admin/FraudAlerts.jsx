import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getFraudAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fraud alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id, status) => {
    const note = prompt(`Enter resolution note for ${status}:`);
    if (note === null) return;

    try {
      await adminService.resolveFraudAlert(id, status, note);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve alert.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <span>Machine Learning Fraud & Anomaly Surveillance</span>
        </h1>
        <p className="text-sm text-slate-400">
          Isolation Forest behavioral anomaly detections: sub-second bot scripts, credential stuffing, and session anomalies
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Flagged Anomalies</h3>
          <p className="text-xs text-slate-400">All recent voting telemetry matches normal human behavioral distributions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`bg-slate-900 border rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between ${
                alert.status === 'FLAGGED'
                  ? 'border-rose-500/40 shadow-rose-500/5'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      alert.status === 'FLAGGED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                        : alert.status === 'RESOLVED_ALLOWED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {alert.status}
                  </span>

                  <span className="text-xs font-mono font-bold text-rose-400">
                    Anomaly Score: {alert.anomalyScore}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{alert.userId?.name || 'Voter Session'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {alert.userId?.voterId || 'N/A'} • {alert.userId?.email}
                  </p>
                </div>

                {/* Behavioral Telemetry Feature Breakdown */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Time-to-Vote:</span>
                    <span className={`font-bold ${alert.features?.timeToVoteSeconds < 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {alert.features?.timeToVoteSeconds}s {alert.features?.timeToVoteSeconds < 3 && '(Bot Script Alert)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">IP Switches:</span>
                    <span className="text-slate-200 font-bold">{alert.features?.ipChangeCount} hops</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Failed Attempt Ratio:</span>
                    <span className="text-slate-200 font-bold">
                      {(alert.features?.failedAttemptsRatio * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Logins (24h):</span>
                    <span className="text-slate-200 font-bold">{alert.features?.loginFrequency24h}</span>
                  </div>
                </div>

                {alert.reviewNote && (
                  <p className="text-xs text-slate-400 italic bg-slate-800/40 p-2 rounded border border-slate-700/50">
                    Official Note: {alert.reviewNote}
                  </p>
                )}
              </div>

              {/* Action Buttons for Flagged Alerts */}
              {alert.status === 'FLAGGED' && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleResolve(alert._id, 'RESOLVED_ALLOWED')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Permit Ballot</span>
                  </button>

                  <button
                    onClick={() => handleResolve(alert._id, 'RESOLVED_BLOCKED')}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Flag Impersonation</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

