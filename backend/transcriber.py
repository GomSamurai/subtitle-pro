import os
import sys
import time
import logging
import subprocess
from typing import Dict, List, Any, Optional

# Add NVIDIA CUDA DLL paths to Windows PATH & DLL directory search path
if sys.platform == "win32":
    import site
    packages_paths = site.getsitepackages() + [os.path.dirname(os.path.dirname(os.path.abspath(__file__)))]
    for sp in packages_paths:
        nvidia_base = os.path.join(sp, "nvidia")
        if os.path.exists(nvidia_base):
            for root, dirs, files in os.walk(nvidia_base):
                if "bin" in dirs:
                    bin_dir = os.path.join(root, "bin")
                    try:
                        os.add_dll_directory(bin_dir)
                        os.environ["PATH"] = bin_dir + os.path.pathsep + os.environ.get("PATH", "")
                    except Exception:
                        pass
        # Check venv/Lib/site-packages directly
        venv_nvidia = os.path.join(os.path.dirname(sys.executable), "Lib", "site-packages", "nvidia")
        if os.path.exists(venv_nvidia):
            for root, dirs, files in os.walk(venv_nvidia):
                if "bin" in dirs:
                    bin_dir = os.path.join(root, "bin")
                    try:
                        os.add_dll_directory(bin_dir)
                        os.environ["PATH"] = bin_dir + os.path.pathsep + os.environ.get("PATH", "")
                    except Exception:
                        pass

# Monkeypatch PyAV av.open for compatibility across PyAV versions
try:
    import av
    _orig_av_open = av.open
    def _patched_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _orig_av_open(*args, **kwargs)
    av.open = _patched_av_open
except Exception:
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcriber")

# Global dict to cache loaded Whisper models to avoid re-loading on each request
_loaded_models = {}

def check_cuda_availability() -> bool:
    """Checks if CUDA GPU is available for Faster-Whisper."""
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        try:
            res = subprocess.run(["nvidia-smi"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return res.returncode == 0
        except Exception:
            return False

def get_device_and_compute_type(requested_device: str = "auto"):
    """
    Determines optimal device (cuda vs cpu) and compute_type (float16, int8, float32).
    """
    has_cuda = check_cuda_availability()
    if requested_device == "cuda" or (requested_device == "auto" and has_cuda):
        device = "cuda"
        compute_type = "float16"
    else:
        device = "cpu"
        compute_type = "int8"
    return device, compute_type

def get_whisper_model(model_name: str = "small", device: str = "auto", force_cpu: bool = False):
    """
    Loads and caches a Faster-Whisper model.
    """
    global _loaded_models
    if force_cpu:
        actual_device, compute_type = "cpu", "int8"
    else:
        actual_device, compute_type = get_device_and_compute_type(device)
        
    cache_key = f"{model_name}_{actual_device}_{compute_type}"

    if cache_key in _loaded_models:
        logger.info(f"Using cached model: {cache_key}")
        return _loaded_models[cache_key], actual_device, compute_type

    from faster_whisper import WhisperModel

    logger.info(f"Loading Faster-Whisper model '{model_name}' on {actual_device} ({compute_type})...")
    
    model_id = model_name
    if model_name == "large-v3-turbo":
        model_id = "deepdml/faster-whisper-large-v3-turbo"
    elif model_name == "large-v3":
        model_id = "large-v3"

    try:
        model = WhisperModel(model_id, device=actual_device, compute_type=compute_type)
    except Exception as e:
        logger.warning(f"Failed to load on {actual_device} ({e}), falling back to CPU int8...")
        actual_device = "cpu"
        compute_type = "int8"
        model = WhisperModel(model_name if model_name in ["tiny", "base", "small", "medium"] else "small", device=actual_device, compute_type=compute_type)

    _loaded_models[cache_key] = model
    return model, actual_device, compute_type

def extract_audio(media_path: str, output_wav: str) -> bool:
    """
    Extracts 16kHz mono WAV audio from any input video or audio file using FFmpeg.
    """
    cmd = [
        "ffmpeg", "-y", "-i", media_path,
        "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1",
        output_wav
    ]
    logger.info(f"Extracting audio: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        logger.error(f"FFmpeg error: {result.stderr.decode('utf-8', errors='ignore')}")
        return False
    return True

def run_inference(model, audio_wav, lang_arg, task, beam_size, word_timestamps, vad_filter, progress_callback):
    """Executes transcription generator loop."""
    segments_gen, info = model.transcribe(
        audio_wav,
        language=lang_arg,
        task=task,
        beam_size=beam_size,
        word_timestamps=word_timestamps,
        vad_filter=vad_filter,
        vad_parameters=dict(min_silence_duration_ms=2000, threshold=0.35) if vad_filter else None
    )

    detected_language = info.language
    language_probability = info.language_probability
    duration = info.duration

    raw_segments = list(segments_gen)
    total_segs = max(1, len(raw_segments))

    segments_list = []
    for idx, seg in enumerate(raw_segments, 1):
        if progress_callback:
            pct = 40 + int((idx / total_segs) * 55)
            progress_callback(pct, f"Transcribiendo segmento {idx}/{total_segs} ({seg.start:.1f}s)...")

        seg_dict = {
            "id": idx,
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": seg.text.strip(),
            "words": []
        }

        if word_timestamps and seg.words:
            for w in seg.words:
                seg_dict["words"].append({
                    "word": w.word,
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "probability": round(w.probability, 3)
                })

        segments_list.append(seg_dict)

    return segments_list, detected_language, language_probability, duration

def transcribe_media(
    media_path: str,
    model_name: str = "small",
    language: Optional[str] = None,
    task: str = "transcribe",
    device: str = "auto",
    word_timestamps: bool = True,
    beam_size: int = 5,
    vad_filter: bool = True,
    progress_callback = None
) -> Dict[str, Any]:
    """
    Full pipeline to extract audio and transcribe media file.
    Includes automatic CPU fallback if GPU CUDA DLLs fail at runtime.
    """
    start_time = time.time()
    audio_wav = media_path + ".temp.wav"

    try:
        if progress_callback:
            progress_callback(10, "Extrayendo pista de audio con FFmpeg...")

        if not extract_audio(media_path, audio_wav):
            audio_wav = media_path

        if progress_callback:
            progress_callback(25, f"Cargando modelo AI Whisper ({model_name})...")

        lang_arg = None if (not language or language == "auto") else language

        # Attempt GPU/requested device first
        try:
            model, actual_device, compute_type = get_whisper_model(model_name, device, force_cpu=False)
            if progress_callback:
                progress_callback(40, "Analizando audio y transcribiendo...")
            
            segments_list, detected_language, language_probability, duration = run_inference(
                model, audio_wav, lang_arg, task, beam_size, word_timestamps, vad_filter, progress_callback
            )
        except Exception as cuda_err:
            logger.warning(f"GPU execution failed ({cuda_err}), automatically switching to CPU High Performance mode...")
            if progress_callback:
                progress_callback(35, "Cambiando a modo CPU para garantizar transcripción...")

            model, actual_device, compute_type = get_whisper_model(model_name, device, force_cpu=True)
            segments_list, detected_language, language_probability, duration = run_inference(
                model, audio_wav, lang_arg, task, beam_size, word_timestamps, vad_filter, progress_callback
            )

        elapsed = round(time.time() - start_time, 2)

        if progress_callback:
            progress_callback(100, "¡Transcripción completada con éxito!")

        return {
            "success": True,
            "duration": round(duration, 2),
            "language": detected_language,
            "language_probability": round(language_probability, 3),
            "segments": segments_list,
            "device": actual_device,
            "compute_type": compute_type,
            "model": model_name,
            "elapsed_seconds": elapsed
        }

    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if os.path.exists(audio_wav) and audio_wav != media_path:
            try:
                os.remove(audio_wav)
            except Exception:
                pass
