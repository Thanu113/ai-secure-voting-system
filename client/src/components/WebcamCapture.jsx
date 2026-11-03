import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

export default function WebcamCapture({
  onCapture,
  onBurstCapture,
  mode = 'single', // 'single' | 'liveness'
  guideTitle = 'Align your face directly inside the oval',
}) {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  // Single Frame Snapshot from Live Webcam Feed
  const captureSingle = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (imageSrc) {
      setCapturedImage(imageSrc);
      if (onCapture) {
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  // Burst capture for live blink & liveness detection
  const captureBurst = useCallback(async () => {
    if (!webcamRef.current) return;
    setIsCapturingBurst(true);
    setBurstCount(0);
    const frames = [];

    // Capture 4 live video frames with 300ms interval for natural micro-motion & blink detection
    for (let i = 0; i < 4; i++) {
      setBurstCount(i + 1);
      const screenshot = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (screenshot) {
        frames.push(screenshot);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsCapturingBurst(false);
    if (frames.length > 0) {
      setCapturedImage(frames[frames.length - 1]);
      if (onCapture) onCapture(frames[frames.length - 1]);
      if (onBurstCapture) onBurstCapture(frames);
    }
  }, [onCapture, onBurstCapture]);

  const retake = () => {
    setCapturedImage(null);
    setBurstCount(0);
    if (onCapture) onCapture(null);
    if (onBurstCapture) onBurstCapture([]);
  };

  const retryCamera = () => {
    setCameraError(null);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-md aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center text-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Live Camera Access Required</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                For anti-spoofing security, static photo uploads are disabled. Please grant camera access by clicking the padlock or camera icon in your browser address bar.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={retryCamera}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-xl shadow-lg shadow-blue-600/30 transition-colors"
              >
                Retry Camera Access
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full">
            <img src={capturedImage} alt="Captured Face" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-xs px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1 shadow-lg backdrop-blur">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live Biometric Captured</span>
            </div>
          </div>
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMediaError={(err) => setCameraError(err)}
              className="w-full h-full object-cover"
              mirrored={true}
            />

            {/* Biometric Oval Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div
                className={`w-44 h-56 rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                  isCapturingBurst
                    ? 'border-emerald-400 scale-105 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                    : 'border-blue-400/70 shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                }`}
              />
              <span className="mt-2 text-xs font-medium text-slate-200 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur border border-slate-700/60 shadow-lg">
                {isCapturingBurst ? `Analyzing Liveness (${burstCount}/4)... Blink naturally` : guideTitle}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Controls */}
      <div className="mt-4 flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-3">
          {capturedImage ? (
            <button
              type="button"
              onClick={retake}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
          ) : mode === 'liveness' ? (
            <button
              type="button"
              disabled={isCapturingBurst || !!cameraError}
              onClick={captureBurst}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>{isCapturingBurst ? 'Recording Liveness...' : 'Verify Liveness & Blink'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!!cameraError}
              onClick={captureSingle}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Live Face</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Security Policy: Live webcam verification is strictly enforced to prevent photo impersonation attacks.
        </p>
      </div>
    </div>
  );
}
