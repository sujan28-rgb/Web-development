import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  ArrowRight,
  RefreshCw,
  FileImage,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Task, CompleteTaskResponse } from '../types';
import { api } from '../utils/api';

interface ProofVerificationModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: CompleteTaskResponse) => void;
}

// Helper to create clean sample demo images for rapid testing of the user's example
function createWaterBottleSvg(isFull: boolean): string {
  const waterHeight = isFull ? '140' : '20';
  const waterY = isFull ? '70' : '190';
  const labelText = isFull ? 'BEFORE: 2.5L Full Bottle' : 'AFTER: 2.5L Hydrated (Empty)';
  const badgeColor = isFull ? '#0284c7' : '#16a34a';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#0f172a" rx="16"/>
    <defs>
      <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0.95"/>
      </linearGradient>
      <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <!-- Cap & Spout -->
    <rect x="185" y="30" width="30" height="20" rx="4" fill="#64748b"/>
    <rect x="190" y="22" width="20" height="8" rx="2" fill="#94a3b8"/>
    <!-- Bottle Outline -->
    <rect x="160" y="50" width="80" height="170" rx="20" fill="#1e293b" stroke="#475569" stroke-width="3"/>
    <!-- Water liquid fill -->
    <rect x="165" y="${waterY}" width="70" height="${waterHeight}" rx="12" fill="url(#waterGrad)"/>
    <!-- Glass reflection -->
    <rect x="162" y="52" width="76" height="166" rx="18" fill="url(#glassGrad)"/>
    <!-- Measurement lines -->
    <line x1="170" y1="90" x2="185" y2="90" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="2 2"/>
    <text x="190" y="93" fill="#cbd5e1" font-size="10" font-family="sans-serif">2.5 L</text>
    <line x1="170" y1="130" x2="185" y2="130" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="2 2"/>
    <text x="190" y="133" fill="#cbd5e1" font-size="10" font-family="sans-serif">1.5 L</text>
    <line x1="170" y1="170" x2="185" y2="170" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="2 2"/>
    <text x="190" y="173" fill="#cbd5e1" font-size="10" font-family="sans-serif">0.5 L</text>
    <!-- Label Pill -->
    <rect x="50" y="240" width="300" height="36" rx="18" fill="${badgeColor}"/>
    <text x="200" y="263" fill="#ffffff" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${labelText}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const ProofVerificationModal: React.FC<ProofVerificationModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [beforeImage, setBeforeImage] = useState<string>('');
  const [afterImage, setAfterImage] = useState<string>('');
  const [singleImage, setSingleImage] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidence: number;
    feedback: string;
    analysis?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isBeforeAfter = task.proof_type === 'before_after_photo';
  const isNoteOnly = task.proof_type === 'note_only';

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
      setErrorMessage('');
      setVerificationResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadDemoPhotos = () => {
    setBeforeImage(createWaterBottleSvg(true));
    setAfterImage(createWaterBottleSvg(false));
    setUserNote('Drank full 2.5L bottle through the day. Feeling re-energized!');
    setErrorMessage('');
    setVerificationResult(null);
  };

  const handleVerifyAndSubmit = async () => {
    setErrorMessage('');

    if (isBeforeAfter) {
      if (!beforeImage) {
        setErrorMessage('Please provide a Before photo to show your starting point.');
        return;
      }
      if (!afterImage) {
        setErrorMessage('Please provide an After photo showing your completed achievement.');
        return;
      }
    } else if (!isNoteOnly) {
      if (!singleImage && !beforeImage && !afterImage) {
        setErrorMessage('Please upload a photo showing proof of completion.');
        return;
      }
    }

    setIsVerifying(true);

    try {
      // 1. Call AI Verification service
      const verifyRes = await api.aiVerifyProof({
        taskTitle: task.title,
        taskDescription: task.description,
        proofCriteria: task.proof_criteria || 'Demonstrate task completion',
        proofType: task.proof_type || 'single_photo',
        beforeImageBase64: beforeImage,
        afterImageBase64: isBeforeAfter ? afterImage : (singleImage || afterImage),
        userNote: userNote.trim(),
      });

      setVerificationResult(verifyRes);

      if (verifyRes.verified) {
        // Complete the quest on server & update hero stats
        const completeRes = await api.completeTask(task.id, {
          proof_verified: true,
          proof_feedback: verifyRes.feedback,
          proof_type: task.proof_type,
          before_image_url: beforeImage,
          after_image_url: isBeforeAfter ? afterImage : (singleImage || afterImage),
          user_note: userNote.trim(),
          confidence: verifyRes.confidence,
        });

        // Delay slightly for smooth celebration display
        setTimeout(() => {
          setIsVerifying(false);
          onSuccess(completeRes);
          onClose();
        }, 1200);
      } else {
        setIsVerifying(false);
      }
    } catch (err: any) {
      console.error('Proof verification failed:', err);
      setIsVerifying(false);
      setErrorMessage(err.message || 'Verification could not be processed. Please try again.');
    }
  };

  return (
    <div
      id="proof-verification-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying) {
          onClose();
        }
      }}
    >
      <motion.div
        id="proof-verification-card"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header Accent Glow */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500" />

        {/* Modal Top Bar */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Proof of Completion
              </span>
              <span className="text-xs text-slate-400">
                +{task.xp_reward} XP • +{task.gold_reward} Gold
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-slate-300 line-clamp-2">{task.description}</p>
            )}
          </div>
          <button
            id="close-proof-modal-btn"
            onClick={onClose}
            disabled={isVerifying}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions Box */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 text-sm">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">
                {isBeforeAfter
                  ? 'Before & After Verification'
                  : isNoteOnly
                  ? 'Written Reflection'
                  : 'Photo Proof Verification'}
              </p>
              <p className="text-slate-300">
                {task.proof_criteria ||
                  (isBeforeAfter
                    ? 'Upload a photo showing your starting point, and a photo of your finished result.'
                    : 'Upload a clear photo verifying you completed your quest.')}
              </p>
            </div>
          </div>

          {/* Quick Demo Water Bottle Photos helper */}
          {task.title.toLowerCase().includes('water') && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Test this quest immediately with sample water bottle photos:</span>
              </div>
              <button
                id="use-demo-water-photos-btn"
                type="button"
                onClick={handleLoadDemoPhotos}
                className="px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition-colors"
              >
                Use Demo Photos
              </button>
            </div>
          )}

          {/* Photo Upload Zone */}
          {isBeforeAfter ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Photo Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    1. Before Photo (Starting)
                  </label>
                  {beforeImage && (
                    <button
                      type="button"
                      onClick={() => setBeforeImage('')}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  onClick={() => beforeInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all ${
                    beforeImage
                      ? 'border-sky-500/50 bg-slate-950'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  {beforeImage ? (
                    <img
                      src={beforeImage}
                      alt="Before quest"
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-700/60 flex items-center justify-center text-slate-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-slate-300">
                        Click or drag to upload <span className="text-sky-400 font-semibold">Before</span> photo
                      </p>
                      <p className="text-[11px] text-slate-500">e.g. Full 2.5L water bottle</p>
                    </div>
                  )}
                  <input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setBeforeImage)}
                  />
                </div>
              </div>

              {/* After Photo Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. After Photo (Finished)
                  </label>
                  {afterImage && (
                    <button
                      type="button"
                      onClick={() => setAfterImage('')}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div
                  onClick={() => afterInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all ${
                    afterImage
                      ? 'border-emerald-500/50 bg-slate-950'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  {afterImage ? (
                    <img
                      src={afterImage}
                      alt="After quest"
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-700/60 flex items-center justify-center text-slate-300">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-slate-300">
                        Click or drag to upload <span className="text-emerald-400 font-semibold">After</span> photo
                      </p>
                      <p className="text-[11px] text-slate-500">e.g. Finished empty bottle</p>
                    </div>
                  )}
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setAfterImage)}
                  />
                </div>
              </div>
            </div>
          ) : !isNoteOnly ? (
            /* Single Photo Upload */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Photo Proof
                </label>
                {singleImage && (
                  <button
                    type="button"
                    onClick={() => setSingleImage('')}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div
                onClick={() => singleInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all ${
                  singleImage
                    ? 'border-sky-500/50 bg-slate-950'
                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/80'
                }`}
              >
                {singleImage ? (
                  <img
                    src={singleImage}
                    alt="Proof"
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-700/60 flex items-center justify-center text-slate-300">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-300">
                      Click or drag to upload your quest proof photo
                    </p>
                    <p className="text-[11px] text-slate-500">JPG, PNG, or WebP</p>
                  </div>
                )}
                <input
                  ref={singleInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setSingleImage)}
                />
              </div>
            </div>
          ) : null}

          {/* User Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hero Reflection / Notes (Optional)
            </label>
            <textarea
              id="proof-user-note"
              rows={2}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Add any comments on how you conquered this quest..."
              className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verification Feedback Banner */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                verificationResult.verified
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                {verificationResult.verified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Quest Verified by AI! (+{verificationResult.confidence}% Confidence)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <span>Verification Needed</span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{verificationResult.feedback}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-proof-btn"
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              id="submit-verify-proof-btn"
              type="button"
              onClick={handleVerifyAndSubmit}
              disabled={isVerifying}
              className="relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Inspecting Proof...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-800" />
                  <span>Verify with AI & Finish Quest</span>
                  <ArrowRight className="w-4 h-4 text-amber-900" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
