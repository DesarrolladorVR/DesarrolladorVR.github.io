// ISTEduca - Detecci\u00f3n de Poses con MediaPipe
// Sistema de detecci\u00f3n de poses mejorado con informaci\u00f3n educativa

import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision;

// Configuración de Colores de Tracking
const TRACKING_COLORS = {
  LANDMARK_BORDER: '#ff00a6', // Pink IST
  LANDMARK_FILL: '#7300ff',   // Purple IST
  CONNECTOR: '#ff00a6'        // Pink IST
};

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

// ============================================================
// GESTOR DE EXPERIENCIA (NUEVO)
// ============================================================
// ============================================================
// FUNCIONES DE DETECCIÓN (NUEVAS)
// ============================================================

function detectStraightBack(landmarks) {
  // Angulo de espalda < 20 grados es muy recto
  const angle = calculateBackAngle(landmarks);
  return angle < 20; 
}

function detectOpenPosture(landmarks) {
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  // Manos visibles
  if (leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) return false;

  // Manos abajo de hombros
  if (leftWrist.y < leftShoulder.y || rightWrist.y < rightShoulder.y) return false;

  // Manos separadas (no cruzadas)
  // Distancia X entre muñecas razonable (> ancho de hombros/2)
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const wristDist = Math.abs(leftWrist.x - rightWrist.x);

  return wristDist > shoulderWidth * 0.5;
}

function detectSmile(landmarks) {
  // Aproximación con PoseLandmarks (Mouth corners 9, 10 vs Eyes 3, 6)
  const mouthLeft = landmarks[9];
  const mouthRight = landmarks[10];
  
  // Usar pupilas o ojos externos
  const eyeLeft = landmarks[3]; // Outer
  const eyeRight = landmarks[6]; // Outer

  if (!mouthLeft || !mouthRight || !eyeLeft || !eyeRight) return false;

  const mouthWidth = Math.hypot(mouthLeft.x - mouthRight.x, mouthLeft.y - mouthRight.y);
  const eyeWidth = Math.hypot(eyeLeft.x - eyeRight.x, eyeLeft.y - eyeRight.y);

  // Ratio experimental
  const ratio = mouthWidth / eyeWidth;
  
  return ratio > 0.55; // Ajustable
}

const ExperienceManager = {
  currentPhase: 0, 
  phaseStartTime: 0,
  currentAudio: null,
  
  phases: {
      1: { 
        id: 1, 
        name: 'Introducción', 
        text: '"Hola. Te contamos que, según la neurociencia, aprender no es solo pensar; es también respirar, sentir, atender y conectarse con el propio cuerpo. Por esto, te invitamos a vivir una pequeña experiencia que facilite tu aprendizaje."',
        audioSrc: 'voiceoff/intro.wav', 
        nextTrigger: 'auto_after_audio' 
      },
      2: { 
        id: 2, 
        name: 'Postura', 
        text: '"Comencemos. Siéntate cómodamente, con los pies afirmados en el suelo y tu espalda derecha."',
        audioSrc: 'voiceoff/postura_1.wav', 
        trigger: 'pose', 
        check: detectStraightBack 
      },
      3: { 
        id: 3, 
        name: 'Validación Postura', 
        text: '"Muy bien, mantén esa postura."',
        audioSrc: 'voiceoff/postura_2.wav', 
        trigger: 'time',
        delay: 2000
      },
      4: { 
        id: 4, 
        name: 'Respiración', 
        text: '"Ahora, realiza una o dos respiraciones profundas y lentas. Inhalando suavemente por la nariz... y exhalando por la boca. Siente cómo tu cuerpo se oxigena."',
        audioSrc: 'voiceoff/respiracion.wav', 
        trigger: 'time', 
        delay: 8000 
      },
      5: { 
        id: 5, 
        name: 'Conexión', 
        text: '"En este estado de calma, conéctate con una emoción de apertura y confianza. Visualiza esa seguridad que ayuda a tu proceso de aprendizaje."',
        audioSrc: 'voiceoff/conexion.wav', 
        trigger: 'pose', 
        check: detectOpenPosture 
      },
      6: { 
        id: 6, 
        name: 'Gesto Final', 
        text: '"Finalmente, mira la pantalla y sonríe con ganas."',
        audioSrc: 'voiceoff/sonrisa.wav', 
        trigger: 'pose', 
        check: detectSmile 
      },
      7: { 
        id: 7, 
        name: 'Cierre', 
        text: '"Ahora que escuchaste la campana, estás listo o lista para comenzar."',
        audioSrc: 'voiceoff/cierre.wav', 
        effectSrc: 'voiceoff/campana.wav', 
        nextTrigger: 'end' 
      }
  },

  playAudio(src) {
      if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
      }
      return new Promise((resolve) => {
        this.currentAudio = new Audio(src);
        // Cuando termine el audio, resolver
        this.currentAudio.onended = () => resolve();
        // Si hay error, resolver igual para no bloquear
        this.currentAudio.onerror = () => { console.log('Error audio', src); resolve(); };
        this.currentAudio.play().catch(e => { console.log("Audio play error:", e); resolve(); });
      });
  },

  playEffect(src) {
    const effect = new Audio(src);
    effect.play().catch(e => console.log("Effect play error:", e));
  },

  update(landmarks) {
      const now = Date.now();
      
      // Fase 0 -> 1: Detección inicial
      if (this.currentPhase === 0) {
          if (landmarks) {
              this.transitionTo(1);
          }
          return;
      }

      // Lógica de fases
      const phase = this.phases[this.currentPhase];
      if (!phase) return;
      
      if (phase.trigger === 'pose' && phase.check) {
          if (phase.check(landmarks)) {
              this.transitionTo(this.currentPhase + 1);
          }
      } else if (phase.trigger === 'time') {
          if (now - this.phaseStartTime > phase.delay) {
               this.transitionTo(this.currentPhase + 1);
          }
      }
  },

  async transitionTo(phaseId) {
      if (this.currentPhase === phaseId) return;
      
      this.currentPhase = phaseId;
      this.phaseStartTime = Date.now();
      console.log(`🌟 Transición de Fase: ${phaseId}`);
      
      const phase = this.phases[phaseId];
      if (!phase) return;
      
      showPhaseNotification(phase.name);
      updateSubtitle(phase.text);

      if (phase.effectSrc) {
        this.playEffect(phase.effectSrc);
      }

      if (phase.audioSrc) {
          await this.playAudio(phase.audioSrc);
          
          // Auto-advance triggers (like intro)
          if (phase.nextTrigger === 'auto_after_audio') {
             this.transitionTo(phaseId + 1);
          }
      }
  },
  
  reset() {
      this.currentPhase = 0;
      if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
      }
      updateSubtitle('');
  }
};

function updateSubtitle(text) {
  const subtitleEl = document.getElementById('subtitleText');
  if (subtitleEl) {
    if (text) {
      subtitleEl.textContent = text;
      subtitleEl.scrollTop = 0;
      subtitleEl.classList.add('active');
    } else {
      subtitleEl.classList.remove('active');
      setTimeout(() => subtitleEl.textContent = '', 500);
    }
  }
}

function showPhaseNotification(text) {
    // Reutilizar el status u otro elemento UI
    const notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.background = '#4A3168';
    notif.style.color = 'white';
    notif.style.padding = '15px 25px';
    notif.style.borderRadius = '10px';
    notif.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    notif.style.zIndex = '1000';
    notif.style.animation = 'fadeIn 0.5s';
    notif.innerHTML = `<strong>Fase Actual:</strong><br>${text}`;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s';
        setTimeout(() => notif.remove(), 500);
    }, 4000);
}

function selectModelByPerformance() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isMobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);

  if (!isMobile && cores >= 8 && memory >= 8) return 'full';
  if (!isMobile && cores >= 6 && memory >= 6) return 'full';
  return 'lite';
}

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

function detectHandsOnChest(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  // Centro del pecho (aprox)
  const chestX = (leftShoulder.x + rightShoulder.x) / 2;
  const chestY = (leftShoulder.y + rightShoulder.y) / 2 + 0.15; // Un poco abajo de los hombros

  // Distancia max permitida
  const threshold = 0.2; 

  const leftDist = Math.hypot(leftWrist.x - chestX, leftWrist.y - chestY);
  const rightDist = Math.hypot(rightWrist.x - chestX, rightWrist.y - chestY);

  return leftDist < threshold && rightDist < threshold;
}

function detectNeutral(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  // Muñecas abajo de las caderas (aprox) o simplemente abajo de los hombros significativamente
  // Y aumenta hacia abajo.
  const handsDown = leftWrist.y > leftShoulder.y + 0.3 && rightWrist.y > rightShoulder.y + 0.3;
  const handsCloseToBody = Math.abs(leftWrist.x - leftShoulder.x) < 0.2 && Math.abs(rightWrist.x - rightShoulder.x) < 0.2;

  return handsDown && handsCloseToBody;
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
      // Actualizar loading: solicitar permiso
      const loadingOverlay = document.getElementById('loadingOverlay');
      const loadingText = document.getElementById('loadingText');
      const loadingSubtext = document.getElementById('loadingSubtext');
      const loadingIcon = document.querySelector('.loading-icon');
      
      if (loadingIcon) loadingIcon.className = 'loading-spinner';
      if (loadingText) loadingText.textContent = 'Accediendo a la cámara...';
      if (loadingSubtext) loadingSubtext.innerHTML = 'Esperando permiso del navegador...';
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Actualizar loading: cámara obtenida
      if (loadingText) loadingText.textContent = 'Cargando cámara...';
      if (loadingSubtext) loadingSubtext.innerHTML = 'Inicializando sistema de detección';
      
      video.srcObject = stream;
      console.log('✅ Stream de cámara obtenido correctamente');
      
      video.addEventListener("loadeddata", () => {
        console.log('✅ Video cargado y listo');
        updateStatus('Cámara activa - Detectando poses...');
        predictWebcam();
      }, { once: true });
    } catch (error) {
      console.error("❌ Error al acceder a la cámara:", error);
      
      // Mantener el loading overlay visible y mostrar error en el mismo diseño
      const loadingOverlay = document.getElementById('loadingOverlay');
      const loadingText = document.getElementById('loadingText');
      const loadingSubtext = document.getElementById('loadingSubtext');
      const loadingIcon = document.querySelector('.loading-icon, .loading-spinner');
      
      // Determinar el tipo de error y mostrar mensaje específico
      let errorIcon = '❌';
      let errorTitle = '';
      let errorInstructions = '';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorIcon = '🔒';
        errorTitle = 'Permiso de cámara denegado';
        errorInstructions = 'Para usar la detección de poses, necesitas permitir el acceso a la cámara.<br><br>' +
                           '<strong>Cómo solucionarlo:</strong><br>' +
                           '1. Busca el ícono 🔒 o 🎥 en la barra de direcciones<br>' +
                           '2. Haz clic y selecciona "Permitir"<br>' +
                           '3. Recarga la página (F5)';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorIcon = '📷';
        errorTitle = 'No se encontró ninguna cámara';
        errorInstructions = '<strong>Verifica que:</strong><br>' +
                           '• Tu cámara esté conectada<br>' +
                           '• Los drivers estén instalados correctamente<br>' +
                           '• La cámara funcione en otras aplicaciones';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorIcon = '⚠️';
        errorTitle = 'Cámara en uso';
        errorInstructions = 'La cámara está siendo usada por otra aplicación.<br><br>' +
                           '<strong>Cierra estas aplicaciones:</strong><br>' +
                           '• Zoom, Teams, Skype, Google Meet<br>' +
                           '• Otras pestañas del navegador con cámara<br>' +
                           '• Aplicaciones de fotos o video';
      } else if (error.name === 'SecurityError') {
        errorIcon = '🔐';
        errorTitle = 'Error de seguridad';
        
        const inIframe = isInIframe();
        errorInstructions = 'Los navegadores requieren <strong>HTTPS</strong> para acceder a la cámara.<br><br>' +
                           'Esta página usa: <code>' + window.location.protocol + '//' + window.location.host + '</code><br><br>';
        
        if (inIframe) {
          errorInstructions += '<strong>Solución para Rise 360:</strong><br>' +
                              '• Haz clic en "Abrir en Nueva Ventana"<br>' +
                              '• O pide al instructor que configure permisos del iframe';
        } else {
          errorInstructions += '<strong>Soluciones:</strong><br>' +
                              '1. Usa HTTPS en lugar de HTTP<br>' +
                              '2. Abre desde localhost<br>' +
                              '3. Descarga y abre el archivo localmente';
        }
      } else {
        errorIcon = '❌';
        errorTitle = 'Error al acceder a la cámara';
        errorInstructions = 'Error: <code>' + error.name + '</code><br>' +
                           error.message + '<br><br>' +
                           'Intenta recargar la página o usa otro navegador.';
      }
      
      // Actualizar el loading overlay con el mensaje de error
      if (loadingIcon) {
        loadingIcon.className = 'loading-icon';
        loadingIcon.textContent = errorIcon;
      }
      if (loadingText) loadingText.textContent = errorTitle;
      if (loadingSubtext) loadingSubtext.innerHTML = errorInstructions;
      
      // Asegurar que el overlay permanezca visible
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
      }
      
      webcamRunning = false;
      updateStatus(errorTitle);
      
      console.log('ℹ️ Error mostrado en loading overlay');
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
            color: TRACKING_COLORS.LANDMARK_BORDER,
            fillColor: TRACKING_COLORS.LANDMARK_FILL,
            radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 8, 2)
          });
          
          // Dibujar conexiones
          drawingUtils.drawConnectors(
            landmark, 
            PoseLandmarker.POSE_CONNECTIONS,
            { color: TRACKING_COLORS.CONNECTOR, lineWidth: 3 }
          );
        }
        
        canvasCtx.restore();
        updateStats();
        
        // GESTOR DE EXPERIENCIA (Actualización)
        if (result.landmarks.length > 0) {
           ExperienceManager.update(result.landmarks[0]);
        } else {
           // Si se pierde el usuario mucho tiempo, ¿resetear?
           // Por ahora no reseteamos para no cortar la experiencia si se mueve un poco.
        }

        /* LÓGICA ANTERIOR COMENTADA PARA EVITAR CONFLICTOS
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
        */
        
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

// Inicializar la aplicación con selección automática según rendimiento del navegador
const autoSelectedModel = selectModelByPerformance();
console.log('⚙️ Modelo seleccionado automáticamente:', autoSelectedModel);
createPoseLandmarker(autoSelectedModel);
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
      
      // Actualizar mensaje inicial
      if (loadingSubtext) loadingSubtext.innerHTML = 'Modelo de IA cargado. Preparando acceso a cámara...';
      
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
          // El error ya se maneja dentro de enableCam mostrándolo en el loading overlay
          // No necesitamos hacer nada adicional aquí
        }
      }, 500);
    }
  }, 100);
}

// Iniciar cámara automáticamente
autoStartCamera();
// Mensaje de bienvenida en consola
console.log('%c\ud83c\udf93 ISTEduca - Detecci\u00f3n de Poses con IA ', 
  'background: linear-gradient(135deg, #ff00a6, #7300ff); color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 5px;');
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
  'color: #ff00a6; font-size: 12px; font-weight: bold;');// ============================================================
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