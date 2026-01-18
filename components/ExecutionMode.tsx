
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NeuralProtocol, ChatMessage } from '../types';
import { synthesizeVoiceInstruction, verifyTechnique, askSousChef } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Volume2, Camera, X, Trophy, 
  CheckCircle2, Sparkles, AlertCircle, 
  Play, Pause, RotateCcw, Target, MessageSquare, Send, Loader2, ArrowRight
} from 'lucide-react';

interface ExecutionModeProps {
  protocol: NeuralProtocol;
  onComplete: () => void;
}

const ExecutionMode: React.FC<ExecutionModeProps> = ({ protocol, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; feedback: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const currentStep = protocol.instructions[currentStepIndex];

  useEffect(() => {
    if (currentStep.timer_seconds) {
      setTimeLeft(currentStep.timer_seconds);
      setIsTimerRunning(false);
    } else {
      setTimeLeft(0);
      setIsTimerRunning(false);
    }
    setVerificationResult(null);
  }, [currentStepIndex, currentStep.timer_seconds]);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleTimerComplete = () => {
    playVoice("Precision cycle complete. Advance to the next phase.");
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) { }
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playVoice = useCallback(async (text: string) => {
    stopAudio();
    setIsPlaying(true);
    try {
      const buffer = await synthesizeVoiceInstruction(text);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { setIsPlaying(false); audioSourceRef.current = null; };
      audioSourceRef.current = source;
      source.start();
    } catch (err) { setIsPlaying(false); }
  }, [stopAudio]);

  const handlePrev = () => {
    stopAudio();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setVerificationResult(null);
    }
  };

  const handleNext = () => {
    stopAudio();
    if (currentStepIndex < protocol.instructions.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setVerificationResult(null);
    } else {
      setIsFinished(true);
    }
  };

  const initiateVerification = async () => {
    setIsVerifying(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setTimeout(async () => {
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
            const res = await verifyTechnique(base64, currentStep.instruction);
            setVerificationResult(res);
          }
          setIsVerifying(false);
          stream.getTracks().forEach(track => track.stop());
        }
      }, 2500);
    } catch (err) {
      setIsVerifying(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isAssistantTyping) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg, timestamp: Date.now() }]);
    setIsAssistantTyping(true);
    try {
      const response = await askSousChef(userMsg, protocol, currentStepIndex);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Handshake interrupted.", timestamp: Date.now() }]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  // Adaptive Typography Logic
  const instructionLength = currentStep.instruction.length;
  let instructionFontSize = "text-4xl md:text-5xl lg:text-6xl";
  if (instructionLength > 150) {
    instructionFontSize = "text-xl md:text-2xl lg:text-3xl";
  } else if (instructionLength > 80) {
    instructionFontSize = "text-2xl md:text-3xl lg:text-4xl";
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-white z-[300] overflow-y-auto flex items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl text-center space-y-8">
           <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-[#0A0A0B] rounded-[1.8rem] flex items-center justify-center text-white shadow-xl">
                 <Trophy size={28} className="text-[#C5A028]" />
              </div>
              <h2 className="text-5xl font-bold tracking-tighter text-[#0A0A0B]">Sequence <span className="serif italic text-[#C5A028] font-normal">Finalized</span></h2>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-black/30">Culinary Intelligence sequence complete</p>
           </div>
           <button onClick={onComplete} className="px-10 py-4 bg-[#0A0A0B] text-white rounded-full font-bold text-[9px] uppercase tracking-[0.3em] shadow-lg hover:bg-[#C5A028] transition-all">Archive Study</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center overflow-hidden font-sans selection-gold">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none grayscale">
        <img src={protocol.visualUrl} className="w-full h-full object-cover" />
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 40, stiffness: 300 }}
            className="absolute top-0 right-0 h-full w-full md:w-[380px] glass-premium z-[250] border-l border-black/[0.04] flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b border-black/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Sparkles size={16} className="text-[#C5A028]" />
                <h3 className="text-sm font-bold tracking-tight">Technical Assist</h3>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-black/[0.04] rounded-full transition-colors"><X size={16} className="text-black/30" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] px-5 py-3 rounded-2xl text-[12px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#0A0A0B] text-white' : 'bg-black/[0.03] text-black/70'}`}>{msg.content}</div>
                </div>
              ))}
              {isAssistantTyping && <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/20 animate-pulse">Assistant is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-6 border-t border-black/[0.02]">
              <div className="relative">
                <input 
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask for technique refinement..."
                  className="w-full bg-black/[0.02] border-none rounded-xl pl-5 pr-12 py-3 text-xs focus:ring-1 ring-[#C5A028]/30 transition-all"
                />
                <button onClick={handleSendChat} disabled={!chatInput.trim() || isAssistantTyping} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#C5A028] disabled:opacity-20"><Send size={16} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center gap-10 text-center">
         <div className="flex items-center gap-2.5 opacity-10">
            {protocol.instructions.map((_, i) => (
              <div key={i} className={`h-0.5 rounded-full transition-all duration-1000 ${i === currentStepIndex ? 'w-6 bg-black' : 'w-2 bg-black'}`} />
            ))}
         </div>

         <AnimatePresence mode="wait">
           <motion.div 
             key={currentStepIndex} 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
             transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
             className="w-full min-h-[250px] flex flex-col items-center justify-center gap-6"
           >
              <div className="space-y-4">
                 <div className="flex items-center justify-center gap-2">
                    <Target size={11} className="text-[#C5A028] opacity-60" />
                    <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-[#C5A028]">Phase {currentStepIndex + 1} // {currentStep.technique}</span>
                 </div>
                 <h2 className={`${instructionFontSize} font-bold tracking-tighter leading-tight text-[#0A0A0B] serif italic transition-all duration-500 max-w-3xl mx-auto`}>
                    {currentStep.instruction}
                 </h2>
                 {verificationResult && (
                   <div className={`mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full border text-[9px] font-bold uppercase tracking-[0.3em] ${verificationResult.success ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700/70' : 'bg-amber-50/50 border-amber-100 text-amber-700/70'}`}>
                      {verificationResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {verificationResult.feedback}
                   </div>
                 )}
              </div>

              {currentStep.timer_seconds && timeLeft > 0 && (
                <div className="flex flex-col items-center gap-4 pt-2">
                   <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                         {/* Background Track */}
                         <circle 
                           cx="50" 
                           cy="50" 
                           r="44" 
                           stroke="rgba(0,0,0,0.03)" 
                           strokeWidth="2" 
                           fill="transparent" 
                         />
                         {/* Progress Ring */}
                         <motion.circle 
                            cx="50" 
                            cy="50" 
                            r="44" 
                            stroke="#C5A028" 
                            strokeWidth="2.5" 
                            fill="transparent"
                            strokeDasharray="276.5" 
                            animate={{ strokeDashoffset: 276.5 - (276.5 * (timeLeft / currentStep.timer_seconds)) }}
                            strokeLinecap="round"
                         />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-black/80">{formatTime(timeLeft)}</div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 rounded-full bg-[#0A0A0B] text-white shadow-md hover:scale-110 transition-transform">{isTimerRunning ? <Pause size={12} /> : <Play size={12} />}</button>
                      <button onClick={() => { setTimeLeft(currentStep.timer_seconds || 0); setIsTimerRunning(false); }} className="p-2 rounded-full bg-black/[0.03] text-black/40 hover:bg-black/[0.08] transition-all"><RotateCcw size={12} /></button>
                   </div>
                </div>
              )}
           </motion.div>
         </AnimatePresence>
         
         {/* Refined Navigation Cluster */}
         <div className="flex items-center justify-center gap-6 pt-6">
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-12 h-12 rounded-2xl border border-black/[0.04] flex items-center justify-center transition-all ${isChatOpen ? 'bg-[#0A0A0B] text-white shadow-lg' : 'bg-white hover:border-black/10'}`}><MessageSquare size={18} /></button>
            <button disabled={currentStepIndex === 0} onClick={handlePrev} className={`w-12 h-12 rounded-2xl border border-black/[0.04] flex items-center justify-center transition-all ${currentStepIndex === 0 ? 'opacity-5' : 'bg-white hover:border-black/10'}`}><ChevronLeft size={18} /></button>
            
            <button onClick={() => playVoice(currentStep.instruction)} className={`w-20 h-20 rounded-[2rem] bg-[#0A0A0B] flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 ${isPlaying ? 'ring-4 ring-[#C5A028]/10' : ''}`}>
               <Volume2 color={isPlaying ? "#C5A028" : "white"} size={28} strokeWidth={1.5} />
            </button>
            
            <button onClick={handleNext} className="w-12 h-12 rounded-2xl bg-[#C5A028] text-white flex items-center justify-center shadow-lg hover:bg-[#0A0A0B] transition-all">
               {currentStepIndex === protocol.instructions.length - 1 ? <Trophy size={18} /> : <ArrowRight size={18} />}
            </button>
            <button onClick={initiateVerification} disabled={isVerifying} className={`w-12 h-12 rounded-2xl border border-black/[0.04] flex items-center justify-center transition-all ${isVerifying ? 'animate-pulse bg-[#C5A028]/5' : 'bg-white hover:border-black/10'}`}>
               {isVerifying ? <Loader2 size={18} className="animate-spin text-[#C5A028]" /> : <Camera size={18} />}
            </button>
         </div>
      </div>

      <canvas ref={canvasRef} className="hidden" width="1280" height="720"></canvas>
      <video ref={videoRef} autoPlay playsInline className="hidden"></video>
    </div>
  );
};

export default ExecutionMode;
