import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Code, FileSpreadsheet, Sparkles } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';

export default function ExportModal({ segments, filename, metadata }) {
  const [copiedFormat, setCopiedFormat] = useState(null);

  const handleDownload = async (format) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          segments,
          filename: filename || 'subtitulos',
          metadata
        })
      });

      if (!response.ok) throw new Error('Error al generar el archivo');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const extMap = {
        srt: '.srt',
        vtt: '.vtt',
        txt_plain: '_transcripcion.txt',
        txt_timestamped: '_subtitulos_youtube.txt',
        json: '.json',
        csv: '.csv'
      };

      const baseName = (filename || 'subtitulos').replace(/\.[^/.]+$/, "");
      a.download = `${baseName}${extMap[format] || '.srt'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al descargar archivo: " + err.message);
    }
  };

  const handleCopyClipboard = async (type) => {
    try {
      let textToCopy = "";
      if (type === 'plain') {
        textToCopy = segments.map(s => s.text.trim ? s.text.trim() : s.text).join('\n\n');
      } else if (type === 'srt') {
        textToCopy = segments.map((s, idx) => {
          const formatTs = (sec) => {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const sSec = Math.floor(sec % 60);
            const ms = Math.round((sec - Math.floor(sec)) * 1000);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sSec.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
          };
          return `${idx + 1}\n${formatTs(s.start)} --> ${formatTs(s.end)}\n${s.text}\n`;
        }).join('\n');
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopiedFormat(type);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch (e) {
      alert("No se pudo copiar al portapapeles");
    }
  };

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-100">Exportar y Descargar</h3>
            <p className="text-[11px] text-gray-400">Formatos listos para publicar</p>
          </div>
        </div>
      </div>

      {/* Copy Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleCopyClipboard('plain')}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-white/10"
        >
          {copiedFormat === 'plain' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
          <span>{copiedFormat === 'plain' ? '¡Copiado!' : 'Copiar Texto'}</span>
        </button>

        <button
          onClick={() => handleCopyClipboard('srt')}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-white/10"
        >
          {copiedFormat === 'srt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-rose-400" />}
          <span>{copiedFormat === 'srt' ? '¡SRT Copiado!' : 'Copiar SRT'}</span>
        </button>
      </div>

      {/* Vertical Stack of Download Cards */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
        {/* SRT YouTube (Featured) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 hover:border-rose-500/70 transition flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <YoutubeIcon className="w-4 h-4" /> SubRip (.SRT)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                YouTube / Premiere
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              Subtítulos universales para YouTube Studio, Premiere y DaVinci.
            </p>
          </div>
          <button
            onClick={() => handleDownload('srt')}
            className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .SRT</span>
          </button>
        </div>

        {/* WebVTT */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-500/60 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> WebVTT (.VTT)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">Web</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">Estándar para reproductores web HTML5.</p>
          </div>
          <button
            onClick={() => handleDownload('vtt')}
            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .VTT</span>
          </button>
        </div>

        {/* TXT YouTube Description */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500/60 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> TXT con Marcas [00:05]
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">Descripción</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">Ideal para pegar en la descripción de YouTube.</p>
          </div>
          <button
            onClick={() => handleDownload('txt_timestamped')}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar TXT YouTube</span>
          </button>
        </div>

        {/* TXT Plain */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-gray-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Transcripción Texto Limpio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono font-bold">Lectura</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">Texto continuo sin marcas de tiempo.</p>
          </div>
          <button
            onClick={() => handleDownload('txt_plain')}
            className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Texto (.TXT)</span>
          </button>
        </div>

        {/* JSON */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> JSON (.JSON)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">Timestamps</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">Datos palabra por palabra en JSON.</p>
          </div>
          <button
            onClick={() => handleDownload('json')}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .JSON</span>
          </button>
        </div>

        {/* CSV */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV (.CSV)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">Excel</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">Formato tabular para Excel o Sheets.</p>
          </div>
          <button
            onClick={() => handleDownload('csv')}
            className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
