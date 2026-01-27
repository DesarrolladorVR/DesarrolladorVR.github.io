import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { TRACKING_COLORS } from '../config.js';

const { DrawingUtils, PoseLandmarker } = vision;

// ============================================================
// ELEMENTOS DOM CACHEADOS
// ============================================================
const elements = {
  calibrationOverlay: document.getElementById('calibrationOverlay'),
  calibrationPanel: document.getElementById('calibrationPanel'),
  calibrationStatus: document.getElementById('calibrationStatus'),
  faceGuide: document.querySelector('.face-guide'),
  shoulderGuide: document.querySelector('.shoulder-guide'),
  subtitleText: document.getElementById('subtitleText'),
  feedbackElement: document.getElementById('feedbackMessage'),
  scoreElement: document.getElementById('scoreValue'),
  backAngleElement: document.getElementById('backAngle'),
  kneeAngleElement: document.getElementById('kneeAngle'),
  handDistElement: document.getElementById('handDist'),
  securityWarning: document.getElementById('securityWarning'),
  validationOverlay: document.getElementById('validationOverlay'),
  validationCircle: document.getElementById('validationCircle'),
  progressOverlay: document.getElementById('progressOverlay'),
  phaseName: document.getElementById('phaseName'),
  phaseIcon: document.getElementById('phaseIcon'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressPercentage: document.getElementById('progressPercentage'),
  holdFeedback: document.getElementById('holdFeedback'),
  holdTimer: document.getElementById('holdTimer'),
  confidenceValue: document.getElementById('confidenceValue'),
  poseValue: document.getElementById('poseValue'),
  statusElement: document.getElementById('status'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingText: document.getElementById('loadingText'),
  loadingSubtext: document.getElementById('loadingSubtext'),
  loadingIcon: document.querySelector('.loading-icon'),
  webcamButton: document.getElementById('webcamButton'),
  videoContainer: document.getElementById('videoContainer'),
  challengesSection: document.getElementById('challenges'),
  liftingTrainerSection: document.getElementById('liftingTrainer'),
  canvasElement: document.getElementById("output_canvas"),
  video: document.getElementById("webcam")
};

let canvasCtx = null;
if (elements.canvasElement) {
    canvasCtx = elements.canvasElement.getContext("2d");
}

let drawingUtils = null;
if (canvasCtx) {
    drawingUtils = new DrawingUtils(canvasCtx);
}

// Estado local
const calibrationFeedbackState = {
  soundPlayed: false
};

// ============================================================
// AUDIO FEEDBACK (Simple UI Sounds)
// ============================================================

function playCalibrationSound() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    
    // Conectar nodos
    oscillator.connect(gain);
    gain.connect(context.destination);
    
    // Sonido: nota aguda (validación correcta)
    oscillator.frequency.value = 880; // La5
    oscillator.type = 'sine';
    
    // Envelope: ataque rápido, decaimiento
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
  } catch (e) {
    console.log('Error al reproducir sonido de calibración:', e);
  }
}

// ============================================================
// CALIBRACIÓN OVERLAY
// ============================================================

export function showCalibrationOverlay() {
  if (elements.calibrationOverlay) elements.calibrationOverlay.classList.remove('hidden');
  if (elements.calibrationPanel) elements.calibrationPanel.style.display = 'flex';
}

export function hideCalibrationOverlay() {
  if (elements.calibrationOverlay) elements.calibrationOverlay.classList.add('hidden');
  if (elements.calibrationPanel) elements.calibrationPanel.style.display = 'none';
}

export function updateCalibrationStatus(isCorrect, progress = 0) {
  if (!elements.calibrationStatus) return;
  
  const iconEl = elements.calibrationStatus.querySelector('.status-icon');
  const textEl = elements.calibrationStatus.querySelector('.status-text');
  
  if (isCorrect) {
    elements.calibrationStatus.classList.add('success');
    if (iconEl) iconEl.textContent = '✅';
    const percentage = Math.round((progress / 2000) * 100);
    if (textEl) textEl.textContent = `¡Perfecto! Mantén la posición (${percentage}%)`;
  } else {
    elements.calibrationStatus.classList.remove('success');
    if (iconEl) iconEl.textContent = '⏳';
    if (textEl) textEl.textContent = 'Posiciónate en las guías';
  }
}

export function updateCalibrationFeedback(status) {
  // status puede ser boolean (legacy) u objeto { result, faceValid, shouldersValid }
  let faceOk = false;
  let shouldersOk = false;
  let isTotalSuccess = false;

  if (typeof status === 'object' && status !== null) {
      faceOk = status.faceValid;
      shouldersOk = status.shouldersValid;
      isTotalSuccess = status.result;
  } else {
      faceOk = status;
      shouldersOk = status;
      isTotalSuccess = status;
  }

  if (elements.faceGuide) {
    if (faceOk) {
        elements.faceGuide.classList.add('correct');
        elements.faceGuide.classList.remove('incorrect');
    } else {
        elements.faceGuide.classList.remove('correct');
        elements.faceGuide.classList.add('incorrect');
    }
  }
  
  if (elements.shoulderGuide) {
    if (shouldersOk) {
        elements.shoulderGuide.classList.add('correct');
        elements.shoulderGuide.classList.remove('incorrect');
    } else {
        elements.shoulderGuide.classList.remove('correct');
        elements.shoulderGuide.classList.add('incorrect');
    }
  }
  
  // Reproducir sonido de validación (una sola vez por detección correcta TOTAL)
  if (isTotalSuccess && !calibrationFeedbackState.soundPlayed) {
    playCalibrationSound();
    calibrationFeedbackState.soundPlayed = true;
  } else if (!isTotalSuccess) {
    calibrationFeedbackState.soundPlayed = false;
  }
}

// ============================================================
// NOTIFICACIONES Y TEXTOS
// ============================================================

export function updateSubtitle(text) {
  if (elements.subtitleText) {
    if (text) {
        elements.subtitleText.textContent = text;
        elements.subtitleText.scrollTop = 0;
        elements.subtitleText.classList.add('active');
    } else {
        elements.subtitleText.classList.remove('active');
      setTimeout(() => { if(elements.subtitleText) elements.subtitleText.textContent = ''; }, 500);
    }
  }
}

export function showPhaseNotification(text) {
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

export function updateStatus(status) {
  if (elements.statusElement) {
    elements.statusElement.textContent = status;
  }
}

// ============================================================
// ENTRENADOR UI
// ============================================================

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

export function updateTrainerUI(analysis, checkEnabled) {
  if (!analysis || !checkEnabled()) return;
  
  if (elements.feedbackElement) {
    elements.feedbackElement.textContent = analysis.feedback;
    elements.feedbackElement.className = 'feedback-message';
    if (analysis.isPerfect) {
        elements.feedbackElement.classList.add('perfect');
    } else if (analysis.score >= 66) {
        elements.feedbackElement.classList.add('good');
    } else if (analysis.score >= 33) {
        elements.feedbackElement.classList.add('warning');
    } else {
        elements.feedbackElement.classList.add('danger');
    }
  }
  
  if (elements.scoreElement) {
    elements.scoreElement.textContent = analysis.score + '%';
    elements.scoreElement.className = 'metric-value';
    if (analysis.score === 100) {
        elements.scoreElement.classList.add('perfect');
    } else if (analysis.score >= 66) {
        elements.scoreElement.classList.add('good');
    } else {
        elements.scoreElement.classList.add('warning');
    }
  }
  
  if (elements.backAngleElement) {
    elements.backAngleElement.textContent = analysis.backAngle + '°';
    elements.backAngleElement.className = 'metric-value ' + (analysis.isBackStraight ? 'good' : 'warning');
  }
  
  if (elements.kneeAngleElement) {
    elements.kneeAngleElement.textContent = analysis.kneeAngle + '°';
    elements.kneeAngleElement.className = 'metric-value ' + (analysis.areKneesFlexed ? 'good' : 'warning');
  }
  
  if (elements.handDistElement) {
    elements.handDistElement.textContent = analysis.handDistance + ' cm';
    elements.handDistElement.className = 'metric-value ' + (analysis.isLoadClose ? 'good' : 'warning');
  }
  
  drawPostureIndicators(analysis);
}

// ============================================================
// PROGRESS & VALIDATION OVERLAYS
// ============================================================

export function updateValidationOverlay(isSuccess) {
  if (!elements.validationOverlay || !elements.validationCircle) return;
  const label = elements.validationOverlay.querySelector('.validation-label');
  
  elements.validationOverlay.classList.remove('hidden');
  elements.validationCircle.classList.remove('success', 'warning', 'error');
  
  if (isSuccess === true) {
    elements.validationCircle.classList.add('success');
    if (label) {
        label.textContent = "¡Perfecto!";
        label.style.color = "#00ff88";
    }
  } else if (isSuccess === false) {
    elements.validationCircle.classList.add('warning');
    if (label) {
        label.textContent = "Ajustando...";
        label.style.color = "#ffaa00";
    }
  } else {
    elements.validationCircle.classList.add('error');
    if (label) {
        label.textContent = "Escaneando";
        label.style.color = "white";
    }
  }
}

export function hideValidationOverlay() {
  if (elements.validationOverlay) elements.validationOverlay.classList.add('hidden');
}

export function showProgressOverlay() {
  if (elements.progressOverlay) elements.progressOverlay.classList.remove('hidden');
}

export function hideProgressOverlay() {
  if (elements.progressOverlay) elements.progressOverlay.classList.add('hidden');
}

export function updateProgressOverlay(progressInfo, stats, currentPhaseIndex) {
  if (!progressInfo) {
    hideProgressOverlay();
    return;
  }
  
  if (currentPhaseIndex === 0) {
    hideProgressOverlay();
    return;
  }
  
  showProgressOverlay();
  
  const phaseIcons = {
    0: '📏', 1: '👋', 2: '🪑', 3: '⏸️', 4: '💨', 5: '🤝', 6: '😊', 7: '🔔'
  };
  
  if (elements.phaseName) elements.phaseName.textContent = progressInfo.name || 'Fase';
  if (elements.phaseIcon) elements.phaseIcon.textContent = phaseIcons[currentPhaseIndex] || '🎯';
  
  if (progressInfo.total && progressInfo.current !== undefined) {
    const percentage = Math.min((progressInfo.current / progressInfo.total) * 100, 100);
    
    if (elements.progressBarFill) {
        elements.progressBarFill.style.width = percentage + '%';
        elements.progressBarFill.classList.remove('warning', 'error');
      if (progressInfo.isValid === false) {
        elements.progressBarFill.classList.add('warning');
      } else if (progressInfo.isValid === undefined) {
        elements.progressBarFill.classList.add('error');
      }
    }
    
    if (elements.progressPercentage) {
        elements.progressPercentage.textContent = Math.round(percentage) + '%';
    }
    
    if (elements.holdFeedback && elements.holdTimer && progressInfo.current > 0) {
        elements.holdFeedback.style.display = 'block';
      const currentSeconds = (progressInfo.current / 1000).toFixed(1);
      const totalSeconds = (progressInfo.total / 1000).toFixed(1);
      elements.holdTimer.textContent = `${currentSeconds}s / ${totalSeconds}s`;
    } else if (elements.holdFeedback) {
        elements.holdFeedback.style.display = 'none';
    }
  }
  
  if (stats) {
    if (elements.confidenceValue && stats.confidence !== undefined) {
        elements.confidenceValue.textContent = Math.round(stats.confidence * 100) + '%';
    }
    
    if (elements.poseValue && stats.poseCount !== undefined) {
        elements.poseValue.textContent = stats.poseCount > 0 ? '✓' : '—';
    }
  }
}

// ============================================================
// CANVAS DRAWING
// ============================================================

export function clearCanvas() {
    if (!canvasCtx || !elements.canvasElement) return;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, elements.canvasElement.width, elements.canvasElement.height);
}

export function drawSkeleton(landmarks, currentColors) {
    if (!drawingUtils || !landmarks) return;
    
    // Dibujar landmarks con colores dinámicos
    drawingUtils.drawLandmarks(landmarks, {
        color: currentColors.LANDMARK_BORDER,
        fillColor: currentColors.LANDMARK_FILL,
        radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 8, 2)
    });

    // Dibujar conexiones del esqueleto
    drawingUtils.drawConnectors(
        landmarks, 
        PoseLandmarker.POSE_CONNECTIONS,
        { color: currentColors.CONNECTOR, lineWidth: 3 }
    );
}

export function restoreCanvas() {
    if(canvasCtx) canvasCtx.restore();
}

export function resizeCanvas(width, height) {
    if (elements.canvasElement) {
        elements.canvasElement.width = width;
        elements.canvasElement.height = height;
    }
}

export function showSecurityWarning(message) {
  let warningBox = document.getElementById('securityWarning');
  
  if (!warningBox) {
    warningBox = document.createElement('div');
    warningBox.id = 'securityWarning';
    warningBox.className = 'security-warning';
    
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

// ============================================================
// LIGHTING WARNING UI
// ============================================================

export function showLightingWarning() {
    let warning = document.getElementById('lightingWarning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'lightingWarning';
        warning.className = 'lighting-warning';
        warning.innerHTML = `
            <span>💡</span>
            <span>Detectamos poca luz o contraluz. Evita luces fuertes detrás de ti.</span>
        `;
        
        // Insert inside video wrapper if possible, else body
        const wrapper = document.querySelector('.video-wrapper');
        if (wrapper) wrapper.appendChild(warning);
        else document.body.appendChild(warning);
    }
    warning.classList.remove('hidden');
}

export function hideLightingWarning() {
    const warning = document.getElementById('lightingWarning');
    if (warning) warning.classList.add('hidden');
}
