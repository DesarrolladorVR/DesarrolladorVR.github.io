# 📦 Entrenador Virtual de Levantamiento Seguro

## 🎯 Descripción del Proyecto

Sistema de entrenamiento interactivo con Inteligencia Artificial para enseñar técnicas correctas de manejo manual de carga en el sector alimentación, desarrollado para el curso **"Riesgos, Efectos en la Salud y Medidas Preventivas"**.

### 🏢 Contexto Educativo

**UNIDAD 1:** Recepción y Descarga de Alimentos  
**Sección específica:** Técnicas correctas de manejo manual de carga

### ⚠️ Problema a Resolver

Las lesiones lumbares por mala postura al levantar cajas pesadas son uno de los riesgos más frecuentes y costosos en el sector alimentación. Este sistema convierte una recomendación teórica en una herramienta práctica de autoevaluación y entrenamiento.

---

## 🚀 Características Principales

### 1. Detección en Tiempo Real con MediaPipe
- Utiliza **MediaPipe Pose** para rastrear 33 puntos clave del cuerpo
- Análisis instantáneo de la postura del trabajador
- Procesamiento local (no requiere conexión a servidor)

### 2. Validación de Postura Correcta

El sistema verifica 3 criterios fundamentales:

#### ✅ Espalda Recta
- **Criterio:** Inclinación de la columna < 30°
- **Cálculo:** Ángulo entre el eje vertical y la línea hombros-caderas
- **Feedback:** Alerta si el usuario dobla la espalda

#### ✅ Piernas Flexionadas
- **Criterio:** Ángulo de rodillas < 140° (posición de cuclillas)
- **Cálculo:** Ángulo formado por cadera-rodilla-tobillo
- **Feedback:** Indica si debe flexionar más las piernas

#### ✅ Carga Cerca del Cuerpo
- **Criterio:** Distancia manos-torso < 25cm (normalizado)
- **Cálculo:** Distancia euclidiana entre muñecas y centro del torso
- **Feedback:** Avisa si debe acercar más las manos al cuerpo

### 3. Sistema de Puntuación
- **0-32%:** Postura peligrosa (rojo)
- **33-65%:** Postura mejorable (naranja)
- **66-99%:** Postura buena (amarillo)
- **100%:** Postura perfecta (verde)

### 4. Feedback Visual Interactivo
- **Indicadores en tiempo real** sobre el video
- **Mensajes de corrección** específicos para cada error
- **Alertas de felicitación** cuando la postura es correcta
- **Animaciones visuales** para reforzar el aprendizaje

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **MediaPipe Pose** | Detección de puntos clave del cuerpo humano |
| **JavaScript ES6+** | Lógica de aplicación y cálculos matemáticos |
| **HTML5** | Estructura de la interfaz |
| **CSS3** | Diseño visual y animaciones |
| **Canvas API** | Renderizado de indicadores visuales |
| **WebRTC** | Acceso a la cámara web |

---

## 📊 Algoritmos de Análisis

### Cálculo del Ángulo de Espalda
```javascript
function calculateBackAngle(landmarks) {
  // Puntos medios de hombros y caderas
  const shoulderMid = promedio(hombro_izq, hombro_der);
  const hipMid = promedio(cadera_izq, cadera_der);
  
  // Ángulo respecto a la vertical
  return atan2(|dx|, |dy|) * 180 / π;
}
```

### Cálculo del Ángulo de Rodillas
```javascript
function calculateKneeAngle(landmarks, side) {
  // Tres puntos: cadera, rodilla, tobillo
  return calcularAngulo(cadera, rodilla, tobillo);
}
```

### Distancia Manos-Torso
```javascript
function calculateHandToTorsoDistance(landmarks) {
  const torsoMid = promedio(hombros, caderas);
  const leftDist = distancia(muñeca_izq, torsoMid);
  const rightDist = distancia(muñeca_der, torsoMid);
  
  return (leftDist + rightDist) / 2;
}
```

---

## 🎮 Modo de Uso

### 1. Activar la Cámara
1. Haz clic en el botón **"Activar Cámara"**
2. Permite el acceso a tu webcam
3. Asegúrate de tener buena iluminación
4. Colócate a 1-2 metros de la cámara

### 2. Activar el Entrenador Virtual
1. Localiza el módulo **"Entrenador Virtual de Levantamiento Seguro"**
2. Activa el interruptor (toggle)
3. El panel de métricas aparecerá

### 3. Practicar la Técnica Correcta
1. Simula que vas a levantar una caja del suelo
2. Observa el feedback en tiempo real:
   - **Indicadores de color** en el video
   - **Mensaje de feedback** en la parte superior
   - **Métricas específicas** para cada parámetro
3. Corrige tu postura según las indicaciones
4. Intenta alcanzar el 100% de puntuación

### 4. Interpretación de Resultados

#### Panel de Métricas
- **📊 Puntuación General:** Score total (0-100%)
- **🔄 Ángulo de Espalda:** Debe ser < 30°
- **🦵 Ángulo de Rodillas:** Debe ser < 140°
- **✋ Distancia Manos-Torso:** Debe ser mínima

#### Colores del Feedback
- 🟢 **Verde:** ¡Perfecto! Técnica correcta
- 🟡 **Amarillo:** Buena postura, pequeñas mejoras
- 🟠 **Naranja:** Postura mejorable
- 🔴 **Rojo:** ¡Alerta! Riesgo de lesión

---

## 📚 Beneficios Educativos

### Para Estudiantes
- ✅ Aprendizaje práctico e interactivo
- ✅ Autoevaluación inmediata
- ✅ Refuerzo visual del conocimiento teórico
- ✅ Gamificación del aprendizaje (puntuación)

### Para Instructores
- ✅ Herramienta de demostración en clase
- ✅ Evaluación objetiva de técnicas
- ✅ Material complementario para clases remotas
- ✅ Datos cuantitativos de la postura

### Para el Sector
- ✅ Reducción de lesiones lumbares
- ✅ Menor ausentismo laboral
- ✅ Mejora en la cultura de seguridad
- ✅ Herramienta de inducción para nuevos trabajadores

---

## 🔧 Requisitos Técnicos

### Navegador
- Google Chrome 90+ (recomendado)
- Firefox 88+
- Edge 90+
- Safari 14+

### Hardware
- Webcam funcional
- Procesador: Dual-core 2GHz o superior
- RAM: 4GB mínimo
- GPU: Aceleración de hardware habilitada (recomendado)

### Permisos
- ✅ Acceso a la cámara web
- ✅ JavaScript habilitado

---

## 📖 Instrucciones de Seguridad

### ⚠️ Advertencias Importantes

1. **Este es un sistema de entrenamiento**, no sustituye la capacitación formal en prevención de riesgos laborales
2. **No levantes cargas reales** mientras usas el sistema
3. **Consulta con un profesional** si tienes condiciones médicas preexistentes
4. **Practica en un espacio seguro** libre de obstáculos

### 🎓 Mejores Prácticas

1. **Antes del levantamiento:**
   - Evalúa el peso y tamaño de la carga
   - Planifica la ruta de transporte
   - Verifica que el camino esté despejado

2. **Durante el levantamiento:**
   - Mantén la espalda recta
   - Flexiona las rodillas (posición de cuclillas)
   - Mantén la carga cerca del cuerpo
   - Levanta con la fuerza de las piernas, no de la espalda

3. **Después del levantamiento:**
   - Transporta la carga pegada al cuerpo
   - No gires el torso con la carga
   - Deposita suavemente, no arrojes

---

## 🎨 Personalización

### Ajustar Umbrales de Validación

Puedes modificar los criterios en [script.js](script.js#L195):

```javascript
// Criterios de validación
const isBackStraight = backAngle < 30;        // Cambiar 30 por otro valor
const areKneesFlexed = avgKneeAngle < 140;    // Cambiar 140 por otro valor
const isLoadClose = handDistance < 0.25;      // Cambiar 0.25 por otro valor
```

---

## 📞 Soporte y Contacto

**Desarrollado para:** ISTEduca  
**Curso:** Inteligencia Artificial  
**Año:** 2026  
**Tecnología:** MediaPipe by Google

---

## 📜 Licencia

Este proyecto fue desarrollado con fines educativos para ISTEduca.

---

## 🌟 Próximas Mejoras

- [ ] Grabación de sesiones de práctica
- [ ] Estadísticas de progreso histórico
- [ ] Comparación con técnica ideal (video de referencia)
- [ ] Exportación de reportes en PDF
- [ ] Modo multijugador/competitivo
- [ ] Integración con plataforma LMS

---

**💜 Desarrollado con pasión para mejorar la seguridad laboral en el sector alimentación**
