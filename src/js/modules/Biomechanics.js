import { LANDMARK_THRESHOLDS } from '../config.js';

// ============================================================
// FUNCIONES MATEMÁTICAS BASICAS
// ============================================================

// Calcular ángulo entre tres puntos (en grados)
export function calculateAngle(pointA, pointB, pointC) {
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
export function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = (point2.z || 0) - (point1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ============================================================
// DETECCION DE BRAZOS (EXTRA)
// ============================================================

export function detectArmsUp(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  
  if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
      leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) {
    return false;
  }
  
  const leftArmUp = leftWrist.y < leftShoulder.y - 0.1;
  const rightArmUp = rightWrist.y < rightShoulder.y - 0.1;
  
  return leftArmUp && rightArmUp;
}

export function detectHandsOnChest(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  const chestX = (leftShoulder.x + rightShoulder.x) / 2;
  const chestY = (leftShoulder.y + rightShoulder.y) / 2 + 0.15; 

  const threshold = 0.2; 
  const leftDist = Math.hypot(leftWrist.x - chestX, leftWrist.y - chestY);
  const rightDist = Math.hypot(rightWrist.x - chestX, rightWrist.y - chestY);

  return leftDist < threshold && rightDist < threshold;
}

export function detectNeutral(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  const handsDown = leftWrist.y > leftShoulder.y + 0.3 && rightWrist.y > rightShoulder.y + 0.3;
  const handsCloseToBody = Math.abs(leftWrist.x - leftShoulder.x) < 0.2 && Math.abs(rightWrist.x - rightShoulder.x) < 0.2;

  return handsDown && handsCloseToBody;
}

// ============================================================
// UTILIDADES DE LANDMARKS
// ============================================================

export function smoothLandmarks(newLandmarks, history) {
  const SMOOTHING_FRAMES = 3; // Promediar ultimos 3 frames
  history.push(newLandmarks);
  
  if (history.length > SMOOTHING_FRAMES) {
    history.shift();
  }
  
  if (history.length === 1) {
    return newLandmarks;
  }
  
  // DEBUG RAW INPUT
  if (Math.random() < 0.05) { // Log occasional frames to avoid spam
     const nose = newLandmarks[0];
     console.log(`RAW LANDMARK: Nose Visibility: ${nose?.visibility}`);
  }

  // Calcular promedio
  return newLandmarks.map((point, idx) => {
    let sumX = 0, sumY = 0, sumZ = 0, sumVis = 0;
    
    // Validar que point existe para evitar errores
    if (!point) return null;

    let validFrames = 0;

    history.forEach(frame => {
      if (frame[idx]) {
        sumX += frame[idx].x;
        sumY += frame[idx].y;
        sumZ += frame[idx].z || 0;
        // Fix: Explicitly handle visibility property existence
        const v = frame[idx].visibility !== undefined ? frame[idx].visibility : 1;
        sumVis += v;
        validFrames++;
      }
    });
    
    // Si no hay frames validos (no deberia pasar), devolver el actual
    if (validFrames === 0) return point;

    return {
      x: sumX / validFrames,
      y: sumY / validFrames,
      z: sumZ / validFrames,
      visibility: sumVis / validFrames
    };
  });
}

// ============================================================
// FUNCIONES DE DETECCIÓN ESPECÍFICAS
// ============================================================

function captureBackBaseline(landmarks) {
  const ls = landmarks[11], rs = landmarks[12], nose = landmarks[0];
  if (!ls || !rs || !nose) return null;
  
  const vis = (p) => (p.visibility ?? 1);
  if (vis(ls) < 0.5 || vis(rs) < 0.5 || vis(nose) < 0.5) return null;
  
  return {
    shoulderMidY: (ls.y + rs.y) / 2,
    noseY: nose.y,
    timestamp: Date.now()
  };
}

function detectStraightBackFallback(landmarks, currentBaseline) {
  const ls = landmarks[11], rs = landmarks[12], nose = landmarks[0];
  if (!ls || !rs || !nose) return { result: false, baseline: currentBaseline };
  
  const vis = (p) => (p.visibility ?? 1);
  if (vis(ls) < 0.4 || vis(rs) < 0.4 || vis(nose) < 0.4) return { result: false, baseline: currentBaseline };
  
  // 1. Hombros nivelados (fundamental)
  const shouldersLevel = Math.abs(ls.y - rs.y) < LANDMARK_THRESHOLDS.SHOULDER_LEVEL_TOLERANCE;
  if (!shouldersLevel) return { result: false, baseline: currentBaseline };
  
  // 2. Si no hay baseline, capturar ahora
  let newBaseline = currentBaseline;
  if (!newBaseline) {
    newBaseline = captureBackBaseline(landmarks);
    return { result: false, baseline: newBaseline }; // Aún no validamos en primer frame
  }
  
  // 3. Verificar que no hayan caído (encorvado)
  const shoulderDrop = ((ls.y + rs.y) / 2) - newBaseline.shoulderMidY;
  const noseDrop = nose.y - newBaseline.noseY;
  
  const notSlouching = shoulderDrop < 0.05 && noseDrop < 0.06;
  
  return { 
      result: shouldersLevel && notSlouching, 
      baseline: newBaseline 
  };
}

export function detectStraightBack(landmarks, executionContext) {
  // executionContext holds state like backBaseline
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  // Función helper para visibilidad
  const vis = (p) => (p?.visibility ?? 1);
  
  // Si no están los hombros, falla directamente
  if (!leftShoulder || !rightShoulder) {
    return { result: false };
  }
  
  // ESTRATEGIA HÍBRIDA:
  const hipsVisible = leftHip && rightHip && 
                      vis(leftHip) > 0.4 && vis(rightHip) > 0.4;
  
  let isBackStraight = false;
  let newBaseline = executionContext?.backBaseline || null;
  
  if (hipsVisible) {
    // MÉTODO TRADICIONAL
    const minVis = 0.4;
    if (vis(leftShoulder) < minVis || vis(rightShoulder) < minVis) {
       return { result: false };
    }
    
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    
    const dx = shoulderMidX - hipMidX;
    const dy = hipMidY - shoulderMidY; 
    
    // Ángulo respecto a la vertical
    const verticalAngle = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
    const horizontalDiff = Math.abs(dx);
    
    isBackStraight = horizontalDiff < 0.08 && verticalAngle < 15;
    
  } else {
    // MÉTODO FALLBACK
    const fallbackResult = detectStraightBackFallback(landmarks, newBaseline);
    isBackStraight = fallbackResult.result;
    newBaseline = fallbackResult.baseline;
  }
  
  return { 
      result: isBackStraight,
      backBaseline: newBaseline // Return updated baseline to be saved by caller
  };
}

export function detectOpenPosture(landmarks) {
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftWrist || !rightWrist || leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) {
    return false;
  }

  // Distancia muñecas vs hombros
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const wristDist = Math.abs(leftWrist.x - rightWrist.x);
  
  // Postura abierta: Muñecas más separadas que el 50% del ancho de hombros
  return wristDist > shoulderWidth * 0.5;
}

export function detectSmile(landmarks) {
  const mouthLeft = landmarks[9];
  const mouthRight = landmarks[10];
  const eyeLeft = landmarks[3];
  const eyeRight = landmarks[6];

  if (!mouthLeft || !mouthRight || !eyeLeft || !eyeRight) {
    return false;
  }

  const mouthWidth = Math.hypot(mouthLeft.x - mouthRight.x, mouthLeft.y - mouthRight.y);
  const eyeWidth = Math.hypot(eyeLeft.x - eyeRight.x, eyeLeft.y - eyeRight.y);
  const widthRatio = mouthWidth / eyeWidth;
  
  const avgEyeY = (eyeLeft.y + eyeRight.y) / 2;
  const avgMouthY = (mouthLeft.y + mouthRight.y) / 2;
  const mouthElevation = avgEyeY - avgMouthY;
  
  // Sonrisa: Boca ancha Y mejillas no muy bajas
  return widthRatio > 0.50 && mouthElevation < 0.15;
}

export function detectCorrectPositioning(landmarks) {
  if (!landmarks || landmarks.length === 0) return false;
  
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  
  if (!nose || !leftShoulder || !rightShoulder) return false;
  
  const vis = (p) => (p?.visibility ?? 1);
  if (vis(nose) < LANDMARK_THRESHOLDS.VISIBILITY_MIN_LOOSE || 
      vis(leftShoulder) < LANDMARK_THRESHOLDS.VISIBILITY_MIN_LOOSE || 
      vis(rightShoulder) < LANDMARK_THRESHOLDS.VISIBILITY_MIN_LOOSE) {
    console.log(`Calibration Fail: Low Visibility. Nose: ${vis(nose).toFixed(2)}, LS: ${vis(leftShoulder).toFixed(2)}, RS: ${vis(rightShoulder).toFixed(2)}`);
    return false;
  }
  
  const faceY = nose.y;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  
  const {
      FACE_GUIDE_Y, FACE_GUIDE_HEIGHT,
      SHOULDER_GUIDE_Y, SHOULDER_GUIDE_X, SHOULDER_GUIDE_HEIGHT, SHOULDER_GUIDE_WIDTH,
      CALIBRATION_TOLERANCE
  } = LANDMARK_THRESHOLDS;
  
  const tolerance = CALIBRATION_TOLERANCE; // 0.12 by default
  
  const faceInRange = Math.abs(faceY - FACE_GUIDE_Y) < (FACE_GUIDE_HEIGHT / 2 + tolerance);
  const shouldersInRangeY = Math.abs(shoulderMidY - SHOULDER_GUIDE_Y) < (SHOULDER_GUIDE_HEIGHT / 2 + tolerance);
  const shouldersInRangeX = Math.abs(shoulderMidX - SHOULDER_GUIDE_X) < (SHOULDER_GUIDE_WIDTH / 2 + tolerance);
  const shoulderWidthOk = shoulderWidth > 0.10 && shoulderWidth < 0.65;
  
  if (!faceInRange || !shouldersInRangeY || !shouldersInRangeX || !shoulderWidthOk) {
      console.log(`Calibration Fail:
      FaceY: ${faceY.toFixed(2)} (Target: ${FACE_GUIDE_Y} ± ${(FACE_GUIDE_HEIGHT/2 + tolerance).toFixed(2)}) -> ${faceInRange ? 'OK' : 'FAIL'}
      ShldrY: ${shoulderMidY.toFixed(2)} (Target: ${SHOULDER_GUIDE_Y} ± ${(SHOULDER_GUIDE_HEIGHT/2 + tolerance).toFixed(2)}) -> ${shouldersInRangeY ? 'OK' : 'FAIL'}
      ShldrX: ${shoulderMidX.toFixed(2)} (Target: ${SHOULDER_GUIDE_X} ± ${(SHOULDER_GUIDE_WIDTH/2 + tolerance).toFixed(2)}) -> ${shouldersInRangeX ? 'OK' : 'FAIL'}
      Width:  ${shoulderWidth.toFixed(2)} (Range: 0.10 - 0.65) -> ${shoulderWidthOk ? 'OK' : 'FAIL'}
      `);
  }
  
  return {
    result: faceInRange && shouldersInRangeY && shouldersInRangeX && shoulderWidthOk,
    faceValid: faceInRange,
    shouldersValid: shouldersInRangeY && shouldersInRangeX && shoulderWidthOk
  };
}

// ============================================================
// HELPERS PARA ANALIZAR POSTURA DE LEVANTAMIENTO
// ============================================================

export function calculateBackAngle(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
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
  
  const dx = hipMid.x - shoulderMid.x;
  const dy = hipMid.y - shoulderMid.y;
  return Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
}

export function calculateKneeAngle(landmarks, side = 'left') {
  const hipIdx = side === 'left' ? 23 : 24;
  const kneeIdx = side === 'left' ? 25 : 26;
  const ankleIdx = side === 'left' ? 27 : 28;
  
  return calculateAngle(landmarks[hipIdx], landmarks[kneeIdx], landmarks[ankleIdx]);
}

export function calculateHandToTorsoDistance(landmarks) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    const torsoMid = {
      x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
      y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4,
      z: (leftShoulder.z + rightShoulder.z + leftHip.z + rightHip.z) / 4
    };
    
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    const leftDist = calculateDistance(leftWrist, torsoMid);
    const rightDist = calculateDistance(rightWrist, torsoMid);
    
    return (leftDist + rightDist) / 2;
  }
  
  export function analyzeLiftingPosture(landmarks) {
    if (!landmarks || landmarks.length < 33) return null;
    
    const backAngle = calculateBackAngle(landmarks);
    const leftKneeAngle = calculateKneeAngle(landmarks, 'left');
    const rightKneeAngle = calculateKneeAngle(landmarks, 'right');
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    const handDistance = calculateHandToTorsoDistance(landmarks);
    
    const { STRAIGHT_BACK_ANGLE, KNEES_FLEXED_ANGLE, LOAD_CLOSE_DISTANCE } = LANDMARK_THRESHOLDS;

    const isBackStraight = backAngle < STRAIGHT_BACK_ANGLE;
    const areKneesFlexed = avgKneeAngle < KNEES_FLEXED_ANGLE;
    const isLoadClose = handDistance < LOAD_CLOSE_DISTANCE;
    
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
