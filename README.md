# 🎓 ISTEduca - Detección de Poses con IA

## 📦 Entrenador Virtual de Levantamiento Seguro

Sistema interactivo de entrenamiento con Inteligencia Artificial para enseñar técnicas correctas de manejo manual de carga en el sector alimentación.

![Badge](https://img.shields.io/badge/IA-MediaPipe-blue)
![Badge](https://img.shields.io/badge/Estado-Producción-success)
![Badge](https://img.shields.io/badge/Curso-Riesgos%20Laborales-purple)

---

## 🎯 Propósito

Resolver el problema de lesiones lumbares por mala postura al levantar cargas, uno de los riesgos más frecuentes y costosos en el sector alimentación, mediante un entrenador virtual con IA que proporciona feedback en tiempo real.

---

## ✨ Características Principales

### 🤖 Detección de Poses con MediaPipe
- Rastreo de 33 puntos clave del cuerpo en tiempo real
- Análisis biomecánico de la postura
- Procesamiento local (sin necesidad de servidor)

### 📊 Sistema de Validación
- **Espalda recta:** Inclinación < 30°
- **Piernas flexionadas:** Ángulo de rodillas < 140°
- **Carga cerca del cuerpo:** Distancia manos-torso < 25cm

### 💬 Feedback Inteligente
- Mensajes dinámicos según la postura
- Código de colores (verde/amarillo/naranja/rojo)
- Indicadores visuales sobre el video
- Puntuación 0-100% en tiempo real

### 🎮 Interfaz Interactiva
- Toggle para activar/desactivar entrenador
- Panel de métricas en tiempo real
- Instrucciones de seguridad integradas
- Diseño responsive y atractivo

---

## 🚀 Demo en Vivo

**GitHub Pages:** [Ver Demo](https://isteducapostura.github.io)

---

## 📖 Documentación

| Documento | Descripción | Para |
|-----------|-------------|------|
| [ENTRENADOR_LEVANTAMIENTO.md](ENTRENADOR_LEVANTAMIENTO.md) | Documentación completa del proyecto | Todos |
| [GUIA_IMPLEMENTACION.md](GUIA_IMPLEMENTACION.md) | Detalles técnicos y código | Desarrolladores |
| [GUIA_ESTUDIANTE.md](GUIA_ESTUDIANTE.md) | Tutorial paso a paso | Estudiantes |
| [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) | Overview ejecutivo | Instructores |

---

## 🎓 Contexto Educativo

### Curso
**Riesgos, Efectos en la Salud y Medidas Preventivas**  
Sector: Alimentación

### Unidad 1
Recepción y Descarga de Alimentos  
**Sección:** Técnicas correctas de manejo manual de carga

### Problema a Resolver
Las lesiones lumbares por mala postura al levantar cajas pesadas son uno de los riesgos más frecuentes y costosos en el sector alimentación.

---

## 🛠️ Tecnologías

- **MediaPipe Pose** - Detección de poses con IA
- **JavaScript ES6+** - Lógica de aplicación
- **HTML5** - Estructura
- **CSS3** - Diseño y animaciones
- **Canvas API** - Renderizado de indicadores
- **WebRTC** - Acceso a cámara

---

## 💻 Instalación y Uso

### Opción 1: GitHub Pages (Recomendada)
```
1. Visita: https://isteducapostura.github.io
2. Permite acceso a la cámara
3. Activa el entrenador virtual
4. ¡Practica tu técnica!
```

### Opción 2: Local
```bash
# Clonar repositorio
git clone https://github.com/isteducapostura/isteducapostura.github.io.git

# Navegar a la carpeta
cd isteducapostura.github.io

# Abrir con un servidor local (ejemplo con Python)
python -m http.server 8000

# O simplemente abrir index.html en el navegador
```

---

## 🎮 Cómo Usar

### 1. Activar la Cámara
- Haz clic en "Activar Cámara"
- Permite el acceso a tu webcam
- Asegúrate de tener buena iluminación
- Colócate de perfil a 1-2 metros

### 2. Activar el Entrenador
- Localiza el toggle "Activar Entrenador Virtual"
- Actívalo para ver el panel de métricas

### 3. Practicar
- Simula levantar una caja del suelo
- Observa el feedback en tiempo real
- Corrige tu postura según las indicaciones
- Intenta alcanzar 100% de score

---

## 📊 Sistema de Puntuación

| Score | Color | Nivel | Descripción |
|-------|-------|-------|-------------|
| 100% | 🟢 Verde | Perfecto | Técnica ideal |
| 66-99% | 🟡 Amarillo | Bueno | Pequeñas mejoras |
| 33-65% | 🟠 Naranja | Mejorable | Requiere práctica |
| 0-32% | 🔴 Rojo | Peligroso | Alto riesgo |

---

## 🎯 Criterios de Validación

### Espalda Recta ✅
- **Medición:** Ángulo de inclinación de columna
- **Criterio:** < 30°
- **Objetivo:** Prevenir lesiones lumbares

### Piernas Flexionadas ✅
- **Medición:** Ángulo de rodillas
- **Criterio:** < 140° (posición de cuclillas)
- **Objetivo:** Usar fuerza de piernas, no espalda

### Carga Cerca del Cuerpo ✅
- **Medición:** Distancia manos-torso
- **Criterio:** < 25cm (normalizado)
- **Objetivo:** Reducir tensión en espalda

---

## 💡 Beneficios

### Para Estudiantes
- ✅ Aprendizaje práctico e interactivo
- ✅ Feedback inmediato y personalizado
- ✅ Autoevaluación objetiva
- ✅ Gamificación del aprendizaje

### Para Instructores
- ✅ Herramienta de demostración efectiva
- ✅ Evaluación cuantitativa
- ✅ Material para clases remotas
- ✅ Complemento perfecto a teoría

### Para el Sector
- ✅ Reducción de lesiones lumbares
- ✅ Menor ausentismo laboral
- ✅ Ahorro en costos médicos
- ✅ Mejora en cultura de seguridad

---

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 90+ (Recomendado)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Dispositivos
- ✅ PC con webcam
- ✅ Laptop
- ✅ Tablet con cámara
- ⚠️ Móvil (funciona pero experiencia limitada)

---

## 🏗️ Estructura del Proyecto

```
isteducapostura.github.io/
├── index.html                    # Interfaz principal
├── script.js                     # Lógica de IA y detección
├── media.css                     # Estilos y animaciones
├── ist.ico                       # Favicon
├── ist.png                       # Logo
├── ENTRENADOR_LEVANTAMIENTO.md   # Documentación completa
├── GUIA_IMPLEMENTACION.md        # Guía técnica
├── GUIA_ESTUDIANTE.md            # Tutorial alumnos
├── RESUMEN_EJECUTIVO.md          # Overview ejecutivo
└── CAMBIOS_COMMIT.md             # Log de cambios
```

---

## 🧪 Testing

### Casos Probados
- ✅ Postura perfecta → 100% score
- ✅ Posturas incorrectas → Alertas apropiadas
- ✅ Toggle on/off → Funcionamiento correcto
- ✅ Múltiples navegadores → Compatible
- ✅ Rendimiento → 50-60 FPS

---

## 🔮 Roadmap

### Versión Actual (1.0.0)
- ✅ Detección de poses
- ✅ Validación de postura
- ✅ Feedback en tiempo real
- ✅ Sistema de scoring

### Próximas Versiones
- [ ] Grabación de sesiones
- [ ] Historial de progreso
- [ ] Comparación con técnica ideal
- [ ] Exportación de reportes PDF
- [ ] Modo multijugador
- [ ] Integración con LMS

---

## 👥 Contribuir

Este proyecto fue desarrollado con fines educativos para ISTEduca. Si deseas contribuir:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -m 'Agregar mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

---

## 📄 Licencia

Proyecto educativo desarrollado para ISTEduca - 2026

---

## 🙏 Agradecimientos

- **MediaPipe Team** - Por la increíble biblioteca de IA
- **ISTEduca** - Por la oportunidad de desarrollar este proyecto
- **Estudiantes** - Por ser la inspiración del proyecto

---

## 📞 Contacto

**Institución:** ISTEduca  
**Curso:** Inteligencia Artificial  
**Año:** 2026

---

## 🌟 Estadísticas

![GitHub stars](https://img.shields.io/github/stars/isteducapostura/isteducapostura.github.io)
![GitHub forks](https://img.shields.io/github/forks/isteducapostura/isteducapostura.github.io)
![GitHub issues](https://img.shields.io/github/issues/isteducapostura/isteducapostura.github.io)

---

**💜 Desarrollado con pasión para mejorar la seguridad laboral en el sector alimentación**

---

## 🚀 Quick Start

```bash
# 1. Abre en navegador
index.html

# 2. Activa cámara
Click "Activar Cámara"

# 3. Activa entrenador
Toggle "Activar Entrenador Virtual"

# 4. ¡Practica!
Intenta alcanzar 100% de score
```

---

**¡Listo para usar! 🎉**
