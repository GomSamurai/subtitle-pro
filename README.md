# 🎬 SubtitlePro AI — Transcriptor & Generador de Subtítulos Local y Privado

**SubtitlePro AI** es una aplicación completa, privada y 100% local diseñada para transcribir cualquier archivo de **video** o **audio** a texto con marcas de tiempo ultra-precisas, optimizada especialmente para crear **subtítulos de YouTube**, videos promocionales, Reels, cursos o artículos.

---

## ⚡ Características Principales

1. **100% Local y Privado**: Procesamiento completo en tu equipo sin enviar datos ni audios a servidores externos o APIs de terceros.
2. **Aceleración por GPU (NVIDIA CUDA)**: Utiliza la potencia de tu tarjeta gráfica (p. ej. RTX 2080 Super) mediante `faster-whisper` con precisión FP16 o procesador CPU de alto rendimiento.
3. **Formatos de Subtítulos y Transcripción para YouTube**:
   - **.SRT (SubRip)**: Formato universal listo para subir a YouTube Studio, Premiere Pro, DaVinci Resolve y VLC.
   - **.VTT (WebVTT)**: Estándar para reproductores de páginas web HTML5 (`<track src="...">`).
   - **.TXT con marcas de tiempo `[00:05]`**: Ideal para pegar en la descripción de YouTube o crear capítulos de video.
   - **.TXT Limpio**: Transcripción continua sin tiempos para lectura, blogs o resúmenes.
   - **.JSON**: Datos detallados con marcas de tiempo palabra por palabra.
   - **.CSV**: Formato tabular para Microsoft Excel o Google Sheets.
4. **Editor de Subtítulos Interactivo**:
   - **Reproductor de video sincronizado**: Al reproducir el video, el subtítulo activo se muestra flotante estilo YouTube. Al hacer clic en cualquier bloque de subtítulo, el video salta a ese segundo exacto.
   - **Ajuste y desplazamiento de tiempo (Time Shift)**: Retrasa o adelanta todos los subtítulos por +/- segundos con 1 solo clic.
   - **Búsqueda y Reemplazo**: Corrige palabras o nombres propios en todo el archivo al instante.
   - **Unir y Dividir bloques**: Combina 2 frases o divide bloques por la mitad en 1 clic.
   - **Límite de caracteres de YouTube (42 caracteres/línea)**: Advierte si un bloque es demasiado largo para garantizar legibilidad en pantalla.
5. **Ajustes Flexibles de IA**:
   - Modelos Whisper: `tiny`, `base`, `small` (recomendado), `medium`, `large-v3`.
   - Idioma: Detección automática o selección entre +99 idiomas (Español, Inglés, Francés, Alemán, etc.).
   - Modos: Transcribir idioma original o Traducir directamente a Inglés.
   - Filtro VAD de silencios y ruido ambiente.

---

## 🚀 Cómo Iniciar la Aplicación

Simplemente haz doble clic en el archivo:
```cmd
iniciar_subtitle_pro.bat
```

Se abrirá la consola con el servidor local y tu navegador se abrirá automáticamente en:
👉 **`http://localhost:8000`**

---

## 📁 Estructura del Proyecto

```
subtitle-pro/
├── backend/
│   ├── app.py              # Servidor principal FastAPI y rutas de exportación
│   ├── transcriber.py      # Motor de transcripción IA Faster-Whisper con GPU CUDA
│   ├── formatter.py        # Generador y formateador de .srt, .vtt, .txt, .json, .csv
│   └── uploads/            # Carpeta temporal local de archivos
├── frontend/               # Interfaz web React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/     # Componentes de Editor, Reproductor, Formatos y Carga
│   │   ├── App.jsx
│   │   └── index.css
│   └── dist/               # Build compilado de producción de la app
├── venv/                   # Entorno virtual de Python aislado
└── iniciar_subtitle_pro.bat # Lanzador directo en Windows
```

---

¡Disfruta creando tus subtítulos en local con máxima velocidad y privacidad total! 🚀
