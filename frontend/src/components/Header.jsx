import React from 'react';
import { Cpu, ShieldCheck, Film, Sparkles } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';

export default function Header({ systemStatus }) {
  return (
    <header className="w-full glass-panel px-6 py-4 mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 shadow-xl">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
          <Film className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight gradient-text">SubtitlePro AI</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              v1.0 Local
            </span>
          </div>
          <p className="text-xs text-gray-400">Estudio de Subtítulos y Transcripción para YouTube, Canciones y Vídeo</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Privado</span>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>{systemStatus?.gpu_name || "NVIDIA CUDA GPU"}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
          <YoutubeIcon className="w-4 h-4" />
          <span>Subtítulos YouTube (.srt)</span>
        </div>
      </div>
    </header>
  );
}
