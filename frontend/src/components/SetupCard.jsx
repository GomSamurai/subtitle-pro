import React from 'react';
import { UploadCloud, X, Music, Film, CheckCircle2, Sliders, Cpu, Zap, Settings2 } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';

export default function SetupCard({
  selectedFile,
  onFileSelect,
  onFileRemove,
  systemStatus,
  params,
  onChange,
  onStartTranscribe,
  isProcessing
}) {
  const fileInputRef = React.useRef(null);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideo = selectedFile && (selectedFile.type.startsWith('video/') || /\.(mp4|mkv|mov|avi|webm|flv)$/i.test(selectedFile.name));

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
    <div className="w-full glass-panel glass-panel-glow p-8 mb-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && e.target.files[0] && onFileSelect(e.target.files[0])}
        accept="video/*,audio/*,.mp4,.mkv,.mov,.avi,.webm,.mp3,.wav,.m4a,.flac,.ogg,.wma"
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* LEFT COLUMN: File Drop Zone & Details (5/12 width) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>1. Archivo de Vídeo o Audio</span>
            </h3>

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    onFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className="w-full h-56 glass-panel border-2 border-dashed border-white/15 hover:border-indigo-400/50 hover:bg-white/[0.02] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group rounded-2xl"
              >
                <div className="w-16 h-16 mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-gray-100 mb-1">Cargar Vídeo o Canción</h4>
                <p className="text-xs text-gray-400">Arrastra aquí o haz clic para buscar</p>
                <span className="mt-3 text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  MP4, MKV, MOV, MP3, WAV, FLAC...
                </span>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    isVideo ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {isVideo ? <Film className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-extrabold text-gray-100 truncate">{selectedFile.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-gray-300">{formatFileSize(selectedFile.size)}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Listo
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={onFileRemove}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition shrink-0"
                  title="Cambiar archivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Modo de Subtítulos:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('youtube')}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <YoutubeIcon className="w-3.5 h-3.5 text-rose-400" />
                <span>YouTube Standard</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('music')}
                className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>🎵 Canciones</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Configuration Grid & Transcribe Button (7/12 width) */}
        <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-8 pt-6 lg:pt-0 space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <span>2. Configuración de IA</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Whisper Model */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Modelo IA (Whisper)</label>
                <select
                  value={params.model}
                  onChange={(e) => onChange('model', e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.accuracy}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Idioma del Audio</label>
                <select
                  value={params.language}
                  onChange={(e) => onChange('language', e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Chars per Line */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                  <YoutubeIcon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Máx. Caracteres por Línea</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="20"
                    max="80"
                    value={params.max_chars}
                    onChange={(e) => onChange('max_chars', parseInt(e.target.value) || 42)}
                    className="w-20 bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-gray-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-gray-400 font-mono">(Estándar YouTube: 42)</span>
                </div>
              </div>

              {/* VAD Silence Filter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Filtro VAD de Silencios</label>
                <div className="flex items-center gap-2 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={params.vad_filter}
                      onChange={(e) => onChange('vad_filter', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-200">
                    {params.vad_filter ? 'Activado' : 'Desactivado (Para Canciones)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Transcribe Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartTranscribe}
              disabled={!selectedFile || isProcessing}
              className="gradient-btn px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 w-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{isProcessing ? 'Procesando Transcripción...' : '✨ Iniciar Transcripción con IA'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
