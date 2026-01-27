import { PHASE_CONFIG } from '../config.js';
import * as Biomechanics from './Biomechanics.js';
import * as UIManager from './UIManager.js';

// Estado interno del manager
let backBaseline = null;
let jitterToleranceFrames = 0;
const MAX_JITTER_FRAMES = 5;

export const ExperienceManager = {
  currentPhase: -1, 
  phaseStartTime: 0,
  audioFinishedTime: 0, 
  isAudioPlaying: false, 
  holdStartTime: 0, 
  currentAudio: null,
  
  // Hydrated phases with logic
  phases: {},

  init() {
    // Mapear configuración y asignar funciones de chequeo
    this.phases = { ...PHASE_CONFIG };
    
    this.phases[0].check = Biomechanics.detectCorrectPositioning;
    
    // Phase 2: Postura - Usamos la misma lógica estricta que calibración
    this.phases[2].check = Biomechanics.detectCorrectPositioning;
    
    this.phases[5].check = Biomechanics.detectOpenPosture;
    this.phases[6].check = Biomechanics.detectSmile;
  },

  playAudio(src) {
      if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
      }
      this.isAudioPlaying = true; 
      
      return new Promise((resolve) => {
        this.currentAudio = new Audio(src);
        
        this.currentAudio.onended = () => {
             this.isAudioPlaying = false; 
             this.audioFinishedTime = Date.now(); 
             console.log(`🔊 Audio finished: ${src}`);
             resolve();
        };
        
        this.currentAudio.onerror = () => { 
            console.log('Error audio', src); 
            this.isAudioPlaying = false;
            this.audioFinishedTime = Date.now();
            resolve(); 
        };
        
        this.currentAudio.play().catch(e => { 
            console.log("Audio play error:", e); 
            this.isAudioPlaying = false;
            this.audioFinishedTime = Date.now();
            resolve(); 
        });
      });
  },

  playEffect(src) {
    const effect = new Audio(src);
    effect.play().catch(e => console.log("Effect play error:", e));
  },

  update(landmarks) {
      const now = Date.now();
      
      // Fase -1 -> 0
      if (this.currentPhase === -1) {
          if (landmarks) {
              this.transitionTo(0); 
          }
          return null;
      }

      if (this.isAudioPlaying) {
          this.holdStartTime = 0; 
          return { isAudioPlaying: true, name: this.phases[this.currentPhase]?.name };
      }

      const phase = this.phases[this.currentPhase];
      if (!phase) return null;
      
      // Lógica Trigger: POSE
      if (phase.trigger === 'pose' && phase.check) {
          const checkResult = phase.check(landmarks);
          // Handle both boolean and detailed object returns
          const isPoseCorrect = (typeof checkResult === 'object' && checkResult !== null && 'result' in checkResult) 
                              ? checkResult.result 
                              : checkResult;
          
          // CHECK LIGHTING CONDITIONS (Heuristic based on visibility)
          // If detection is consistently failing due to visibility, show warning
          const vis = (p) => (p?.visibility ?? 1);
          // Check nose visibility as proxy
          if (landmarks[0] && vis(landmarks[0]) < 0.4) {
             UIManager.showLightingWarning();
          } else {
             UIManager.hideLightingWarning();
          }
          
          if (this.currentPhase === 0 || this.currentPhase === 2) {
              const progress = this.holdStartTime > 0 ? (now - this.holdStartTime) : 0;
              // Update status only for phase 0 (Phase 2 has its own subtitle)
              if (this.currentPhase === 0) UIManager.updateCalibrationStatus(isPoseCorrect, progress);
              
              // Visual feedback (guides) for both
              UIManager.updateCalibrationFeedback(checkResult);
          }
          
          if (isPoseCorrect) {
              jitterToleranceFrames = 0;
              
              if (this.holdStartTime === 0) {
                  this.holdStartTime = now; 
              }
              
              const holdDuration = phase.holdDuration || 500; 
              const heldTime = now - this.holdStartTime;
              
              if (heldTime >= holdDuration) {
                  this.transitionTo(this.currentPhase + 1);
                  return null; 
              }
              
              return {
                  isValid: true,
                  current: heldTime,
                  total: holdDuration,
                  name: phase.name
              };

          } else {
              jitterToleranceFrames++;
              
              if (jitterToleranceFrames > MAX_JITTER_FRAMES) {
                  this.holdStartTime = 0;
                  jitterToleranceFrames = 0;
                  return {
                      isValid: false,
                      current: 0,
                      total: phase.holdDuration || 500,
                      name: phase.name
                  };
              } else {
                  const heldTime = this.holdStartTime > 0 ? now - this.holdStartTime : 0;
                  return {
                      isValid: false,
                      current: heldTime,
                      total: phase.holdDuration || 500,
                      name: phase.name,
                      jitterTolerance: true 
                  };
              }
          }

      } 
      // Lógica Trigger: TIME
      else if (phase.trigger === 'time') {
          const timeSinceAudio = now - this.audioFinishedTime;
          if (timeSinceAudio > phase.delay) {
               this.transitionTo(this.currentPhase + 1);
          }
          return { isWaiting: true, name: phase.name };
      }
      
      return null;
  },

  async transitionTo(phaseId) {
      if (this.currentPhase === phaseId) return;
      
      this.currentPhase = phaseId;
      this.phaseStartTime = Date.now();
      this.holdStartTime = 0; 
      jitterToleranceFrames = 0; 
      
      if (phaseId === 0 || phaseId === 2) {
          UIManager.showCalibrationOverlay();
      } else {
          UIManager.hideCalibrationOverlay();
      }
      
      if (phaseId === 2) {
          backBaseline = null;
          console.log('📏 Baseline de espalda reseteado para calibración');
      }
      
      console.log(`🌟 Transición de Fase: ${phaseId}`);
      
      const phase = this.phases[phaseId];
      if (!phase) return;
      
      UIManager.showPhaseNotification(phase.name);
      UIManager.updateSubtitle(phase.text);

      if (phase.effectSrc) {
        this.playEffect(phase.effectSrc);
      }

      if (phase.audioSrc) {
          await this.playAudio(phase.audioSrc);
          
          if (phase.nextTrigger === 'auto_after_audio') {
             this.transitionTo(phaseId + 1);
          }
      } else {
          this.audioFinishedTime = Date.now();
          this.isAudioPlaying = false;
      }
  },
  
  reset() {
      this.currentPhase = 0;
      this.isAudioPlaying = false;
      if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
      }
      backBaseline = null;
      UIManager.updateSubtitle('');
  }
};
