import re
import json

def format_timestamp_srt(seconds: float) -> str:
    """Format seconds into SRT timestamp format: HH:MM:SS,mmm"""
    if seconds < 0:
        seconds = 0.0
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        millis = 999
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def format_timestamp_vtt(seconds: float) -> str:
    """Format seconds into WebVTT timestamp format: HH:MM:SS.mmm"""
    if seconds < 0:
        seconds = 0.0
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        millis = 999
    return f"{hrs:02d}:{mins:02d}:{secs:02d}.{millis:03d}"

def format_timestamp_human(seconds: float) -> str:
    """Format seconds into human readable timestamp format: MM:SS or HH:MM:SS"""
    if seconds < 0:
        seconds = 0.0
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hrs > 0:
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"

def build_srt(segments: list) -> str:
    """
    Generate SRT string from subtitle segments list.
    Each segment should be dict with:
    {'id': int, 'start': float, 'end': float, 'text': str}
    """
    srt_lines = []
    for idx, seg in enumerate(segments, 1):
        start_str = format_timestamp_srt(seg['start'])
        end_str = format_timestamp_srt(seg['end'])
        text = seg['text'].strip()
        srt_lines.append(f"{idx}\n{start_str} --> {end_str}\n{text}\n")
    return "\n".join(srt_lines)

def build_vtt(segments: list) -> str:
    """
    Generate WebVTT string from subtitle segments list.
    """
    vtt_lines = ["WEBVTT", ""]
    for idx, seg in enumerate(segments, 1):
        start_str = format_timestamp_vtt(seg['start'])
        end_str = format_timestamp_vtt(seg['end'])
        text = seg['text'].strip()
        vtt_lines.append(f"{idx}\n{start_str} --> {end_str}\n{text}\n")
    return "\n".join(vtt_lines)

def build_txt_plain(segments: list) -> str:
    """
    Generate clean continuous plain text without timestamps (ideal for readouts/articles).
    """
    return "\n\n".join(seg['text'].strip() for seg in segments if seg['text'].strip())

def build_txt_timestamped(segments: list) -> str:
    """
    Generate text with readable timestamps for YouTube description / chapters / transcripts.
    Example:
    [00:05] Hello and welcome to this video.
    [01:20] Today we will discuss subtitles.
    """
    lines = []
    for seg in segments:
        ts = format_timestamp_human(seg['start'])
        text = seg['text'].strip()
        if text:
            lines.append(f"[{ts}] {text}")
    return "\n".join(lines)

def build_json(segments: list, metadata: dict = None) -> str:
    """
    Generate JSON export string containing full metadata and segments.
    """
    data = {
        "metadata": metadata or {},
        "segments": segments
    }
    return json.dumps(data, indent=2, ensure_ascii=False)

def build_csv(segments: list) -> str:
    """
    Generate CSV file output for spreadsheets or external tools.
    """
    lines = ["Index,Start,End,Text"]
    for idx, seg in enumerate(segments, 1):
        start_str = format_timestamp_srt(seg['start'])
        end_str = format_timestamp_srt(seg['end'])
        # Escape quotes in CSV
        text_escaped = seg['text'].strip().replace('"', '""')
        lines.append(f'{idx},"{start_str}","{end_str}","{text_escaped}"')
    return "\n".join(lines)

def parse_srt(srt_content: str) -> list:
    """
    Parse an SRT formatted string back into segments list.
    """
    segments = []
    pattern = re.compile(r'(\d+)\s*\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n([\s\S]*?)(?=\n\d+\s*\n|\Z)', re.MULTILINE)
    
    def parse_ts(ts_str: str) -> float:
        ts_str = ts_str.replace(',', '.')
        parts = ts_str.split(':')
        hrs = int(parts[0])
        mins = int(parts[1])
        secs = float(parts[2])
        return hrs * 3600 + mins * 60 + secs

    matches = pattern.findall(srt_content)
    for idx, (index_str, start_str, end_str, text_str) in enumerate(matches, 1):
        segments.append({
            "id": idx,
            "start": parse_ts(start_str),
            "end": parse_ts(end_str),
            "text": text_str.strip()
        })
    return segments

def split_long_segments(segments: list, max_chars: int = 42, max_lines: int = 2) -> list:
    """
    Splits segments if their text length exceeds max_chars * max_lines,
    attempting to distribute words evenly while estimating timestamps proportional to word lengths.
    """
    if not max_chars or max_chars <= 0:
        return segments

    new_segments = []
    seg_counter = 1

    for seg in segments:
        words = seg.get('words', [])
        raw_text = seg['text'].strip()
        
        # If segment has detailed word timestamps, split based on exact word times!
        if words and len(words) > 0:
            current_words = []
            current_len = 0
            
            for w in words:
                w_text = w.get('word', '').strip()
                w_start = w.get('start', seg['start'])
                w_end = w.get('end', seg['end'])
                
                if current_words and (current_len + len(w_text) + 1 > max_chars * max_lines):
                    # Flush current line as a segment
                    text = " ".join(item['word'].strip() for item in current_words)
                    new_segments.append({
                        "id": seg_counter,
                        "start": current_words[0]['start'],
                        "end": current_words[-1]['end'],
                        "text": text,
                        "words": current_words
                    })
                    seg_counter += 1
                    current_words = [w]
                    current_len = len(w_text)
                else:
                    current_words.append(w)
                    current_len += len(w_text) + 1
            
            if current_words:
                text = " ".join(item['word'].strip() for item in current_words)
                new_segments.append({
                    "id": seg_counter,
                    "start": current_words[0]['start'],
                    "end": current_words[-1]['end'],
                    "text": text,
                    "words": current_words
                })
                seg_counter += 1
        else:
            # Fallback when word-level timestamps aren't available
            if len(raw_text) <= max_chars * max_lines:
                new_segments.append({
                    "id": seg_counter,
                    "start": seg['start'],
                    "end": seg['end'],
                    "text": raw_text
                })
                seg_counter += 1
            else:
                words_list = raw_text.split()
                total_duration = seg['end'] - seg['start']
                total_chars = max(1, len(raw_text))
                
                chunk_words = []
                chunk_len = 0
                chunk_start = seg['start']
                
                for w in words_list:
                    if chunk_words and (chunk_len + len(w) + 1 > max_chars * max_lines):
                        chunk_text = " ".join(chunk_words)
                        ratio = len(chunk_text) / total_chars
                        chunk_duration = total_duration * ratio
                        chunk_end = chunk_start + chunk_duration
                        
                        new_segments.append({
                            "id": seg_counter,
                            "start": round(chunk_start, 3),
                            "end": round(chunk_end, 3),
                            "text": chunk_text
                        })
                        seg_counter += 1
                        chunk_words = [w]
                        chunk_start = chunk_end
                        chunk_len = len(w)
                    else:
                        chunk_words.append(w)
                        chunk_len += len(w) + 1
                        
                if chunk_words:
                    chunk_text = " ".join(chunk_words)
                    new_segments.append({
                        "id": seg_counter,
                        "start": round(chunk_start, 3),
                        "end": round(seg['end'], 3),
                        "text": chunk_text
                    })
                    seg_counter += 1

    return new_segments
