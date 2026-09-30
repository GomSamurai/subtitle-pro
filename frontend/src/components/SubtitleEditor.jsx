import React, { useState, useRef } from 'react';
import {
  Edit3, Search, Replace, Plus, Trash2, Combine, Split,
  Play, Clock, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Zap
} from 'lucide-react';

export default function SubtitleEditor({
  segments,
  activeId,
  onSegmentUpdate,
  onSegmentDelete,
  onSegmentAdd,
  onSegmentMerge,
  onSegmentSplitAtCursor,
  onSeekTo,
  onTimeShift,
  onReformat,
  maxChars = 42
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [shiftAmount, setShiftAmount] = useState('0.5');

  // Track active textarea cursor positions per segment index
  const cursorPositionsRef = useRef({});

  const formatSeconds = (sec) => {
    if (isNaN(sec) || sec < 0) return '00:00.00';
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    const mStr = mins.toString().padStart(2, '0');
    const sStr = secs.padStart(5, '0');
    return `${mStr}:${sStr}`;
  };

  const handleSearchReplace = () => {
    if (!searchTerm.trim()) return;
    const regex = new RegExp(searchTerm, 'gi');
    segments.forEach((seg, idx) => {
      if (regex.test(seg.text)) {
        const newText = seg.text.replace(regex, replaceTerm);
        onSegmentUpdate(idx, 'text', newText);
      }
    });
  };

  const handleApplyShift = (direction) => {
    const val = parseFloat(shiftAmount) * (direction === 'minus' ? -1 : 1);
    if (!isNaN(val)) {
      onTimeShift(val);
    }
  };

  const handleCursorSplit = (idx) => {
    const cursorOffset = cursorPositionsRef.current[idx] ?? null;
    onSegmentSplitAtCursor(idx, cursorOffset);
  };

  return (
    <div className="w-full glass-panel p-5 flex flex-col h-full shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-100">
              Editor de Subtítulos <span className="text-xs text-indigo-300 font-mono font-semibold">({segments.length} bloques)</span>
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reformat to max_chars button */}
          {onReformat && (
            <button
              onClick={() => onReformat(maxChars)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              title="Ajustar y cortar automáticamente todas las frases que superen los 42 caracteres"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>Auto-Cortar ({maxChars} chars)</span>
            </button>
          )}

          {/* Toggle Search & Replace */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              showSearch
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar / Reemplazar</span>
            {showSearch ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Time Shift Control */}
          <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-xl border border-white/10 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-300 font-semibold">Desplazar:</span>
            <button
              onClick={() => handleApplyShift('minus')}
              className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold font-mono transition"
              title="Adelantar subtítulos"
            >
              -{shiftAmount}s
            </button>
            <button
              onClick={() => handleApplyShift('plus')}
              className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold font-mono transition"
              title="Retrasar subtítulos"
            >
              +{shiftAmount}s
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Search & Replace Bar */}
      {showSearch && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-inner">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar término..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <Replace className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Reemplazar por..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleSearchReplace}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reemplazar Coincidencias</span>
          </button>
        </div>
      )}

      {/* Subtitles Scrollable Cards List with 20px Separation Gap */}
      <div className="space-y-6 overflow-y-auto pr-2 flex-1 max-h-[580px]">
        {segments.map((seg, idx) => {
          const isActive = seg.id === activeId;
          const charLen = seg.text.length;
          const isWarning = charLen > maxChars;

          return (
            <div
              key={seg.id || idx}
              className={`rounded-2xl border transition-all overflow-hidden shadow-xl ${
                isActive
                  ? 'bg-[#0f172a] border-indigo-500 border-l-4 border-l-indigo-400 shadow-indigo-500/20 ring-1 ring-indigo-500/30'
                  : 'bg-[#0b1220] border-white/15 border-l-4 border-l-slate-600 hover:border-white/25'
              }`}
            >
              {/* Internal Header Strip */}
              <div className="bg-slate-950/80 px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-extrabold border border-indigo-500/30">
                    Bloque #{idx + 1}
                  </span>
                  <button
                    onClick={() => onSeekTo(seg.start)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                    <span>Ir a {formatSeconds(seg.start)}</span>
                  </button>
                </div>

                {/* Timestamps inputs */}
                <div className="flex items-center gap-2 text-xs">
                  {/* Start time */}
                  <div className="flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded-xl border border-white/15 font-mono">
                    <span className="text-gray-400 text-[10px] font-semibold">Inicio:</span>
                    <button
                      onClick={() => onSegmentUpdate(idx, 'start', Math.max(0, seg.start - 0.1))}
                      className="px-1 text-gray-400 hover:text-white font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={seg.start}
                      onChange={(e) => onSegmentUpdate(idx, 'start', parseFloat(e.target.value) || 0)}
                      className="w-14 bg-transparent text-center text-cyan-300 font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => onSegmentUpdate(idx, 'start', seg.start + 0.1)}
                      className="px-1 text-gray-400 hover:text-white font-bold"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-gray-500 font-bold">→</span>

                  {/* End time */}
                  <div className="flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded-xl border border-white/15 font-mono">
                    <span className="text-gray-400 text-[10px] font-semibold">Fin:</span>
                    <button
                      onClick={() => onSegmentUpdate(idx, 'end', Math.max(seg.start, seg.end - 0.1))}
                      className="px-1 text-gray-400 hover:text-white font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={seg.end}
                      onChange={(e) => onSegmentUpdate(idx, 'end', parseFloat(e.target.value) || seg.start)}
                      className="w-14 bg-transparent text-center text-cyan-300 font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => onSegmentUpdate(idx, 'end', seg.end + 0.1)}
                      className="px-1 text-gray-400 hover:text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body - Textarea */}
              <div className="p-3.5">
                <textarea
                  rows="2"
                  value={seg.text}
                  onChange={(e) => {
                    cursorPositionsRef.current[idx] = e.target.selectionStart;
                    onSegmentUpdate(idx, 'text', e.target.value);
                  }}
                  onClick={(e) => {
                    cursorPositionsRef.current[idx] = e.target.selectionStart;
                  }}
                  onKeyUp={(e) => {
                    cursorPositionsRef.current[idx] = e.target.selectionStart;
                  }}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      e.preventDefault();
                      cursorPositionsRef.current[idx] = e.target.selectionStart;
                      handleCursorSplit(idx);
                    }
                  }}
                  className={`w-full bg-black/60 border rounded-xl p-3 text-sm text-gray-100 font-medium focus:outline-none transition leading-relaxed ${
                    isWarning
                      ? 'border-amber-500/60 focus:border-amber-500 ring-1 ring-amber-500/20'
                      : 'border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                  }`}
                />
              </div>

              {/* Internal Footer Strip */}
              <div className="bg-slate-950/90 px-4 py-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                {/* Character Counter Pill */}
                <span className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold flex items-center gap-1.5 ${
                  isWarning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {charLen} / {maxChars} chars
                  {isWarning && ' (Excede YouTube)'}
                </span>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2">
                  {idx < segments.length - 1 && (
                    <button
                      onClick={() => onSegmentMerge(idx)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Unir con el siguiente bloque"
                    >
                      <Combine className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Unir</span>
                    </button>
                  )}

                  {/* Split at Cursor Button */}
                  <button
                    onClick={() => handleCursorSplit(idx)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm"
                    title="Dividir el bloque exactamente donde tienes el cursor en el texto (o pulsa Ctrl+Enter)"
                  >
                    <Split className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dividir por Cursor</span>
                  </button>

                  <button
                    onClick={() => onSegmentDelete(idx)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Eliminar subtítulo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Block Button */}
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
        <button
          onClick={onSegmentAdd}
          className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-gray-200 flex items-center gap-2 transition shadow-md"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Añadir Nuevo Bloque de Subtítulo</span>
        </button>
      </div>
    </div>
  );
}
