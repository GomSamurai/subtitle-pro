import React from 'react';
import { Loader2, Sparkles, Cpu, Film } from 'lucide-react';

export default function ProgressOverlay({ isProcessing, currentStep }) {
  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel glass-panel-glow max-w-md w-full p-8 text-center rounded-2xl relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>

        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20 relative">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <h3 className="text-xl font-extrabold text-gray-100 mb-2 gradient-text">
          Transcribiendo y Procesando Audio...
        </h3>

        <p className="text-sm text-gray-300 mb-6 font-medium">
          {currentStep || 'Extrayendo audio y procesando con la IA...'}
        </p>

        {/* Animated Audio Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-10 mb-6">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
          <span className="w-1.5 h-9 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
          <span className="w-1.5 h-5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
          <span className="w-1.5 h-10 bg-indigo-500 rounded-full animate-bounce"></span>
          <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
          <span className="w-1.5 h-7 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 flex items-center justify-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Ejecución privada en tu tarjeta gráfica local</span>
        </div>
      </div>
    </div>
  );
}
