// ISTEduca - Entry Point
// Sistema de detección de poses modularizado

import { TRACKING_COLORS, VIDEO_CONFIG, isMobile } from './config.js';
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
    
    // Frame skipping logic
    // Mobile: Process ~10 FPS (Skip 2 frames if 30fps)
    // Desktop: Process ~15-30 FPS (Skip 1 or 0)
    
    // Using imported isMobile from config.js
    const skipThreshold = isMobile ? 3 : 2; 

    frameSkipCounter++;
    const shouldProcess = frameSkipCounter % skipThreshold === 0;

    if (lastVideoTime !== video.currentTime && shouldProcess) {
        lastVideoTime = video.currentTime;
        
        PoseEngine.detectForVideo(video, startTimeMs, (result) => {
            // Limpiar canvas
            UIManager.clearCanvas();
            
            let progressInfo = null;
            let smoothed = null;
            
            if (result.landmarks && result.landmarks.length > 0) {
                // Suavizado
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
                // OPTIMIZACIÓN: No dibujar esqueleto en móviles
                if (!isMobile) {
                    let currentColors = TRACKING_COLORS.DEFAULT;
                    if (progressInfo && progressInfo.name && !progressInfo.isAudioPlaying && !progressInfo.isWaiting) {
                        currentColors = progressInfo.isValid ? TRACKING_COLORS.SUCCESS : TRACKING_COLORS.WARNING;
                    }
                    UIManager.drawSkeleton(smoothed, currentColors);
                }
                
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

// ============================================================
// APP STATE MACHINE
// ============================================================
const AppState = {
    state: 'INIT', // INIT, LOADING_MODEL, READY, ERROR
    
    transition(newState, payload) {
        console.log(`[AppState] Transition: ${this.state} -> ${newState}`, payload || '');
        this.state = newState;
        
        switch(newState) {
            case 'LOADING_MODEL':
                this.updateSplashText('Cargando Cerebro IA...');
                break;
            case 'READY':
                this.dismissSplash();
                // Ensure main content is visible
                const main = document.getElementById('mainContent');
                if(main) main.style.opacity = '1';
                break;
            case 'ERROR':
                this.showSplashError(payload);
                break;
        }
    },
    
    updateSplashText(text) {
        const el = document.querySelector('#globalSplash .splash-text');
        if(el) el.textContent = text;
    },
    
    dismissSplash() {
        const splash = document.getElementById('globalSplash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }
    },
    
    showSplashError(msg) {
        const splash = document.getElementById('globalSplash');
        if(splash) {
            splash.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <div style="font-size:3rem;">⚠️</div>
                    <h3>Algo salió mal</h3>
                    <p>${msg}</p>
                    <button onclick="location.reload()" style="
                        margin-top:15px;
                        padding:10px 20px;
                        background:var(--pink-ist);
                        color:white;
                        border:none;
                        border-radius:20px;
                        font-family:'Poppins';
                        cursor:pointer;
                    ">Reintentar</button>
                </div>
            `;
        }
    }
};

// ============================================================
// MAIN ENTRY POINT
// ============================================================

async function main() {
    console.log('🚀 Iniciando ISTEduca Modular...');
    
    AppState.transition('LOADING_MODEL');
    
    try {
        // Init Managers
        ExperienceManager.init();
        
        // --- TIMEOUT PROTECTION FOR AI LOADING ---
        // If AI generation takes > 15s on mobile, we proceed or show error
        const modelLoadPromise = (async () => {
             const autoModel = PoseEngine.selectModelByPerformance();
             await PoseEngine.initializePoseLandmarker(autoModel);
             return true;
        })();
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout al cargar IA")), 20000)
        );
        
        await Promise.race([modelLoadPromise, timeoutPromise]);
        
        // --- SUCCESS ---
        console.log("✅ Modelo Cargado Exitosamente");
        AppState.transition('READY');
        
        // Auto-start camera interaction logic
        // We update the secondary internal loading text just in case
        const loadingSubtext = document.getElementById('loadingSubtext');
        if (loadingSubtext) loadingSubtext.innerHTML = 'Motor IA listo. Iniciando cámara...';
        
        await enableCam(); // This manages the internal loadingOverlay
        
    } catch (error) {
        console.error("🔥 Error Critico en Main:", error);
        AppState.transition('ERROR', "No pudimos cargar el motor de IA. <br><small>" + error.message + "</small>");
    }
    
    // Setup UI Bindings
    setupButtons();
}

function setupButtons() {
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
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}