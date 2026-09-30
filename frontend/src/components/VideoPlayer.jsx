import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock, Film } from 'lucide-react';

export default function VideoPlayer({ mediaUrl, activeSubtitle, onTimeUpdate, playerRef }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Expose seekTo capability to parent component
  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        seekTo: (seconds) => {
          if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }
      };
    }
  }, [playerRef]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      if (onTimeUpdate) {
        onTimeUpdate(cur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full glass-panel p-5 mb-6 relative overflow-hidden flex flex-col shadow-2xl">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <Film className="w-4 h-4 text-indigo-400" />
        <h4 className="text-sm font-extrabold text-gray-100">Vista Previa & Reproductor Sincronizado</h4>
      </div>

      {/* Video Frame */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 group">
        <video
          ref={videoRef}
          src={mediaUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain"
        />

        {/* Live Subtitle Overlay */}
        {activeSubtitle && (
          <div className="subtitle-overlay-box animate-fadeIn">
            {activeSubtitle.text}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-gray-300 w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono font-bold text-gray-400 w-12">{formatTime(duration)}</span>
        </div>

        {/* Action Buttons & Speed Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center shadow-lg shadow-indigo-600/30"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Speed Selector Pills */}
          <div className="flex items-center gap-1 bg-black/50 p-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-[11px] font-bold text-gray-400 px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Vel:
            </span>
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
