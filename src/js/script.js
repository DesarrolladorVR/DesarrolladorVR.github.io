// ISTEduca - Entry Point
// Sistema de detección de poses modularizado

import { TRACKING_COLORS, VIDEO_CONFIG } from './config.js';
import * as PoseEngine from './modules/PoseEngine.js';
import * as UIManager from './modules/UIManager.js';
import { ExperienceManager } from './modules/ExperienceManager.js';
import * as Biomechanics from './modules/Biomechanics.js'; // Para lifting trainer y extras

// ============================================================
// ESTADO GLOBAL
// ============================================================

let webcamRunning = false;
let lastVideoTime = -1;
let frameSkipCounter = 0;
let liftingTrainer = {
    enabled: false
};


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================



// ============================================================
// BUCLE PRINCIPAL (PREDICCIÓN)
// ============================================================

async function predictWebcam() {
    const video = document.getElementById("webcam");
    if (!video) return;

    // Ajustar canvas si cambió el video
    if (video.videoWidth > 0 && UIManager.resizeCanvas) {
        UIManager.resizeCanvas(video.videoWidth, video.videoHeight);
    }

    // Gestionar modo
    // (PoseEngine lo maneja internamente generalmente, pero aquí podemos forzar si es necesario)

    let startTimeMs = performance.now();
    
    // Frame skipping
    frameSkipCounter++;
    const shouldProcess = frameSkipCounter % 2 === 0;

    if (lastVideoTime !== video.currentTime && shouldProcess) {
        lastVideoTime = video.currentTime;
        
        PoseEngine.detectForVideo(video, startTimeMs, (result) => {
            // Limpiar canvas
            UIManager.clearCanvas();
            
            let progressInfo = null;
            let smoothed = null;
            
            if (result.landmarks && result.landmarks.length > 0) {
                // Suavizado
                // Nota: smoothLandmarks en Biomechanics requiere historia.
                // Como es stateless, deberíamos mantener historia aquí o en PoseEngine.
                // Por simplicidad, y dado que ExperienceManager no lo maneja, 
                // vamos a instanciar un 'smoother' o mantenerlo aquí.
                // OJO: Biomechanics.smoothLandmarks toma history array.
                if (!window.landmarkHistory) window.landmarkHistory = [];
                smoothed = Biomechanics.smoothLandmarks(result.landmarks[0], window.landmarkHistory);
                
                // 1. UPDATE EXPERIENCE MANAGER
                progressInfo = ExperienceManager.update(smoothed);
                
                // 2. UPDATE LIFTING TRAINER (si activo)
                if (liftingTrainer.enabled) {
                    const analysis = Biomechanics.analyzeLiftingPosture(smoothed);
                    UIManager.updateTrainerUI(analysis, () => liftingTrainer.enabled);
                }


                
                // Stats
                UIManager.updateStatus(`✅ Detectando pose`);
                
            } else {
                UIManager.updateStatus('👀 Esperando persona...');
            }
            
            // DIBUJADO
            if (smoothed) {
                let currentColors = TRACKING_COLORS.DEFAULT;
                if (progressInfo && progressInfo.name && !progressInfo.isAudioPlaying && !progressInfo.isWaiting) {
                    currentColors = progressInfo.isValid ? TRACKING_COLORS.SUCCESS : TRACKING_COLORS.WARNING;
                }
                
                UIManager.drawSkeleton(smoothed, currentColors);
                
                // Actualizar UI overlays
                if (progressInfo) {
                    if (progressInfo.isValid !== undefined && !progressInfo.isAudioPlaying && !progressInfo.isWaiting) {
                        UIManager.updateValidationOverlay(progressInfo.isValid);
                    } else {
                        UIManager.hideValidationOverlay();
                    }
                    UIManager.updateProgressOverlay(progressInfo, { poseCount: 1 }, ExperienceManager.currentPhase);
                } else {
                    UIManager.hideProgressOverlay();
                }
            } else {
                UIManager.hideValidationOverlay();
                UIManager.hideProgressOverlay();
            }
            
            UIManager.restoreCanvas();
        });
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// ============================================================
// CONTROL DE CÁMARA
// ============================================================

async function enableCam() {
    const video = document.getElementById("webcam");
    if (!PoseEngine.getPoseLandmarker()) {
        UIManager.updateStatus('Cargando modelo...');
        return;
    }

    if (webcamRunning) {
        webcamRunning = false;
        // Update UI logic for disabled cam
        const btn = document.getElementById('webcamButton');
        if (btn) btn.classList.remove('active');
        if (btn) btn.querySelector('.button-text').textContent = "Activar Cámara";
        
        const container = document.getElementById('videoContainer');
        if (container) container.classList.add('hidden');
        
        // Stop stream
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
    } else {
        webcamRunning = true;
        // Update UI logic for enabled cam
        const btn = document.getElementById('webcamButton');
        if (btn) btn.classList.add('active');
        if (btn) btn.querySelector('.button-text').textContent = "Desactivar Cámara";
        
        const container = document.getElementById('videoContainer');
        if (container) container.classList.remove('hidden');

        UIManager.updateStatus('Iniciando cámara...');
        
        const constraints = {
            video: {
                width: { ideal: VIDEO_CONFIG.WIDTH }, 
                height: { ideal: VIDEO_CONFIG.HEIGHT }
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.addEventListener("loadeddata", () => {
                UIManager.updateStatus('Cámara activa');
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                predictWebcam();
            }, { once: true });
        } catch (error) {
            console.error(error);
            UIManager.showSecurityWarning('Error al acceder a la cámara: ' + error.message);
            webcamRunning = false;
        }
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

async function main() {
    console.log('🚀 Iniciando ISTEduca Modular...');
    
    // Init Experience Manager
    ExperienceManager.init();
    
    // Init PoseEngine
    const autoModel = PoseEngine.selectModelByPerformance();
    await PoseEngine.initializePoseLandmarker(autoModel);
    
    // Botones
    const webcamButton = document.getElementById("webcamButton");
    if (webcamButton) {
        webcamButton.addEventListener("click", enableCam);
    }

    const trainerToggle = document.getElementById("trainerToggle");
    if (trainerToggle) {
        trainerToggle.addEventListener('change', (e) => {
            liftingTrainer.enabled = e.target.checked;
            const panel = document.getElementById('trainerPanel');
            if (panel) {
                 if (liftingTrainer.enabled) panel.classList.add('active');
                 else panel.classList.remove('active');
            }
        });
    }

    // Auto-start camera immediately
    const loadingSubtext = document.getElementById('loadingSubtext');
    if (loadingSubtext) loadingSubtext.innerHTML = 'Modelo IA cargado. Iniciando cámara...';
    
    await enableCam();
}

// Start
main();