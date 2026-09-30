import React from 'react';
import { Sliders, Cpu, Music, Zap, Sparkles, Check } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';

export default function ParameterPanel({
  systemStatus,
  params,
  onChange,
  onStartTranscribe,
  isProcessing,
  disabled
}) {
  const models = systemStatus?.available_models || [
    { id: 'tiny', name: 'Tiny (~39M)', speed: 'Ultra Rápido', accuracy: 'Básica' },
    { id: 'base', name: 'Base (~74M)', speed: 'Muy Rápido', accuracy: 'Buena' },
    { id: 'small', name: 'Small (~244M)', speed: 'Rápido (Recomendado)', accuracy: 'Alta' },
    { id: 'medium', name: 'Medium (~769M)', speed: 'Moderado', accuracy: 'Muy Alta' },
    { id: 'large-v3', name: 'Large-v3 (~1.5B)', speed: 'Precisión Máxima', accuracy: 'Excelente' }
  ];

  const languages = systemStatus?.languages || [
    { code: 'auto', name: '🌐 Detección Automática' },
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'Inglés' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' }
  ];

  const applyPreset = (preset) => {
    if (preset === 'youtube') {
      onChange('max_chars', 42);
      onChange('vad_filter', false);
      onChange('model', 'small');
    } else if (preset === 'music') {
      onChange('max_chars', 50);
      onChange('vad_filter', false); // Crucial for songs!
      onChange('model', 'medium');
    } else if (preset === 'tiktok') {
      onChange('max_chars', 28);
      onChange('vad_filter', false);
      onChange('model', 'small');
    }
  };

  return (
    <div className="w-full glass-panel p-8">
      {/* Title & Presets Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-100">Configuración de Transcripción</h3>
            <p className="text-xs text-gray-400">Personaliza el modelo de IA y las reglas de formateo</p>
          </div>
        </div>

        {/* Preset Mode Selection Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold mr-1">Preajuste rápido:</span>
          <button
            type="button"
            onClick={() => applyPreset('youtube')}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <YoutubeIcon className="w-4 h-4 text-rose-400" />
            <span>YouTube Standard</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('music')}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Music className="w-4 h-4 text-purple-400" />
            <span>🎵 Canciones & Música</span>
          </button>
        </div>
      </div>

      {/* Main Parameters 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">
            Modelo de IA (Whisper)
          </label>
          <select
            value={params.model}
            onChange={(e) => onChange('model', e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.accuracy}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400">
            * <strong className="text-indigo-300">Small</strong> o <strong className="text-purple-300">Medium</strong> son ideales para canciones y vídeos en español/inglés.
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">
            Idioma del Audio
          </label>
          <select
            value={params.language}
            onChange={(e) => onChange('language', e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400">
            Detección automática o idioma fijo para mayor rapidez.
          </p>
        </div>

        {/* Max Chars per line */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <YoutubeIcon className="w-4 h-4 text-rose-400" />
            <span>Máx. Caracteres por Línea</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="20"
              max="80"
              value={params.max_chars}
              onChange={(e) => onChange('max_chars', parseInt(e.target.value) || 42)}
              disabled={disabled}
              className="w-28 bg-slate-900 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-gray-100 font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <span className="text-xs text-gray-400 font-mono">
              (Estándar YouTube: <strong>42</strong>)
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Divide las frases automáticamente para no saturar la pantalla.
          </p>
        </div>

        {/* Task Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">
            Acción / Modo
          </label>
          <select
            value={params.task}
            onChange={(e) => onChange('task', e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
          >
            <option value="transcribe">Transcribir en idioma original</option>
            <option value="translate">Traducir audio directamente a Inglés</option>
          </select>
        </div>

        {/* Hardware Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Aceleración</span>
          </label>
          <select
            value={params.device}
            onChange={(e) => onChange('device', e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
          >
            <option value="auto">Automático (GPU NVIDIA CUDA)</option>
            <option value="cuda">GPU NVIDIA CUDA (RTX 2080 Super)</option>
            <option value="cpu">Modo CPU Alto Rendimiento</option>
          </select>
        </div>

        {/* VAD Filter Toggle */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">
            Filtro de Silencios (VAD)
          </label>
          <div className="flex items-center gap-3 pt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={params.vad_filter}
                onChange={(e) => onChange('vad_filter', e.target.checked)}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <span className="text-xs font-bold text-gray-200">
              {params.vad_filter ? 'Activado (Filtra silencios)' : 'Desactivado (Recomendado para Canciones)'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            * Desactivado para transcribir el 100% de canciones sin recortes.
          </p>
        </div>
      </div>

      {/* Hero Action Button */}
      <div className="pt-6 border-t border-white/10 flex justify-center">
        <button
          type="button"
          onClick={onStartTranscribe}
          disabled={disabled || isProcessing}
          className="gradient-btn px-12 py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 shadow-2xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>{isProcessing ? 'Procesando Transcripción...' : '✨ Iniciar Transcripción con IA'}</span>
        </button>
      </div>
    </div>
  );
}
