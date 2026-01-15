# 🔊 Configuración de Audio - Brazos Levantados

## Archivo de audio necesario

Para que funcione el feedback de audio cuando levantas los brazos, necesitas agregar un archivo de audio en la raíz del proyecto.

### Opciones de formato

Puedes usar uno de estos formatos:

1. **MP3** (recomendado - mayor compatibilidad)
   - Nombre: `arms-up-sound.mp3`

2. **OGG** (alternativa)
   - Nombre: `arms-up-sound.ogg`

### Ubicación

Coloca el archivo en la misma carpeta que `index.html`:

```
DesarrolladorVR.github.io/
├── index.html
├── script.js
├── media.css
├── arms-up-sound.mp3  ← AQUÍ
└── ...
```

### Funcionamiento

- **Detección**: Cuando ambas muñecas están por encima de los hombros
- **Oneshot**: El sonido se reproduce UNA vez por cada levantamiento
- **Reset**: Al bajar los brazos, se resetea para permitir nueva detección

### Recomendaciones de audio

- Duración: 0.5 - 2 segundos
- Formato: MP3 (44.1kHz, estéreo)
- Volumen: Normalizado (no muy fuerte)
- Ejemplos: "ding", "success", "chime", "notification"

### Sonidos gratuitos sugeridos

Puedes descargar sonidos gratuitos de:
- [Freesound.org](https://freesound.org)
- [Zapsplat.com](https://www.zapsplat.com)
- [Mixkit.co](https://mixkit.co/free-sound-effects/)

### Si no tienes audio

Si no colocas el archivo, la aplicación seguirá funcionando normalmente pero sin sonido.
La consola mostrará: "No se pudo reproducir el audio"
