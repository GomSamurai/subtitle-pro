import React, { useState, useRef } from 'react';
import { UploadCloud, X, Music, Film, CheckCircle2 } from 'lucide-react';

export default function FileUploader({ selectedFile, onFileSelect, onFileRemove }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideo = selectedFile && (selectedFile.type.startsWith('video/') || /\.(mp4|mkv|mov|avi|webm|flv)$/i.test(selectedFile.name));

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*,audio/*,.mp4,.mkv,.mov,.avi,.webm,.mp3,.wav,.m4a,.flac,.ogg,.wma"
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full glass-panel p-10 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-white/15 hover:border-indigo-400/50 hover:bg-white/[0.02]'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>

          <h3 className="text-xl font-bold text-gray-100 mb-2">
            Arrastra tu archivo de Vídeo o Audio aquí
          </h3>
          <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
            Compatible con canciones (WAV, MP3, FLAC), podcasts y vídeos (MP4, MKV, MOV). Procesamiento privado e ilimitado en tu equipo.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 shadow-md">
            <span>Haz clic para explorar tus archivos localmente</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-5 flex items-center justify-between gap-4 border-indigo-500/40 bg-indigo-500/5 shadow-xl">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isVideo ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {isVideo ? <Film className="w-7 h-7" /> : <Music className="w-7 h-7" />}
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-gray-100 truncate">{selectedFile.name}</h4>
                <span className="shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-white/10 text-gray-200">
                  {isVideo ? 'Vídeo' : 'Audio / Canción'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>Tamaño: <strong className="text-gray-200 font-mono">{formatFileSize(selectedFile.size)}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Listo para transcribir
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onFileRemove}
            className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all shrink-0"
            title="Cambiar archivo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
