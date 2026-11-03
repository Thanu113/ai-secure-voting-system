import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionService } from '../../services/electionService';
import { voteService } from '../../services/voteService';
import WebcamCapture from '../../components/WebcamCapture';
import ReceiptModal from '../../components/ReceiptModal';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  ArrowRight,
  ArrowLeft,
  UserCheck
} from 'lucide-react';

export default function BallotBooth() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Voting Wizard Steps: 1: Select Candidate, 2: Biometric Verification, 3: Review & Cast
  const [step, setStep] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [liveImage, setLiveImage] = useState(null);
  const [burstFrames, setBurstFrames] = useState([]);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [verifyingBiometrics, setVerifyingBiometrics] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Behavioral Telemetry for ML Fraud Detection
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const res = await electionService.getElectionById(id);
        if (res.data?.hasVoted) {
          navigate('/voter/dashboard');
          return;
        }
        setElection(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Election not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchElection();
  }, [id, navigate]);

  // Step 2: Run Biometric Check
  const handleVerifyBiometrics = async () => {
    if (!liveImage) {
      setError('Please capture your live webcam photo to verify biometric identity.');
      return;
    }

    setError(null);
    setVerifyingBiometrics(true);

    try {
      const res = await voteService.verifyBiometrics(liveImage, burstFrames);
      if (res.data?.verified) {
        setBiometricVerified(true);
        setStep(3); // Advance to confirmation
      } else {
        setError('Facial verification failed: Live face does not match your registered voter photo.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Biometric verification service failed.');
    } finally {
      setVerifyingBiometrics(false);
    }
  };

  // Step 3: Cast Vote to Blockchain Ledger
  const handleCastVote = async () => {
    setError(null);
    setSubmittingVote(true);

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await voteService.castVote({
        electionId: id,
        candidateId: selectedCandidate.candidateId,
        liveImage,
        frames: burstFrames,
        telemetry: {
          timeToVoteSeconds: elapsedSeconds,
          loginFrequency24h: 1,
          ipChangeCount: 0,
          failedAttemptsRatio: 0.0,
        },
      });

      if (res.data) {
        setReceiptData(res.data);
        setShowReceipt(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ballot to the ledger.');
    } finally {
      setSubmittingVote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Election Unavailable</h3>
        <p className="text-xs text-slate-400">This election could not be loaded or is closed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{election.title}</h1>
            <p className="text-xs text-slate-400">Encrypted Electronic Ballot Booth</p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            1. Select
          </span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            2. Biometrics
          </span>
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            3. Seal Ballot
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CANDIDATE SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Step 1: Choose Your Candidate</h2>
            <p className="text-xs text-slate-400">
              Select one candidate from the approved roster. Your choice will be sealed with cryptographic anonymity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {election.candidates?.map((cand) => {
              const isSelected = selectedCandidate?.candidateId === cand.candidateId;
              return (
                <div
                  key={cand.candidateId}
                  onClick={() => setSelectedCandidate(cand)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-300 overflow-hidden flex-shrink-0">
                      {cand.photoUrl ? (
                        <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                      ) : (
                        cand.name.charAt(0)
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base">{cand.name}</h3>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {cand.party}
                      </span>
                    </div>
                  </div>

                  {cand.manifesto && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      "{cand.manifesto}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              disabled={!selectedCandidate}
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 flex items-center space-x-2"
            >
              <span>Continue to Biometric Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BIOMETRIC WEBCAM & LIVENESS VERIFICATION */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <span>Step 2: Facial Biometric & Liveness Verification</span>
            </h2>
            <p className="text-xs text-slate-400">
              To thwart impersonation and ballot stuffing, click "Verify Liveness" to take a multi-frame blink challenge matching your registered KYC embedding.
            </p>
          </div>

          <WebcamCapture
            mode="liveness"
            guideTitle="Blink naturally when burst recording"
            onCapture={(img) => setLiveImage(img)}
            onBurstCapture={(frames) => setBurstFrames(frames)}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Selection</span>
            </button>

            <button
              type="button"
              disabled={!liveImage || verifyingBiometrics}
              onClick={handleVerifyBiometrics}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              {verifyingBiometrics ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Matching 128-d Biometrics...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Verify Identity & Proceed</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CRYPTOGRAPHIC SUBMISSION */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Step 3: Review & Seal Ballot</span>
            </h2>
            <p className="text-xs text-slate-400">
              Identity verified. Once cast, your ballot is chained to the blockchain ledger and cannot be altered or re-cast.
            </p>
          </div>

          {/* Confirmation Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs text-slate-400">Election:</span>
              <span className="font-semibold text-white">{election.title}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs text-slate-400">Selected Candidate:</span>
              <div className="text-right">
                <span className="font-bold text-blue-400 block text-base">{selectedCandidate?.name}</span>
                <span className="text-xs text-slate-400">{selectedCandidate?.party}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Biometric Verification:</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Match</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={submittingVote}
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Re-check Biometrics</span>
            </button>

            <button
              type="button"
              disabled={submittingVote}
              onClick={handleCastVote}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center space-x-2"
            >
              {submittingVote ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Chaining Ballot Block...</span>
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  <span>Cast & Seal My Ballot</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Cryptographic Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          navigate('/voter/dashboard');
        }}
        receiptData={receiptData}
      />
    </div>
  );
}

