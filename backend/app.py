import os
import uuid
import shutil
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from transcriber import check_cuda_availability, get_device_and_compute_type, transcribe_media
from formatter import (
    build_srt, build_vtt, build_txt_plain, build_txt_timestamped,
    build_json, build_csv, split_long_segments, parse_srt
)

app = FastAPI(
    title="SubtitlePro API",
    description="Local & Private AI Subtitle Generator & Editor",
    version="1.0.0"
)

# Enable CORS for local dev server (React Vite runs on 5173, backend on 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Frontend dist directory path
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

# In-memory store for active job status / media paths
JOBS = {}

@app.get("/api/status")
def get_system_status():
    """Returns GPU / CPU capability and system information."""
    has_cuda = check_cuda_availability()
    gpu_name = None
    if has_cuda:
        try:
            import torch
            gpu_name = torch.cuda.get_device_name(0)
        except Exception:
            gpu_name = "NVIDIA CUDA GPU"
    
    device, compute_type = get_device_and_compute_type("auto")
    
    return {
        "status": "online",
        "cuda_available": has_cuda,
        "gpu_name": gpu_name or ("CPU High Performance" if not has_cuda else "NVIDIA GPU"),
        "recommended_device": device,
        "compute_type": compute_type,
        "available_models": [
            {"id": "tiny", "name": "Tiny (~39M)", "speed": "Ultra Rápido", "accuracy": "Básica", "vram": "~1 GB"},
            {"id": "base", "name": "Base (~74M)", "speed": "Muy Rápido", "accuracy": "Buena", "vram": "~1 GB"},
            {"id": "small", "name": "Small (~244M)", "speed": "Rápido (Recomendado)", "accuracy": "Alta", "vram": "~2 GB"},
            {"id": "medium", "name": "Medium (~769M)", "speed": "Moderado", "accuracy": "Muy Alta", "vram": "~5 GB"},
            {"id": "large-v3", "name": "Large-v3 (~1.5B)", "speed": "Precisión Máxima", "accuracy": "Excelente", "vram": "~8 GB"}
        ],
        "languages": [
            {"code": "auto", "name": "🌐 Detección Automática"},
            {"code": "es", "name": "Español"},
            {"code": "en", "name": "Inglés (English)"},
            {"code": "fr", "name": "Francés (Français)"},
            {"code": "de", "name": "Alemán (Deutsch)"},
            {"code": "it", "name": "Italiano"},
            {"code": "pt", "name": "Portugués (Português)"},
            {"code": "ca", "name": "Catalán (Català)"},
            {"code": "gl", "name": "Gallego (Galego)"},
            {"code": "eu", "name": "Vasco / Euskera"},
            {"code": "ja", "name": "Japonés (日本語)"},
            {"code": "zh", "name": "Chino (中文)"},
            {"code": "ru", "name": "Ruso (Русский)"},
            {"code": "ar", "name": "Árabe (العربية)"},
            {"code": "hi", "name": "Hindi (हिन्दी)"},
            {"code": "ko", "name": "Coreano (한국어)"}
        ]
    }

@app.post("/api/transcribe")
async def transcribe_endpoint(
    file: UploadFile = File(...),
    model: str = Form("small"),
    language: str = Form("auto"),
    task: str = Form("transcribe"),
    device: str = Form("auto"),
    max_chars: int = Form(42),
    max_lines: int = Form(2),
    vad_filter: bool = Form(False)
):
    """
    Upload audio/video file and process transcription with parameters.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file submitted")

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    progress_log = []
    def update_progress(pct: int, msg: str):
        progress_log.append({"pct": pct, "msg": msg})

    # Execute transcription
    result = transcribe_media(
        media_path=saved_path,
        model_name=model,
        language=language,
        task=task,
        device=device,
        word_timestamps=True,
        vad_filter=vad_filter,
        progress_callback=update_progress
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Transcription failed"))

    raw_segments = result.get("segments", [])
    
    # Apply optional line splitting constraints (e.g. YouTube standard 42 chars per line)
    processed_segments = split_long_segments(raw_segments, max_chars=max_chars, max_lines=max_lines)

    # Pre-generate formats
    srt_text = build_srt(processed_segments)
    vtt_text = build_vtt(processed_segments)
    txt_plain = build_txt_plain(processed_segments)
    txt_timestamped = build_txt_timestamped(processed_segments)

    JOBS[file_id] = {
        "file_path": saved_path,
        "original_filename": file.filename,
        "segments": processed_segments,
        "raw_segments": raw_segments,
        "metadata": {
            "duration": result.get("duration"),
            "language": result.get("language"),
            "language_probability": result.get("language_probability"),
            "device": result.get("device"),
            "model": result.get("model"),
            "elapsed_seconds": result.get("elapsed_seconds")
        }
    }

    return {
        "file_id": file_id,
        "original_filename": file.filename,
        "media_url": f"/api/media/{file_id}",
        "metadata": JOBS[file_id]["metadata"],
        "segments": processed_segments,
        "formats": {
            "srt": srt_text,
            "vtt": vtt_text,
            "txt_plain": txt_plain,
            "txt_timestamped": txt_timestamped
        }
    }

@app.post("/api/format")
def reformat_segments(data: dict):
    """
    Re-applies character line limit splits or rules to existing segments without needing to re-transcribe audio.
    """
    segments = data.get("segments", [])
    max_chars = data.get("max_chars", 42)
    max_lines = data.get("max_lines", 2)

    new_segments = split_long_segments(segments, max_chars=max_chars, max_lines=max_lines)
    
    return {
        "segments": new_segments,
        "formats": {
            "srt": build_srt(new_segments),
            "vtt": build_vtt(new_segments),
            "txt_plain": build_txt_plain(new_segments),
            "txt_timestamped": build_txt_timestamped(new_segments)
        }
    }

@app.post("/api/export")
def export_subtitles(data: dict):
    """
    Generates downloadable content in requested format ('srt', 'vtt', 'txt_plain', 'txt_timestamped', 'json', 'csv').
    """
    fmt = data.get("format", "srt").lower()
    segments = data.get("segments", [])
    filename = data.get("filename", "subtitles")
    base_name = os.path.splitext(filename)[0]

    if fmt == "srt":
        content = build_srt(segments)
        mime = "application/x-subrip"
        ext = ".srt"
    elif fmt == "vtt":
        content = build_vtt(segments)
        mime = "text/vtt"
        ext = ".vtt"
    elif fmt == "txt_plain":
        content = build_txt_plain(segments)
        mime = "text/plain"
        ext = "_transcripcion.txt"
    elif fmt == "txt_timestamped":
        content = build_txt_timestamped(segments)
        mime = "text/plain"
        ext = "_subtitulos_youtube.txt"
    elif fmt == "json":
        content = build_json(segments, metadata=data.get("metadata"))
        mime = "application/json"
        ext = ".json"
    elif fmt == "csv":
        content = build_csv(segments)
        mime = "text/csv"
        ext = ".csv"
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

    headers = {
        "Content-Disposition": f'attachment; filename="{base_name}{ext}"'
    }
    return Response(content=content, media_type=mime, headers=headers)

@app.get("/api/media/{file_id}")
def stream_media(file_id: str):
    """
    Streams media file for HTML5 player.
    """
    if file_id not in JOBS:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    file_path = JOBS[file_id]["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File lost on server")

    return FileResponse(file_path)

# Serve built frontend static app at root
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
