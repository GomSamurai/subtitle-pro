import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SetupCard from './components/SetupCard';
import ProgressOverlay from './components/ProgressOverlay';
import VideoPlayer from './components/VideoPlayer';
import SubtitleEditor from './components/SubtitleEditor';
import ExportModal from './components/ExportModal';
import { buildApiUrl } from './apiConfig';
import { AlertCircle, ExternalLink, Laptop } from 'lucide-react';

export default function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isExternalHost, setIsExternalHost] = useState(false);
  
  const [params, setParams] = useState({
    model: 'small',
    language: 'auto',
    task: 'transcribe',
    device: 'auto',
    max_chars: 42,
    max_lines: 2,
    vad_filter: false
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  
  // Results
  const [resultData, setResultData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  const playerRef = useRef(null);

  // Check host on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        setIsExternalHost(true);
      }
    }

    fetch(buildApiUrl('/api/status'))
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch((err) => console.log('Backend status check', err));
  }, []);

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona primero un archivo de vídeo o audio.');
      return;
    }

    setIsProcessing(true);
    setProgressStep('Extrayendo pista de audio y enviando a la IA...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('model', params.model);
    formData.append('language', params.language);
    formData.append('task', params.task);
    formData.append('device', params.device);
    formData.append('max_chars', params.max_chars);
    formData.append('max_lines', params.max_lines);
    formData.append('vad_filter', params.vad_filter);

    try {
      const response = await fetch(buildApiUrl('/api/transcribe'), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || 'Error en la transcripción');
      }

      const data = await response.json();
      setResultData(data);
      setSegments(data.segments || []);
    } catch (err) {
      if (isExternalHost) {
        alert("⚠️ Para transcribir usando la IA de tu tarjeta gráfica (NVIDIA CUDA), debes abrir la aplicación directamente en http://localhost:8000 tras ejecutar iniciar_subtitle_pro.bat en tu PC.");
      } else {
        alert(`Error al procesar el archivo: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-split line limit when max_chars changes in editor
  const handleReformat = async (newMaxChars) => {
    if (!segments.length) return;
    try {
      const response = await fetch(buildApiUrl('/api/format'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments,
          max_chars: newMaxChars || params.max_chars,
          max_lines: params.max_lines
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments);
      }
    } catch (err) {
      console.error("Format error", err);
    }
  };

  // Segment operations
  const handleSegmentUpdate = (index, field, value) => {
    setSegments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSegmentDelete = (index) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSegmentAdd = () => {
    setSegments((prev) => {
      const last = prev[prev.length - 1] || { end: 0 };
      const start = last.end;
      const end = start + 3;
      return [
        ...prev,
        {
          id: prev.length + 1,
          start: round3(start),
          end: round3(end),
          text: 'Nuevo subtítulo'
        }
      ];
    });
  };

  const handleSegmentMerge = (index) => {
    if (index >= segments.length - 1) return;
    setSegments((prev) => {
      const cur = prev[index];
      const nxt = prev[index + 1];
      const merged = {
        id: cur.id,
        start: cur.start,
        end: nxt.end,
        text: `${cur.text.trim()} ${nxt.text.trim()}`
      };
      const copy = [...prev];
      copy.splice(index, 2, merged);
      return copy;
    });
  };

  // SMART CURSOR-BASED SPLIT LOGIC
  const handleSegmentSplitAtCursor = (index, cursorOffset) => {
    setSegments((prev) => {
      const seg = prev[index];
      const fullText = seg.text;
      
      let text1 = "";
      let text2 = "";

      if (cursorOffset !== null && cursorOffset > 0 && cursorOffset < fullText.length) {
        text1 = fullText.slice(0, cursorOffset).trim();
        text2 = fullText.slice(cursorOffset).trim();
      } else {
        const words = fullText.trim().split(' ');
        if (words.length < 2) return prev;
        const midIdx = Math.ceil(words.length / 2);
        text1 = words.slice(0, midIdx).join(' ');
        text2 = words.slice(midIdx).join(' ');
      }

      if (!text1 || !text2) return prev;

      const totalDuration = seg.end - seg.start;
      let splitTime = seg.start + totalDuration / 2;

      if (seg.words && seg.words.length > 0) {
        let accumText = "";
        let splitWord = null;
        for (let w of seg.words) {
          accumText += w.word;
          if (accumText.length >= text1.length) {
            splitWord = w;
            break;
          }
        }
        if (splitWord && splitWord.end > seg.start && splitWord.end < seg.end) {
          splitTime = splitWord.end;
        } else {
          const ratio = text1.length / Math.max(1, fullText.length);
          splitTime = seg.start + totalDuration * ratio;
        }
      } else {
        const ratio = text1.length / Math.max(1, fullText.length);
        splitTime = seg.start + totalDuration * ratio;
      }

      const seg1 = {
        ...seg,
        id: seg.id,
        start: round3(seg.start),
        end: round3(splitTime),
        text: text1
      };

      const seg2 = {
        ...seg,
        id: seg.id + 0.5,
        start: round3(splitTime),
        end: round3(seg.end),
        text: text2
      };

      const copy = [...prev];
      copy.splice(index, 1, seg1, seg2);
      return copy;
    });
  };

  const handleTimeShift = (seconds) => {
    setSegments((prev) =>
      prev.map((s) => ({
        ...s,
        start: Math.max(0, round3(s.start + seconds)),
        end: Math.max(0, round3(s.end + seconds))
      }))
    );
  };

  const round3 = (val) => Math.round(val * 1000) / 1000;

  const activeSubtitle = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  const activeId = activeSubtitle?.id;

  const handleSeekTo = (time) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  return (
    <div className="min-h-screen w-full px-6 py-6 flex flex-col items-center">
      {/* External Host Notice Banner */}
      {isExternalHost && (
        <div className="w-full glass-panel p-4 mb-6 border-amber-500/40 bg-amber-500/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">Modo Vercel / Servidor Externo</h4>
              <p className="text-xs text-gray-300">
                Vercel no puede ejecutar la IA en tu gráfica local. Para procesar tus archivos con tu GPU NVIDIA, abre la app directamente en tu PC en: <strong className="text-white font-mono">http://localhost:8000</strong>
              </p>
            </div>
          </div>
          <a
            href="http://localhost:8000"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition shrink-0"
          >
            <Laptop className="w-4 h-4" />
            <span>Abrir en Local (http://localhost:8000)</span>
          </a>
        </div>
      )}

      {/* 100% Full Width Header */}
      <Header systemStatus={systemStatus} />

      {/* Main Single-Page Workspace */}
      <div className="w-full space-y-8">
        {/* Integrated Setup Card */}
        <SetupCard
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onFileRemove={() => {
            setSelectedFile(null);
            setResultData(null);
            setSegments([]);
          }}
          systemStatus={systemStatus}
          params={params}
          onChange={handleParamChange}
          onStartTranscribe={handleTranscribe}
          isProcessing={isProcessing}
        />

        {/* 3-Column Studio Workspace */}
        {resultData && (
          <div className="animate-fadeIn w-full space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Video Player */}
              <div className="lg:col-span-4 sticky top-6">
                <VideoPlayer
                  mediaUrl={buildApiUrl(resultData.media_url)}
                  activeSubtitle={activeSubtitle}
                  onTimeUpdate={setCurrentTime}
                  playerRef={playerRef}
                />
              </div>

              {/* Middle Column: Subtitle Editor Studio */}
              <div className="lg:col-span-5">
                <SubtitleEditor
                  segments={segments}
                  activeId={activeId}
                  onSegmentUpdate={handleSegmentUpdate}
                  onSegmentDelete={handleSegmentDelete}
                  onSegmentAdd={handleSegmentAdd}
                  onSegmentMerge={handleSegmentMerge}
                  onSegmentSplitAtCursor={handleSegmentSplitAtCursor}
                  onSeekTo={handleSeekTo}
                  onTimeShift={handleTimeShift}
                  onReformat={handleReformat}
                  maxChars={params.max_chars}
                />
              </div>

              {/* Right Column: Export & Download Panel */}
              <div className="lg:col-span-3 sticky top-6">
                <ExportModal
                  segments={segments}
                  filename={resultData.original_filename}
                  metadata={resultData.metadata}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Loader Modal */}
      <ProgressOverlay isProcessing={isProcessing} currentStep={progressStep} />
    </div>
  );
}
