# 📁 Estructura del Proyecto - ISTEduca

## Jerarquía de Carpetas

```
DesarrolladorVR.github.io/
│
├── 📄 index.html                 # Punto de entrada (redirige a src/html/index.html)
├── 📄 README.md                  # Documentación principal
│
├── 📁 src/                       # Código fuente de la aplicación
│   ├── html/
│   │   └── index.html            # Aplicación principal
│   ├── js/
│   │   └── script.js             # Lógica principal (MediaPipe, detección de poses, etc.)
│   └── css/
│       └── media.css             # Estilos de la aplicación
│
├── 📁 assets/                    # Recursos multimedia
│   ├── images/
│   │   ├── ist.png               # Logo ISTEduca
│   │   └── ist.ico               # Favicon
│   └── audio/
│       └── arms-up-sound.wav     # Efectos de sonido generales
│
├── 📁 voiceoff/                  # Audios de guion y voz (mantenido en raíz)
│   ├── intro.wav
│   ├── postura_1.wav
│   ├── postura_2.wav
│   ├── respiracion.wav
│   ├── conexion.wav
│   ├── sonrisa.wav
│   ├── cierre.wav
│   └── campana.wav
│
├── 📁 docs/                      # Documentación del proyecto
│   ├── AUDIO_SETUP.md            # Configuración de audio
│   ├── CAMBIOS_COMMIT.md         # Cambios comprometidos
│   ├── CAMBIOS_IMPLEMENTADOS_CAMARA.md
│   ├── ENTRENADOR_LEVANTAMIENTO.md
│   ├── GUIA_ESTUDIANTE.md
│   ├── GUIA_IMPLEMENTACION.md
│   ├── RESUMEN_EJECUTIVO.md
│   ├── SOLUCION_CAMARA_RISE360.md
│   ├── SOLUCIONES_RISE.md
│   └── readme.txt
│
├── 📁 backup/                    # Versiones anteriores de archivos
│   ├── script-backup-before-experiencemanager-fix.js
│   ├── script - copia.js
│   ├── media - copia.css
│   └── index - copia.html
│
├── 📁 .git/                      # Control de versiones Git
├── 📄 _headers                   # Configuración de headers (Netlify/servidor)
└── 📄 PROJECT_STRUCTURE.md       # Este archivo
```

## 📋 Descripción de Carpetas

### `/src` - Código Fuente
Contiene todo el código de la aplicación:
- **html/**: Estructura HTML de la interfaz
- **js/**: Lógica de negocio (MediaPipe, detección de poses, gestor de experiencia)
- **css/**: Estilos visuales y tema

### `/assets` - Recursos
Archivos multimedia utilizados por la aplicación:
- **images/**: Logo e iconos
- **audio/**: Sonidos del sistema

### `/voiceoff` - Audios de Guion
Archivos de audio con las instrucciones de voz guiada (se mantiene en raíz por compatibilidad)

### `/docs` - Documentación
Guías, manuales y notas técnicas sobre el proyecto

### `/backup` - Respaldos
Versiones anteriores y copias de seguridad de archivos

## 🔗 Referencias de Rutas

Cuando trabajas con archivos, recuerda:

| Ubicación | Ruta Relativa |
|-----------|---------------|
| Desde `src/html/index.html` a CSS | `../../src/css/media.css` |
| Desde `src/html/index.html` a imágenes | `../../assets/images/ist.png` |
| Desde `src/html/index.html` a audios voiceoff | `../../voiceoff/intro.wav` |
| Desde `src/js/script.js` a audios voiceoff | `../../voiceoff/intro.wav` |

## 📝 Ventajas de Esta Estructura

✅ **Organización clara**: Cada tipo de archivo tiene su lugar
✅ **Escalabilidad**: Fácil agregar nuevos módulos JS o estilos CSS
✅ **Mantenibilidad**: Código y recursos separados
✅ **Documentación centralizada**: Guías en `/docs`
✅ **Respaldos organizados**: Copias antiguas en `/backup`
✅ **Compatibilidad**: Rutas correctas para servidores web

## 🔄 Cómo Agregar Nuevos Archivos

- **Script nuevo**: `src/js/nombre.js`
- **Estilos nuevos**: `src/css/nombre.css`
- **Página HTML**: `src/html/nombre.html`
- **Imagen**: `assets/images/nombre.png`
- **Audio**: `assets/audio/nombre.wav` (o `voiceoff/` si es guion de voz)

---

**Última actualización**: 2026-01-15
