// ISTEduca - Detecci\u00f3n de Poses con MediaPipe
// Sistema de detecci\u00f3n de poses mejorado con informaci\u00f3n educativa

import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision;

// Variables globales
let poseLandmarker = undefined;
let runningMode = "VIDEO";
let webcamRunning = false;
let lastVideoTime = -1;
let frameSkipCounter = 0; // Para optimización de frames
let currentModel = 'lite'; // 'full' o 'lite'
let armsUpDetected = false; // Control para oneshot de audio
let detectionStats = {
  poseCount: 0,
  confidence: 0,
  status: 'Esperando...'
};

// Configuración de video optimizada
const videoWidth = 960;
const videoHeight = 540;

// Variables para entrenamiento de levantamiento seguro
let liftingTrainer = {
  enabled: false,
  backAngle: 0,
  kneeAngle: 0,
  handDistance: 0,
  feedback: '',
  alerts: {
    backStraight: false,
    kneesFlexed: false,
    loadClose: false
  },
  score: 0
};

// Elementos del DOM
const webcamButton = document.getElementById("webcamButton");
const cameraSection = document.getElementById("cameraSection");
const videoContainer = document.getElementById("videoContainer");
const challengesSection = document.getElementById("challenges");
const liftingTrainerSection = document.getElementById("liftingTrainer");
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const armsUpSound = document.getElementById("armsUpSound");

// Elementos de estad\u00edsticas
const poseCountElement = document.getElementById("poseCount");
const confidenceElement = document.getElementById("confidence");
const statusElement = document.getElementById("status");
// Elementos del entrenador de levantamiento
const trainerToggle = document.getElementById("trainerToggle");
const trainerPanel = document.getElementById("trainerPanel");
const feedbackElement = document.getElementById("feedbackMessage");
const scoreElement = document.getElementById("scoreValue");
const backAngleElement = document.getElementById("backAngle");
const kneeAngleElement = document.getElementById("kneeAngle");
const handDistElement = document.getElementById("handDist");
// Inicializar MediaPipe
const createPoseLandmarker = async (modelType = 'lite') => {
  updateStatus(`Cargando modelo ${modelType.toUpperCase()}...`);
  
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${modelType}/float16/1/pose_landmarker_${modelType}.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numPoses: 1 // Solo 1 pose para mejor rendimiento
    });
    
    currentModel = modelType;
    updateStatus(`Modelo ${modelType.toUpperCase()} cargado ✓`);
    console.log(`MediaPipe PoseLandmarker (${modelType}) cargado correctamente`);
  } catch (error) {
    console.error("Error al cargar MediaPipe:", error);
    updateStatus('Error al cargar el modelo');
  }
};

// Actualizar estado en la UI
function updateStatus(status) {
  detectionStats.status = status;
  if (statusElement) {
    statusElement.textContent = status;
  }
}

// ============================================================
// FUNCIONES MATEMÁTICAS PARA ANÁLISIS DE POSTURA
// ============================================================

// ============================================================
// DETECCIÓN DE BRAZOS LEVANTADOS
// ============================================================

function detectArmsUp(landmarks) {
  // Puntos clave: hombros (11, 12) y muñecas (15, 16)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  
  // Verificar que los landmarks tengan buena visibilidad
  if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
      leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) {
    return false;
  }
  
  // Calcular altura promedio de hombros
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  
  // Verificar si ambas muñecas están por encima de los hombros
  // (menor valor Y significa más arriba en la pantalla)
  const leftArmUp = leftWrist.y < leftShoulder.y - 0.1;
  const rightArmUp = rightWrist.y < rightShoulder.y - 0.1;
  
  return leftArmUp && rightArmUp;
}

function playArmsUpSound() {
  if (!armsUpSound) return;
  
  try {
    armsUpSound.currentTime = 0; // Reiniciar al inicio
    armsUpSound.play().catch(err => {
      console.log("No se pudo reproducir el audio:", err);
    });
  } catch (error) {
    console.log("Error al reproducir audio:", error);
  }
}

// Calcular ángulo entre tres puntos (en grados)
function calculateAngle(pointA, pointB, pointC) {
  // pointB es el vértice del ángulo
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) - 
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
}

// Calcular distancia euclidiana entre dos puntos
function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = (point2.z || 0) - (point1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Calcular ángulo de inclinación de la espalda
function calculateBackAngle(landmarks) {
  // Puntos clave: hombros (11, 12) y caderas (23, 24)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  // Punto medio de hombros y caderas
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2
  };
  
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2
  };
  
  // Calcular ángulo respecto a la vertical
  const dx = hipMid.x - shoulderMid.x;
  const dy = hipMid.y - shoulderMid.y;
  const angle = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
  
  return angle;
}

// Calcular ángulo de las rodillas
function calculateKneeAngle(landmarks, side = 'left') {
  // Puntos clave para rodilla izquierda: cadera(23), rodilla(25), tobillo(27)
  // Para rodilla derecha: cadera(24), rodilla(26), tobillo(28)
  const hipIdx = side === 'left' ? 23 : 24;
  const kneeIdx = side === 'left' ? 25 : 26;
  const ankleIdx = side === 'left' ? 27 : 28;
  
  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];
  
  return calculateAngle(hip, knee, ankle);
}

// Calcular distancia de las manos al torso
function calculateHandToTorsoDistance(landmarks) {
  // Punto medio del torso (entre hombros y caderas)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  const torsoMid = {
    x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
    y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4,
    z: (leftShoulder.z + rightShoulder.z + leftHip.z + rightHip.z) / 4
  };
  
  // Posición de las muñecas
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  
  const leftDist = calculateDistance(leftWrist, torsoMid);
  const rightDist = calculateDistance(rightWrist, torsoMid);
  
  // Promedio de ambas manos
  return (leftDist + rightDist) / 2;
}

// ============================================================
// SISTEMA DE VALIDACIÓN DE POSTURA
// ============================================================

function analyzeLiftingPosture(landmarks) {
  // Verificar que tengamos suficientes landmarks
  if (!landmarks || landmarks.length < 33) {
    return null;
  }
  
  // Calcular métricas
  const backAngle = calculateBackAngle(landmarks);
  const leftKneeAngle = calculateKneeAngle(landmarks, 'left');
  const rightKneeAngle = calculateKneeAngle(landmarks, 'right');
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  const handDistance = calculateHandToTorsoDistance(landmarks);
  
  // Criterios de validación
  const isBackStraight = backAngle < 30; // Espalda recta si inclinación < 30°
  const areKneesFlexed = avgKneeAngle < 140; // Rodillas flexionadas si < 140°
  const isLoadClose = handDistance < 0.25; // Manos cerca del cuerpo (normalizado)
  
  // Generar feedback
  let feedback = [];
  let score = 0;
  
  if (isBackStraight) {
    feedback.push("✅ ¡Excelente! Espalda recta");
    score += 33;
  } else {
    feedback.push("⚠️ ALERTA: Estás doblando la espalda. Mantén la columna recta");
  }
  
  if (areKneesFlexed) {
    feedback.push("✅ ¡Muy bien! Piernas flexionadas");
    score += 33;
  } else {
    feedback.push("⚠️ ALERTA: Flexiona más las rodillas. Ponte en cuclillas");
  }
  
  if (isLoadClose) {
    feedback.push("✅ ¡Perfecto! Carga cerca del cuerpo");
    score += 34;
  } else {
    feedback.push("⚠️ ALERTA: Acerca más las manos al torso");
  }
  
  return {
    backAngle: backAngle.toFixed(1),
    kneeAngle: avgKneeAngle.toFixed(1),
    handDistance: (handDistance * 100).toFixed(1),
    isBackStraight,
    areKneesFlexed,
    isLoadClose,
    feedback: feedback.join(' | '),
    score: score,
    isPerfect: isBackStraight && areKneesFlexed && isLoadClose
  };
}

// Actualizar estad\u00edsticas en la UI
function updateStats() {
  if (poseCountElement) {
    poseCountElement.textContent = detectionStats.poseCount;
  }
  if (confidenceElement) {
    const conf = detectionStats.confidence > 0 
      ? `${(detectionStats.confidence * 100).toFixed(1)}%` 
      : '-';
    confidenceElement.textContent = conf;
  }
}
// Actualizar UI del entrenador de levantamiento
function updateTrainerUI(analysis) {
  if (!analysis || !liftingTrainer.enabled) return;
  
  // Actualizar feedback
  if (feedbackElement) {
    feedbackElement.textContent = analysis.feedback;
    
    // Cambiar color según el score
    feedbackElement.className = 'feedback-message';
    if (analysis.isPerfect) {
      feedbackElement.classList.add('perfect');
    } else if (analysis.score >= 66) {
      feedbackElement.classList.add('good');
    } else if (analysis.score >= 33) {
      feedbackElement.classList.add('warning');
    } else {
      feedbackElement.classList.add('danger');
    }
  }
  
  // Actualizar score
  if (scoreElement) {
    scoreElement.textContent = analysis.score + '%';
    scoreElement.className = 'metric-value';
    if (analysis.score === 100) {
      scoreElement.classList.add('perfect');
    } else if (analysis.score >= 66) {
      scoreElement.classList.add('good');
    } else {
      scoreElement.classList.add('warning');
    }
  }
  
  // Actualizar métricas individuales
  if (backAngleElement) {
    backAngleElement.textContent = analysis.backAngle + '°';
    backAngleElement.className = 'metric-value ' + (analysis.isBackStraight ? 'good' : 'warning');
  }
  
  if (kneeAngleElement) {
    kneeAngleElement.textContent = analysis.kneeAngle + '°';
    kneeAngleElement.className = 'metric-value ' + (analysis.areKneesFlexed ? 'good' : 'warning');
  }
  
  if (handDistElement) {
    handDistElement.textContent = analysis.handDistance + ' cm';
    handDistElement.className = 'metric-value ' + (analysis.isLoadClose ? 'good' : 'warning');
  }
  
  // Dibujar indicadores visuales en el canvas
  drawPostureIndicators(analysis);
}

// Dibujar indicadores visuales en el canvas
function drawPostureIndicators(analysis) {
  if (!canvasCtx || !analysis) return;
  
  const padding = 20;
  const boxHeight = 60;
  const boxWidth = 300;
  
  // Fondo semitransparente
  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  canvasCtx.fillRect(padding, padding, boxWidth, boxHeight);
  
  // Título
  canvasCtx.fillStyle = '#FFFFFF';
  canvasCtx.font = 'bold 16px Poppins, sans-serif';
  canvasCtx.fillText('Entrenador Virtual', padding + 10, padding + 25);
  
  // Score con color
  const scoreColor = analysis.score === 100 ? '#00FF88' : 
                     analysis.score >= 66 ? '#FFD700' : 
                     analysis.score >= 33 ? '#FFA500' : '#FF4444';
  
  canvasCtx.fillStyle = scoreColor;
  canvasCtx.font = 'bold 24px Poppins, sans-serif';
  canvasCtx.fillText(`${analysis.score}%`, padding + 220, padding + 45);
  
  // Indicadores
  const indicatorY = padding + 45;
  const indicatorSize = 12;
  const indicatorSpacing = 20;
  
  // Espalda
  canvasCtx.fillStyle = analysis.isBackStraight ? '#00FF88' : '#FF4444';
  canvasCtx.fillRect(padding + 10, indicatorY, indicatorSize, indicatorSize);
  
  // Rodillas
  canvasCtx.fillStyle = analysis.areKneesFlexed ? '#00FF88' : '#FF4444';
  canvasCtx.fillRect(padding + 10 + indicatorSpacing + indicatorSize, indicatorY, indicatorSize, indicatorSize);
  
  // Manos
  canvasCtx.fillStyle = analysis.isLoadClose ? '#00FF88' : '#FF4444';
  canvasCtx.fillRect(padding + 10 + (indicatorSpacing + indicatorSize) * 2, indicatorY, indicatorSize, indicatorSize);
}

// Función para mostrar advertencias de seguridad
function showSecurityWarning(message) {
  // Crear o actualizar el mensaje de advertencia
  let warningBox = document.getElementById('securityWarning');
  
  if (!warningBox) {
    warningBox = document.createElement('div');
    warningBox.id = 'securityWarning';
    warningBox.className = 'security-warning';
    
    // Insertar después del botón de cámara
    const cameraSection = document.getElementById('cameraSection');
    if (cameraSection) {
      cameraSection.appendChild(warningBox);
    } else {
      document.body.insertBefore(warningBox, document.body.firstChild);
    }
  }
  
  warningBox.innerHTML = `
    <div class="warning-content">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <h3>Advertencia de Seguridad</h3>
        <pre>${message}</pre>
      </div>
      <button class="warning-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
    </div>
  `;
  warningBox.style.display = 'block';
}

// Verificar soporte de cámara
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// Verificar si estamos en un contexto seguro
const isSecureContext = () => {
  // Verificar si es HTTPS, localhost o file://
  return window.isSecureContext || 
         window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.protocol === 'file:';
};

// Verificar si estamos dentro de un iframe
const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // Si hay error de acceso, probablemente estamos en iframe
  }
};

// Función para abrir en nueva ventana
function openInNewWindow() {
  const url = window.location.href;
  window.open(url, '_blank', 'width=1280,height=800');
}

// Configurar botón de cámara
if (!hasGetUserMedia()) {
  console.warn("getUserMedia() no es soportado por tu navegador");
  updateStatus('❌ Cámara no disponible en este navegador');
  webcamButton.disabled = true;
  showSecurityWarning('Tu navegador no soporta acceso a la cámara. Usa Chrome, Firefox o Edge.');
} else if (isInIframe()) {
  // CASO ESPECÍFICO: Estamos en un iframe (Rise/Articulate)
  console.warn("Aplicación cargada en iframe - Intentando acceso a cámara");
  updateStatus('⚠️ En iframe - Intentando acceder a cámara...');
  
  // Mostrar banner de advertencia
  const iframeBanner = document.getElementById('iframeBanner');
  if (iframeBanner) {
    iframeBanner.style.display = 'block';
  }
  
  // Intenta acceder a cámara en iframe
  // Si funciona, perfecto; si no, mostrará el error y opción de nueva ventana
  webcamButton.addEventListener("click", async function(event) {
    try {
      const constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Si llegamos aquí, la cámara está permitida
      stream.getTracks().forEach(track => track.stop());
      updateStatus('✅ Cámara disponible - Iniciando...');
      enableCam(event);
    } catch (error) {
      // Si falla, ofrece opción de nueva ventana
      console.warn("Acceso a cámara denegado en iframe:", error.message);
      updateStatus('⚠️ Abre en nueva ventana para usar la cámara');
      
      // Reemplazar botón con opción de nueva ventana
      webcamButton.innerHTML = `
        <span class="button-icon">🚀</span>
        <span class="button-text">Abrir en Nueva Ventana</span>
      `;
      webcamButton.removeEventListener("click", arguments.callee);
      webcamButton.addEventListener("click", openInNewWindow);
      
      showSecurityWarning(
        '🔒 DETECTADO: Estás viendo esto dentro de Rise/Articulate (iframe)\n\n' +
        '⚠️ PROBLEMA:\n' +
        'Los navegadores BLOQUEAN el acceso a la cámara en iframes por seguridad.\n\n' +
        '✅ SOLUCIÓN:\n' +
        'Haz clic en el botón "Abrir en Nueva Ventana" para usar la aplicación.\n\n' +
        '📋 PARA INSTRUCTORES (Rise 360):\n' +
        'Usa un BOTÓN DE ENLACE EXTERNO en lugar de iframe:\n' +
        '• Bloque: Botón\n' +
        '• URL: ' + window.location.href + '\n' +
        '• ✅ Marcar: "Abrir en nueva ventana"\n\n' +
        'Esto permite que los estudiantes accedan directamente sin problemas.'
      );
    }
  });
} else if (!isSecureContext()) {
  console.warn("Contexto inseguro detectado");
  updateStatus('⚠️ Contexto inseguro - Cámara bloqueada');
  showSecurityWarning(
    'IMPORTANTE: Por seguridad, los navegadores solo permiten acceso a la cámara en:\n' +
    '• Páginas HTTPS (https://)\n' +
    '• Localhost (http://localhost)\n' +
    '• Archivos locales (file://)\n\n' +
    'Si estás en Rise/Articulate, considera:\n' +
    '1. Usar GitHub Pages (https)\n' +
    '2. Compartir el enlace directo\n' +
    '3. Descargar y abrir localmente\n\n' +
    'Contexto actual: ' + window.location.protocol + '//' + window.location.host
  );
  // Aún permitir el intento, algunos navegadores pueden permitirlo
  webcamButton.addEventListener("click", enableCam);
} else {
  webcamButton.addEventListener("click", enableCam);
}

// Habilitar/deshabilitar c\u00e1mara
async function enableCam(event) {
  if (!poseLandmarker) {
    updateStatus('Espera, cargando modelo...');
    return;
  }

  if (webcamRunning === true) {
    // Detener c\u00e1mara
    webcamRunning = false;
    if (webcamButton && webcamButton.querySelector('.button-text')) {
      webcamButton.querySelector('.button-text').textContent = "Activar Cámara";
    }
    if (webcamButton) webcamButton.classList.remove('active');
    videoContainer.classList.add('hidden');
    if (challengesSection) challengesSection.classList.add('hidden');
    if (liftingTrainerSection) liftingTrainerSection.classList.add('hidden');
    updateStatus('Cámara desactivada');
    
    // Detener el stream
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  } else {
    // Iniciar c\u00e1mara
    webcamRunning = true;
    if (webcamButton && webcamButton.querySelector('.button-text')) {
      webcamButton.querySelector('.button-text').textContent = "Desactivar Cámara";
    }
    if (webcamButton) webcamButton.classList.add('active');
    videoContainer.classList.remove('hidden');
    if (challengesSection) challengesSection.classList.remove('hidden');
    if (liftingTrainerSection) liftingTrainerSection.classList.remove('hidden');
    updateStatus('Iniciando cámara...');

    // Configuración de video (resolución optimizada)
    const constraints = {
      video: {
        width: { ideal: videoWidth },
        height: { ideal: videoHeight }
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      console.log('✅ Stream de cámara obtenido correctamente');
      
      video.addEventListener("loadeddata", () => {
        console.log('✅ Video cargado y listo');
        updateStatus('Cámara activa - Detectando poses...');
        predictWebcam();
      }, { once: true });
    } catch (error) {
      console.error("Error al acceder a la c\u00e1mara:", error);
      
      // Determinar el tipo de error y mostrar mensaje específico
      let errorMessage = '';
      let detailedMessage = '';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '❌ Permiso denegado';
        detailedMessage = 'Debes permitir el acceso a la cámara cuando el navegador lo solicite.\n\n' +
                         'Para solucionarlo:\n' +
                         '1. Busca el ícono 🔒 o 🎥 en la barra de direcciones\n' +
                         '2. Permite el acceso a la cámara\n' +
                         '3. Recarga la página';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = '❌ Cámara no encontrada';
        detailedMessage = 'No se detectó ninguna cámara conectada.\n\n' +
                         'Verifica que:\n' +
                         '1. Tu cámara esté conectada\n' +
                         '2. Los drivers estén instalados\n' +
                         '3. Ninguna otra aplicación esté usando la cámara';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = '❌ Cámara en uso';
        detailedMessage = 'La cámara está siendo usada por otra aplicación.\n\n' +
                         'Cierra otras aplicaciones que puedan estar usando la cámara:\n' +
                         '• Zoom, Teams, Skype\n' +
                         '• Otras pestañas del navegador\n' +
                         '• Aplicaciones de fotos/video';
      } else if (error.name === 'SecurityError') {
        errorMessage = '🔒 Error de seguridad';
        
        // Detectar si es iframe
        const inIframe = isInIframe();
        const iframeNote = inIframe ? 
          '\n\n✅ SOLUCIÓN PARA RISE 360:\n' +
          'Pide a tu profesor que:\n' +
          '1. Reemplace el iframe por un botón con enlace externo\n' +
          '2. O use esta URL en el iframe con permisos:\n' +
          '<iframe ... allow="camera *; microphone *" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>\n\n' +
          '⚠️ O haz clic en "Abrir en Nueva Ventana" en el botón.'
          : '';
        
        detailedMessage = 'Por razones de seguridad, no se puede acceder a la cámara.\n\n' +
                         '⚠️ REQUISITOS:\n' +
                         'Los navegadores requieren HTTPS para acceder a la cámara.\n' +
                         'Esta página usa: ' + window.location.protocol + '//' + window.location.host + '\n\n' +
                         'Soluciones:\n' +
                         '1. Usa el enlace directo (abre en nueva ventana)\n' +
                         '2. Descarga el .zip y abre index.html localmente\n' +
                         iframeNote;
      } else {

        errorMessage = '❌ Error al acceder a la cámara';
        detailedMessage = 'Error: ' + error.name + '\n' + error.message + '\n\n' +
                         'Contexto: ' + window.location.protocol + '//' + window.location.host;
      }
      
      updateStatus(errorMessage);
      showSecurityWarning(detailedMessage);
      
      webcamRunning = false;
      webcamButton.querySelector('.button-text').textContent = "Activar Cámara";
      webcamButton.classList.remove('active');
      videoContainer.classList.add('hidden');
      challengesSection.classList.add('hidden');
      if (liftingTrainerSection) liftingTrainerSection.classList.add('hidden');
    }
  }
}

// Predecir poses desde webcam
async function predictWebcam() {
  // Ajustar tama\u00f1o del canvas
  if (video.videoWidth > 0) {
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
  }

  // Cambiar a modo VIDEO si es necesario
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker.setOptions({ runningMode: "VIDEO" });
  }

  let startTimeMs = performance.now();
  
  // Frame skipping: procesar 1 de cada 2 frames para mejor rendimiento
  frameSkipCounter++;
  const shouldProcess = frameSkipCounter % 2 === 0;
  
  if (lastVideoTime !== video.currentTime && shouldProcess) {
    lastVideoTime = video.currentTime;
    
    try {
      poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
        // Limpiar canvas
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Actualizar contador de poses
        detectionStats.poseCount = result.landmarks.length;
        
        // Dibujar landmarks
        const drawingUtils = new DrawingUtils(canvasCtx);
        
        for (const landmark of result.landmarks) {
          // Calcular confianza promedio
          const avgConfidence = landmark.reduce((sum, point) => 
            sum + (point.visibility || 0), 0) / landmark.length;
          detectionStats.confidence = avgConfidence;
          
          // Dibujar puntos con colores personalizados
          drawingUtils.drawLandmarks(landmark, {
            color: '#C74398',
            fillColor: '#4A3168',
            radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 8, 2)
          });
          
          // Dibujar conexiones
          drawingUtils.drawConnectors(
            landmark, 
            PoseLandmarker.POSE_CONNECTIONS,
            { color: '#C74398', lineWidth: 3 }
          );
        }
        
        canvasCtx.restore();
        updateStats();
        
        // Detectar brazos levantados y reproducir sonido (oneshot)
        if (result.landmarks.length > 0) {
          const armsUp = detectArmsUp(result.landmarks[0]);
          
          if (armsUp && !armsUpDetected) {
            // Brazos levantados por primera vez
            armsUpDetected = true;
            playArmsUpSound();
            console.log("🎵 ¡Brazos levantados! Sonido reproducido");
          } else if (!armsUp && armsUpDetected) {
            // Brazos bajados, resetear para permitir nueva detección
            armsUpDetected = false;
          }
        }
        
        // Analizar postura si el entrenador está activo
        if (liftingTrainer.enabled && result.landmarks.length > 0) {
          const analysis = analyzeLiftingPosture(result.landmarks[0]);
          if (analysis) {
            updateTrainerUI(analysis);
          }
        }
                if (detectionStats.poseCount > 0) {
          updateStatus(`\u2705 Detectando ${detectionStats.poseCount} pose(s)`);
        } else {
          updateStatus('\ud83d\udc40 Esperando persona en cuadro...');
        }
      });
    } catch (error) {
      console.error("Error en detecci\u00f3n:", error);
    }
  }

  // Continuar predicci\u00f3n si la c\u00e1mara est\u00e1 activa
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// Inicializar la aplicaci\u00f3n
createPoseLandmarker();
// Auto-iniciar cámara cuando el modelo esté listo
async function autoStartCamera() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingSubtext = document.getElementById('loadingSubtext');
  
  console.log('🔄 Iniciando proceso de auto-start...');
  
  // Esperar a que el modelo esté cargado
  const checkModel = setInterval(async () => {
    if (poseLandmarker) {
      clearInterval(checkModel);
      console.log('✅ Modelo cargado, preparando cámara...');
      
      // Actualizar mensaje
      if (loadingSubtext) loadingSubtext.textContent = 'Iniciando cámara...';
      
      // Esperar 500ms más para asegurar que todo esté listo
      setTimeout(async () => {
        console.log('🎥 Iniciando cámara automáticamente...');
        try {
          await enableCam();
          console.log('✅ Cámara iniciada correctamente');
          
          // Ocultar loading con transición
          if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
              console.log('✅ Loading overlay oculto');
            }, 300);
          }
        } catch (error) {
          console.error('❌ Error al auto-iniciar cámara:', error);
          // Ocultar loading y mostrar botón manual
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          if (cameraSection) cameraSection.style.display = 'block';
        }
      }, 500);
    }
  }, 100);
}

// Iniciar cámara automáticamente
autoStartCamera();
// Mensaje de bienvenida en consola
console.log('%c\ud83c\udf93 ISTEduca - Detecci\u00f3n de Poses con IA ', 
  'background: linear-gradient(135deg, #C74398, #4A3168); color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 5px;');
console.log('%cPowered by MediaPipe \ud83e\udd16', 
  'color: #4A3168; font-size: 14px; font-weight: bold;');

// Configurar toggle del entrenador
if (trainerToggle) {
  trainerToggle.addEventListener('change', (e) => {
    liftingTrainer.enabled = e.target.checked;
    
    if (trainerPanel) {
      if (liftingTrainer.enabled) {
        trainerPanel.classList.add('active');
      } else {
        trainerPanel.classList.remove('active');
      }
    }
    
    console.log(`Entrenador de levantamiento: ${liftingTrainer.enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
  });
}

console.log('%c Modulo: Entrenamiento de Levantamiento Seguro', 
  'color: #C74398; font-size: 12px; font-weight: bold;');// ============================================================
// SISTEMA DE CONFIGURACIÓN DE RENDIMIENTO
// ============================================================

// Configurar selector de modelo
const modelRadios = document.querySelectorAll('input[name="modelQuality"]');
const applyModelButton = document.getElementById('applyModelChange');
let pendingModelChange = null;

modelRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const selectedModel = e.target.value;
    
    if (selectedModel !== currentModel) {
      // Hay un cambio pendiente
      pendingModelChange = selectedModel;
      
      if (applyModelButton) {
        applyModelButton.style.display = 'block';
        applyModelButton.textContent = `Cambiar a ${selectedModel.toUpperCase()} (${webcamRunning ? 'reinicia cámara' : 'aplicar'})`;
      }
    } else {
      // Volvió al modelo actual
      pendingModelChange = null;
      if (applyModelButton) {
        applyModelButton.style.display = 'none';
      }
    }
  });
});

// Aplicar cambio de modelo
if (applyModelButton) {
  applyModelButton.addEventListener('click', async () => {
    if (!pendingModelChange) return;
    
    // Si la cámara está activa, hay que reiniciarla
    const wasRunning = webcamRunning;
    
    if (wasRunning) {
      // Detener cámara
      updateStatus('Deteniendo cámara...');
      webcamRunning = false;
      webcamButton.querySelector('.button-text').textContent = "Activar Cámara";
      webcamButton.classList.remove('active');
      videoContainer.classList.add('hidden');
      challengesSection.classList.add('hidden');
      if (liftingTrainerSection) liftingTrainerSection.classList.add('hidden');
      
      // Detener el stream
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Cargar nuevo modelo
    updateStatus(`Cambiando a modelo ${pendingModelChange.toUpperCase()}...`);
    await createPoseLandmarker(pendingModelChange);
    
    // Ocultar botón de aplicar
    applyModelButton.style.display = 'none';
    pendingModelChange = null;
    
    // Reiniciar cámara si estaba activa
    if (wasRunning) {
      updateStatus('Reiniciando cámara...');
      await new Promise(resolve => setTimeout(resolve, 500));
      enableCam();
    } else {
      updateStatus(`Modelo ${currentModel.toUpperCase()} listo`);
    }
    
    console.log(`✅ Modelo cambiado a: ${currentModel.toUpperCase()}`);
  });
}