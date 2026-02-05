# Audit Report de Archivos JavaScript

Este documento contiene un análisis completo de los archivos JavaScript del proyecto, cubriendo los siguientes aspectos:

1.  **Calidad de Código y Buenas Prácticas**
2.  **Rendimiento**
3.  **Seguridad**
4.  **Documentación**

---

## 1. Calidad de Código y Buenas Prácticas

### Archivo: `src/js/config.js`

**Observaciones:**

*   **Detección de `isMobile`:** La variable `isMobile` se calcula una sola vez basándose en `window.innerWidth`. Esto es eficiente, pero no se adaptará si el usuario redimensiona la ventana del navegador de un tamaño de escritorio a uno de móvil (o viceversa) sin recargar la página. Para una aplicación más robusta, sería preferible usar `matchMedia` para crear un listener de Media Query que actualice esta variable dinámicamente. Sin embargo, para la experiencia actual, es probable que esta implementación sea suficiente.
*   **Organización:** El código está bien organizado en constantes exportadas, lo cual es una excelente práctica. Los nombres son claros y descriptivos.
*   **Valores Mágicos:** Se evita el uso de "números mágicos" o strings no declarados en el resto de la aplicación al centralizarlos aquí, lo cual es muy positivo para el mantenimiento.

**Recomendaciones:**

*   **(Opcional) Detección de `isMobile` dinámica:** Considerar el uso de `window.matchMedia("(max-width: 768px)")` para una detección de dispositivo móvil que se adapte a los cambios de tamaño de la ventana en tiempo real.

**Conclusión:**

El archivo es de alta calidad y cumple bien su propósito. Las recomendaciones son mejoras menores para casos de uso específicos.

### Archivo: `src/js/modules/PoseEngine.js`

**Observaciones:**

*   **Manejo de Errores:** La función `initializePoseLandmarker` implementa un bloque `try...catch` para gestionar los errores durante la carga del modelo de MediaPipe, lo cual es una práctica excelente. Al relanzar el error (`throw error`), permite que el código que llama (en `script.js`) pueda capturarlo y mostrar un mensaje adecuado al usuario.
*   **Selección de Modelo:** La función `selectModelByPerformance` utiliza `navigator.hardwareConcurrency` y `navigator.deviceMemory` para decidir qué modelo cargar (`lite` o `full`). Esta es una heurística inteligente para adaptar la experiencia al dispositivo del usuario. Sin embargo, `navigator.deviceMemory` no es compatible con todos los navegadores (notablemente Safari en iOS), por lo que la detección podría no ser siempre precisa.
*   **URLs Hardcodeadas:** Las rutas a los modelos de MediaPipe y al resolver de Wasm están directamente en el código. Esto es común en proyectos de este tamaño, pero para mayor flexibilidad, podrían moverse al archivo `config.js`.
*   **Abstracción:** El módulo encapsula exitosamente toda la lógica relacionada con MediaPipe, exponiendo solo las funciones necesarias (`initializePoseLandmarker`, `getPoseLandmarker`, etc.). Esto mantiene el resto del código limpio y desacoplado de la implementación específica de la librería de pose.

**Recomendaciones:**

*   **Fallback en `selectModelByPerformance`:** Dado que `navigator.deviceMemory` puede no estar disponible, la lógica podría ser más robusta. Una mejora sería tratar el valor `undefined` como una memoria baja para asegurar que los dispositivos no compatibles usen el modelo `lite` por defecto. La lógica actual ya se inclina hacia `lite`, lo cual es seguro.
*   **(Opcional) Centralizar URLs:** Mover las URLs de los modelos y del Wasm al archivo `config.js` para tener todas las configuraciones en un solo lugar.

**Conclusión:**

Este módulo es robusto y está bien diseñado. Maneja la complejidad de la librería de IA de forma efectiva y proporciona una API sencilla para el resto de la aplicación.

### Archivo: `src/js/modules/UIManager.js`

**Observaciones:**

*   **Separación de Responsabilidades:** Este módulo centraliza toda la manipulación del DOM, lo cual es una excelente práctica de diseño. Mantiene la lógica de la aplicación (en `script.js` y otros módulos) separada de la representación visual, facilitando el mantenimiento y la depuración.
*   **Cacheo de Elementos DOM:** Al inicio del archivo, se cachean todas las referencias a los elementos del DOM en un objeto `elements`. Esto es muy bueno para el rendimiento, ya que evita consultas repetitivas al DOM (`document.getElementById`) dentro de funciones que se llaman con frecuencia, como las que se ejecutan en el bucle de animación.
*   **Creación Dinámica de Elementos:** Funciones como `showPhaseNotification` y `showSecurityWarning` crean elementos HTML dinámicamente. Esto es flexible, pero se debe tener cuidado con la gestión de estos elementos para no dejar nodos "huérfanos" en el DOM. En el caso de `showPhaseNotification`, el elemento se elimina correctamente después de un tiempo. En `showSecurityWarning`, el botón de cierre solo lo oculta (`style.display='none'`), lo cual es aceptable pero no ideal si la advertencia pudiera mostrarse muchas veces.
*   **Uso de `innerHTML`:** La función `showSecurityWarning` utiliza `innerHTML` para establecer el contenido del mensaje. Aunque en el uso actual el mensaje proviene de errores internos del sistema (que son seguros), esta práctica puede ser un vector de ataques de Cross-Site Scripting (XSS) si en el futuro el mensaje pudiera contener texto proveniente del usuario o de una fuente externa. Sería más seguro usar `textContent` para el mensaje y crear los otros elementos (icono, botón) mediante `document.createElement`.
*   **Audio Sintetizado:** La función `playCalibrationSound` usa la Web Audio API para generar un sonido simple. Es una forma muy ligera y eficiente de dar feedback sin necesidad de cargar archivos de audio externos.

**Recomendaciones:**

*   **Seguridad en `showSecurityWarning`:** Refactorizar la función `showSecurityWarning` para evitar el uso de `innerHTML`. En su lugar, crear los elementos del DOM mediante `document.createElement` y asignar el texto del mensaje con `textContent`. Esto eliminaría cualquier riesgo potencial de XSS.
*   **Gestión de Elementos Dinámicos:** En `showSecurityWarning`, considerar la posibilidad de eliminar el elemento del DOM cuando se cierra, en lugar de simplemente ocultarlo. Esto mantendría el DOM más limpio, aunque el impacto en el rendimiento es mínimo.

**Conclusión:**

Un módulo muy bien estructurado que gestiona eficazmente la interfaz de usuario. Las recomendaciones se centran en fortalecer la seguridad y la robustez en la manipulación del DOM.

### Archivo: `src/js/modules/Biomechanics.js`

**Observaciones:**

*   **Funciones Puras:** La gran mayoría de las funciones en este módulo son "puras": su salida depende únicamente de las entradas (los `landmarks`) y no tienen efectos secundarios. Esto es excelente para la predictibilidad, el testing y la facilidad para razonar sobre el código.
*   **Encapsulación de la Complejidad:** Este módulo es el "cerebro" matemático de la aplicación. Encapsula toda la lógica compleja de los cálculos de ángulos, distancias y la interpretación de las posturas. Esto está muy bien diseñado, ya que aísla la parte más difícil del resto del sistema.
*   **Robustez y Tolerancia a Fallos:**
    *   **Suavizado de `landmarks`:** La función `smoothLandmarks` implementa un promedio móvil para estabilizar los datos de los landmarks. Esto es crucial para reducir el "jitter" (vibración) y obtener una detección de pose mucho más estable y confiable.
    *   **Comprobaciones de Visibilidad:** Las funciones comprueban constantemente la visibilidad de los `landmarks` antes de usarlos (p. ej., `vis(p) => (p?.visibility ?? 1)`). Esto previene errores en tiempo de ejecución si el modelo de IA no puede detectar ciertas partes del cuerpo.
    *   **Lógica de Fallback:** La función `detectStraightBackFallback` es un ejemplo brillante de ingeniería robusta. Proporciona un método alternativo para comprobar la postura de la espalda cuando los `landmarks` de la cadera no son visibles, asegurando que la experiencia pueda continuar.
*   **Configuración Externalizada:** Todas las constantes y umbrales numéricos (los "números mágicos" de la biomecánica) se importan desde `config.js` (`LANDMARK_THRESHOLDS`). Esto es una práctica excelente que facilita enormemente el ajuste fino del comportamiento de la detección sin tener que tocar la lógica principal.

**Recomendaciones:**

*   **Comentarios Explicativos:** Aunque el código es claro en "qué" hace, algunas de las funciones de cálculo más complejas (como `calculateBackAngle` o la lógica dentro de `detectCorrectPositioning`) podrían beneficiarse de un breve comentario que explique el "porqué" de la fórmula o el enfoque. Por ejemplo, explicar por qué se usa la diferencia entre el eje Y de la nariz y los hombros como un proxy para la inclinación de la espalda en el `fallback`. Esto ayudaría a futuros desarrolladores a entender el razonamiento biomecánico.

**Conclusión:**

Este es el módulo más crítico y mejor diseñado de la aplicación. Es robusto, eficiente y está bien encapsulado. La recomendación es menor y se enfoca en mejorar aún más la mantenibilidad a largo plazo a través de la documentación en el código.

### Archivo: `src/js/modules/ExperienceManager.js`

**Observaciones:**

*   **Máquina de Estados:** Este módulo funciona como una máquina de estados (`currentPhase`) que orquesta el flujo de la experiencia del usuario. Este es un patrón de diseño excelente para gestionar interacciones complejas y secuenciales, ya que hace que el flujo sea explícito y fácil de seguir.
*   **Transiciones Claras:** La función `transitionTo` es el corazón de la máquina de estados. Maneja de forma centralizada la lógica para pasar de una fase a otra, incluyendo la actualización del estado, el reseteo de temporizadores (`holdStartTime`), la gestión de la visibilidad de la UI (a través de `UIManager`) y la reproducción de audio.
*   **Gestión de Audio Asíncrono:** La función `playAudio` gestiona la reproducción de clips de audio y devuelve una `Promise` que se resuelve cuando el audio termina. Este es un enfoque moderno y limpio para manejar operaciones asíncronas, permitiendo que el flujo de la experiencia espere a que el audio termine antes de continuar (p. ej., en `auto_after_audio`). El manejo de errores en la reproducción también es robusto.
*   **Tolerancia al "Jitter":** La lógica de `jitterToleranceFrames` en la función `update` es una característica de diseño muy inteligente. Evita que la experiencia se interrumpa o reinicie si la detección de la pose parpadea o falla durante unos pocos fotogramas. Esto hace que la interacción sea mucho más fluida y tolerante para el usuario final.
*   **Acoplamiento Controlado:** El `ExperienceManager` está acoplado a `Biomechanics` (para las funciones de `check`) y a `UIManager` (para actualizar la UI). Este acoplamiento es necesario para su función como orquestador. Está bien gestionado a través de importaciones de ES modules, lo que hace que las dependencias sean explícitas.
*   **Inicialización Dinámica:** La función `init` asigna dinámicamente las funciones de comprobación (`check`) a las fases correspondientes. Este enfoque es flexible y permite reconfigurar la lógica de cada fase fácilmente.

**Recomendaciones:**

*   **Pausa y Reanudación de Audio:** Actualmente, si se inicia un nuevo audio, el anterior se detiene (`this.currentAudio.pause()`). Sería interesante considerar si en algún caso de uso futuro se necesitaría una lógica más compleja para pausar y reanudar el audio en lugar de simplemente detenerlo. Para la aplicación actual, el comportamiento es correcto.

**Conclusión:**

Este módulo es el director de orquesta de la aplicación y está excelentemente diseñado. La implementación de una máquina de estados con transiciones claras, manejo de asincronía y tolerancia a fallos lo convierte en una pieza de software muy robusta y mantenible.

### Archivo: `src/js/script.js`

**Observaciones:**

*   **Punto de Entrada y Orquestación:** Este archivo actúa como el punto de entrada principal de la aplicación. Su responsabilidad es importar todos los módulos, inicializarlos en el orden correcto y poner en marcha el bucle principal de predicción. Es el "pegamento" que une a todos los demás módulos.
*   **Gestión del Estado Global:** Gestiona un pequeño conjunto de variables de estado globales (`webcamRunning`, `lastVideoTime`, `liftingTrainer`). El uso del objeto `AppState` es una excelente abstracción para manejar los estados principales del ciclo de vida de la aplicación (LOADING, READY, ERROR), haciendo el código más legible y fácil de gestionar.
*   **Bucle de Predicción (`predictWebcam`):**
    *   **Eficiencia:** Utiliza `window.requestAnimationFrame` para el bucle, lo cual es la mejor práctica para animaciones y tareas repetitivas en el navegador, ya que se sincroniza con el refresco de la pantalla y ahorra recursos.
    *   **Optimización de `Frame Skipping`:** La lógica de `frameSkipCounter` es una optimización de rendimiento muy importante. Reduce la carga en el CPU al no ejecutar la costosa detección de pose en cada fotograma, especialmente en móviles. Esto mejora la fluidez y reduce el consumo de batería.
*   **Manejo de Errores Críticos:** El bloque `try...catch` en la función `main` es fundamental para la robustez de la aplicación. La implementación de un `Promise.race` con un `timeout` para la carga del modelo de IA es una técnica avanzada y muy efectiva para evitar que la aplicación se quede "colgada" indefinidamente si la carga del modelo falla o tarda demasiado.
*   **Interacción con el DOM:** Este archivo delega casi toda la manipulación directa del DOM al `UIManager`, lo cual es una excelente separación de responsabilidades. Las únicas interacciones directas son para la gestión del stream de la cámara y los listeners de eventos, lo cual es apropiado.

**Recomendaciones:**

*   **Variable Global `landmarkHistory`:** La variable `landmarkHistory` se crea en el objeto `window` (`window.landmarkHistory`). Esto funciona, pero es una práctica generalmente desaconsejada porque "contamina" el espacio de nombres global y puede crear conflictos con otras librerías. Sería más limpio declararla como una variable local dentro del módulo `script.js` (p. ej., `let landmarkHistory = [];`) y pasarla como parámetro a las funciones que la necesiten si fuera necesario, o simplemente mantenerla en el scope del módulo.
*   **(Menor) Claridad en `enableCam`:** La función `enableCam` maneja tanto la activación como la desactivación de la cámara. Podría ser ligeramente más claro si se dividiera en dos funciones (`startWebcam` y `stopWebcam`), aunque su estado actual es compacto y funcional.

**Conclusión:**

El archivo principal está muy bien estructurado. Combina una arquitectura modular clara con optimizaciones de rendimiento inteligentes y un manejo de errores robusto. Las recomendaciones son menores y se centran en pulir detalles para seguir las mejores prácticas de forma aún más estricta.
---
## 2. Análisis de Rendimiento

La aplicación está notablemente bien optimizada para una tarea tan intensiva como es el análisis de pose en tiempo real en el navegador. Las siguientes son las observaciones clave sobre el rendimiento.

### Puntos Fuertes

*   **Bucle de Animación (`requestAnimationFrame`):** El uso de `requestAnimationFrame` en `script.js` es la forma más eficiente de ejecutar el bucle de detección y dibujado, asegurando que el navegador pueda optimizar el renderizado y ahorrar batería.
*   **`Frame Skipping`:** La lógica para saltar fotogramas (`frameSkipCounter`) en `predictWebcam` es la optimización más importante de la aplicación. Reduce drásticamente la carga sobre el CPU al no ejecutar la costosa detección de MediaPipe en cada fotograma. La adaptación del `skipThreshold` para móvil vs. escritorio es una decisión de diseño excelente.
*   **Delegación a GPU:** Al inicializar `PoseLandmarker`, se establece la opción `delegate: "GPU"`. Esto es crucial, ya que descarga la mayor parte del trabajo de inferencia del modelo a la GPU, liberando al CPU para otras tareas y mejorando enormemente el rendimiento.
*   **Cacheo de Selectores DOM:** El `UIManager` cachea las referencias a los elementos del DOM en el objeto `elements`. Esto evita la sobrecarga de consultas repetitivas al DOM dentro del bucle de animación, lo cual es una práctica de rendimiento fundamental.
*   **Dibujado Selectivo en Canvas:** En `script.js`, se toma la decisión de no dibujar el esqueleto en dispositivos móviles (`if (!isMobile)`). Esta es una optimización muy efectiva para reducir la carga de renderizado en dispositivos con menos potencia.
*   **Uso de Web Audio API:** La generación de sonidos de UI mediante la Web Audio API (`playCalibrationSound`) es extremadamente ligera y no requiere la descarga y decodificación de archivos de audio, lo cual ahorra ancho de banda y memoria.

### Posibles Áreas de Mejora (Micro-optimizaciones)

*   **Creación de Objetos en el Bucle:** Dentro del bucle `predictWebcam`, se crean algunos objetos y funciones anónimas en cada fotograma procesado (p. ej., la función de callback para `detectForVideo`). En JavaScript moderno, el impacto de esto es mínimo gracias a las optimizaciones de los motores de JS. Sin embargo, en un escenario de optimización extrema, se podría intentar pre-alocar o reutilizar objetos y definir las funciones de callback fuera del bucle. **En la práctica, el beneficio sería probablemente insignificante y podría hacer el código más difícil de leer.**
*   **Complejidad del Dibujado en Canvas:** El dibujado en el canvas (`drawSkeleton`) es relativamente simple. Si en el futuro se añadieran más elementos o efectos complejos, se podrían explorar técnicas como el renderizado en un canvas fuera de pantalla (`OffscreenCanvas`) para mover el trabajo de dibujado a un worker thread, aunque esto añadiría una complejidad considerable.

**Conclusión de Rendimiento:**

La arquitectura actual demuestra un profundo entendimiento de los cuellos de botella comunes en aplicaciones de visión por computador en la web. Las optimizaciones implementadas (frame skipping, delegación a GPU, cacheo de DOM) son de alto impacto y colocan a la aplicación en un estado de rendimiento excelente. Las posibles mejoras son micro-optimizaciones que probablemente no justifiquen el aumento en la complejidad del código.
---
## 3. Análisis de Seguridad

La aplicación, al ser puramente del lado del cliente, tiene una superficie de ataque relativamente pequeña. Sin embargo, hay varias consideraciones de seguridad importantes.

### Puntos Fuertes

*   **Procesamiento en el Cliente (Privacidad):** El punto más fuerte de la aplicación desde la perspectiva de la seguridad y la privacidad es que todo el procesamiento de video se realiza en el dispositivo del usuario. En ningún momento se envían imágenes o datos de video a un servidor externo. Esto es excelente para la privacidad del usuario y debería ser un punto a destacar en cualquier comunicación sobre la aplicación.
*   **Permisos de Cámara:** La aplicación solicita acceso a la cámara utilizando la API estándar `navigator.mediaDevices.getUserMedia`. Esto significa que el navegador gestiona el permiso, mostrando un aviso claro al usuario y dándole el control para permitir o denegar el acceso. Este es el procedimiento correcto y seguro.

### Riesgos y Recomendaciones

*   **Riesgo de XSS (Cross-Site Scripting) en `UIManager.js`:**
    *   **Vulnerabilidad:** La función `showSecurityWarning` utiliza `.innerHTML` para inyectar el mensaje de error en el DOM. Como se mencionó en la sección de Calidad de Código, si el `message` proviniera de una fuente no confiable (p. ej., un parámetro en la URL, un error de una API externa), un atacante podría inyectar código JavaScript malicioso.
    *   **Ejemplo de ataque (hipotético):** Si `message` fuera `"<img src=x onerror=alert('XSS')>"`, se ejecutaría el script.
    *   **Recomendación Crítica:** Es **muy recomendable** refactorizar esta función para evitar `innerHTML`. Se debe crear el elemento de texto con `document.createElement('p')` y asignar el mensaje usando `element.textContent = message`. Esto neutraliza por completo este vector de ataque.

*   **Seguridad de Dependencias (CDN):**
    *   **Riesgo:** La aplicación carga la librería `@mediapipe/tasks-vision` directamente desde un CDN (`https://cdn.jsdelivr.net/npm/...`). Si este CDN fuera comprometido, o si hubiera un ataque de intermediario (Man-in-the-Middle), se podría servir una versión maliciosa de la librería que podría robar datos del usuario o realizar acciones no deseadas.
    *   **Recomendación (Subresource Integrity - SRI):** Para mitigar este riesgo, se debe añadir un atributo `integrity` a la etiqueta `<script>` que carga la librería en el archivo `index.html`. El valor de este atributo es un hash del contenido del archivo. El navegador solo ejecutará el script si su contenido coincide exactamente con el hash, previniendo la carga de scripts manipulados.
    *   **Ejemplo:**
        ```html
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"
                integrity="sha256-... valor del hash ... "
                crossorigin="anonymous"></script>
        ```
        El hash se puede obtener del proveedor del CDN o generándolo localmente.

### Conclusión de Seguridad

La arquitectura centrada en la privacidad es un gran acierto. Los riesgos principales son conocidos y abordables. La corrección de la vulnerabilidad de XSS es la tarea más urgente. La implementación de SRI para las dependencias externas fortalecería significativamente la defensa contra ataques en la cadena de suministro.
---
## 4. Documentación del Código

Esta sección proporciona una descripción de alto nivel de la arquitectura del software y la función de cada módulo.

### Arquitectura General

La aplicación sigue una arquitectura **modular y orquestada**. El código está claramente dividido en módulos con responsabilidades únicas (SRP - Single Responsibility Principle).

1.  **`config.js`**: Es el **almacén de configuración** de la aplicación. Centraliza todos los valores y umbrales que pueden necesitar ser ajustados, evitando el uso de "números mágicos" en la lógica.
2.  **`PoseEngine.js`**: Es la **capa de abstracción de la IA**. Encapsula toda la complejidad de la librería MediaPipe. Su trabajo es cargar el modelo de IA y proporcionar una forma sencilla de obtener los datos de la pose del video.
3.  **`Biomechanics.js`**: Es el **cerebro de análisis**. Contiene funciones puras y matemáticas para interpretar los datos crudos de la pose que vienen del `PoseEngine`. Calcula ángulos, distancias y determina si una postura es correcta según las reglas definidas.
4.  **`UIManager.js`**: Es la **capa de presentación**. Es el único módulo que tiene permitido manipular el DOM directamente. Recibe órdenes de otros módulos y las traduce en cambios visuales para el usuario (mostrar/ocultar elementos, actualizar texto, dibujar en el canvas).
5.  **`ExperienceManager.js`**: Es el **director de orquesta (máquina de estados)**. Define el flujo de la experiencia del usuario paso a paso. Utiliza los datos de `Biomechanics` para comprobar las condiciones de cada fase y le dice al `UIManager` qué mostrar en cada momento.
6.  **`script.js`**: Es el **punto de entrada**. Importa todos los módulos, los inicializa y arranca el bucle principal (`predictWebcam`) que mantiene la aplicación viva, conectando la salida del `PoseEngine` con la entrada del `ExperienceManager` y el `UIManager`.

El flujo de datos en cada fotograma es el siguiente:
`Video Frame` -> `PoseEngine` -> `Landmarks` -> `Biomechanics` -> `Analysis` -> `ExperienceManager` -> `State Change` -> `UIManager` -> `UI Update`

---
### Documentación de Módulos

#### `config.js`
*   **Propósito:** Proveer constantes de configuración para toda la aplicación.
*   **Exportaciones Clave:**
    *   `TRACKING_COLORS`: Objeto con códigos de color para el dibujado del esqueleto.
    *   `isMobile`: Booleano que indica si el dispositivo es móvil.
    *   `VIDEO_CONFIG`: Dimensiones y framerate ideales para el video.
    *   `LANDMARK_THRESHOLDS`: Umbrales numéricos para las validaciones biomecánicas.
    *   `AUDIO_PATHS`: Rutas a los archivos de audio.
    *   `PHASE_CONFIG`: Objeto que define cada fase de la experiencia (textos, audios, duraciones).

#### `PoseEngine.js`
*   **Propósito:** Gestionar el ciclo de vida y la ejecución del modelo PoseLandmarker de MediaPipe.
*   **Funciones Clave:**
    *   `initializePoseLandmarker(modelType, runningMode)`: Carga y configura el modelo de IA. `modelType` puede ser `'lite'` o `'full'`.
    *   `getPoseLandmarker()`: Devuelve la instancia del modelo cargado.
    *   `detectForVideo(video, startTimeMs, callback)`: Ejecuta la detección de pose en un fotograma de video.
    *   `selectModelByPerformance()`: Heurística para seleccionar el modelo (`lite` o `full`) basado en las capacidades del dispositivo.

#### `UIManager.js`
*   **Propósito:** Centralizar toda la manipulación del DOM y la retroalimentación visual.
*   **Funciones Clave:**
    *   `showCalibrationOverlay() / hideCalibrationOverlay()`: Muestran u ocultan la interfaz de calibración.
    *   `updateCalibrationStatus(isCorrect, progress)`: Actualiza el texto de estado durante la calibración.
    *   `updateSubtitle(text)`: Muestra un texto en el área de subtítulos.
    *   `drawSkeleton(landmarks, colors)`: Dibuja el esqueleto y los puntos clave en el canvas.
    *   `clearCanvas() / restoreCanvas()`: Limpian y restauran el estado del canvas.
    *   `showSecurityWarning(message)`: Muestra una advertencia de seguridad.

#### `Biomechanics.js`
*   **Propósito:** Contener las funciones matemáticas para analizar la geometría de la pose.
*   **Funciones Clave:**
    *   `calculateAngle(a, b, c)`: Calcula el ángulo entre tres puntos.
    *   `smoothLandmarks(landmarks, history)`: Suaviza los datos de los landmarks para reducir la vibración.
    *   `detectCorrectPositioning(landmarks)`: Valida si el usuario está centrado correctamente en las guías.
    *   `detectStraightBack(landmarks, context)`: Valida si la espalda del usuario está recta.
    *   `detectOpenPosture(landmarks)`: Valida si el usuario tiene una postura corporal "abierta".
    *   `detectSmile(landmarks)`: Detecta si el usuario está sonriendo.
    *   `analyzeLiftingPosture(landmarks)`: Analiza una postura de levantamiento de peso y devuelve un feedback detallado.

#### `ExperienceManager.js`
*   **Propósito:** Gestionar el estado y el flujo de la experiencia del usuario.
*   **Funciones Clave:**
    *   `init()`: Inicializa el manager y las fases.
    *   `update(landmarks)`: Función principal llamada en cada fotograma. Evalúa la pose actual contra la fase actual y decide si transicionar a la siguiente.
    *   `transitionTo(phaseId)`: Mueve la máquina de estados a una nueva fase, ejecutando la lógica de entrada (audios, textos, etc.).
    *   `reset()`: Reinicia la experiencia al estado inicial.

#### `script.js`
*   **Propósito:** Orquestar la inicialización y el bucle principal de la aplicación.
*   **Funciones Clave:**
    *   `main()`: Función principal que se ejecuta al cargar la página. Carga el modelo y comienza la experiencia.
    *   `predictWebcam()`: El bucle principal (`requestAnimationFrame`) que obtiene los datos de la cámara, ejecuta la detección y actualiza la UI.
    *   `enableCam()`: Maneja la lógica para activar y desactivar el stream de la cámara web.
