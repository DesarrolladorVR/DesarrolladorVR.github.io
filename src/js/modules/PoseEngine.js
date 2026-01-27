import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const { PoseLandmarker, FilesetResolver } = vision;

let poseLandmarker = undefined;
let currentModel = 'lite';

export async function initializePoseLandmarker(modelType = 'lite', runningMode = 'VIDEO') {
  currentModel = modelType;
  
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
      numPoses: 1 
    });
    
    console.log(`MediaPipe PoseLandmarker (${modelType}) cargado correctamente`);
    return true;
  } catch (error) {
    console.error("Error al cargar MediaPipe:", error);
    throw error;
  }
}

export function getPoseLandmarker() {
    return poseLandmarker;
}

export async function setRunningMode(mode) {
    if (poseLandmarker) {
        await poseLandmarker.setOptions({ runningMode: mode });
    }
}

export function detectForVideo(video, startTimeMs, callback) {
    if (poseLandmarker) {
        poseLandmarker.detectForVideo(video, startTimeMs, callback);
    }
}

export function selectModelByPerformance() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isMobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);

  if (!isMobile && cores >= 8 && memory >= 8) return 'full';
  if (!isMobile && cores >= 6 && memory >= 6) return 'full';
  return 'lite';
}
