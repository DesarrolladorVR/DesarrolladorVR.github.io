// ISTEduca - Configuration Module

export const TRACKING_COLORS = {
  DEFAULT: {
    LANDMARK_BORDER: '#ff00a6',
    LANDMARK_FILL: '#7300ff',
    CONNECTOR: '#ff00a6'
  },
  SUCCESS: {
    LANDMARK_BORDER: '#00ff88',
    LANDMARK_FILL: '#00cc66',
    CONNECTOR: '#00ff88'
  },
  WARNING: {
    LANDMARK_BORDER: '#ffaa00',
    LANDMARK_FILL: '#ff8800',
    CONNECTOR: '#ffaa00'
  },
  ERROR: {
    LANDMARK_BORDER: '#ff4444',
    LANDMARK_FILL: '#cc0000',
    CONNECTOR: '#ff4444'
  }
};

// Detect Mobile (Portrait)
export const isMobile = window.innerWidth < 768;

export const VIDEO_CONFIG = {
  // Mobile: 640x360 (16:9) - Matches Desktop aspect ratio for correct guide alignment
  WIDTH: isMobile ? 640 : 960,
  HEIGHT: isMobile ? 360 : 540,
  FRAME_RATE: 30
};

export const LANDMARK_THRESHOLDS = {
    VISIBILITY_MIN: 0.5,
    VISIBILITY_MIN_STRICT: 0.65,
    VISIBILITY_MIN_LOOSE: 0.15, 
    SHOULDER_LEVEL_TOLERANCE: 0.04,
    
    // Dynamic thresholds based on device
    // Mobile: Face needs to be lower (approx 0.45-0.5) because guide is at 25% screen top,
    // but video cropping shifts relative coordinates.
    FACE_GUIDE_Y: isMobile ? 0.05 : 0.3, 
    FACE_GUIDE_HEIGHT: isMobile ? 0.20 : 0.15,
    
    SHOULDER_GUIDE_Y: isMobile ? 0.42 : 0.66, 
    SHOULDER_GUIDE_X: 0.50,
    SHOULDER_GUIDE_HEIGHT: 0.10,
    SHOULDER_GUIDE_WIDTH: isMobile ? 0.70 : 0.50, // Matches CSS width
    
    CALIBRATION_TOLERANCE: isMobile ? 0.25 : 0.15, // More permissive on mobile
    
    STRAIGHT_BACK_ANGLE: 30, 
    KNEES_FLEXED_ANGLE: 140, 
    LOAD_CLOSE_DISTANCE: 0.25 
};

export const AUDIO_PATHS = {
    INTRO: 'voiceoff/intro.wav',
    POSTURA_1: 'voiceoff/postura_1.wav',
    POSTURA_2: 'voiceoff/postura_2.wav',
    RESPIRACION: 'voiceoff/respiracion.wav',
    CONEXION: 'voiceoff/conexion.wav',
    SONRISA: 'voiceoff/sonrisa.wav',
    CIERRE: 'voiceoff/cierre.wav',
    CAMPANA: 'voiceoff/campana.wav'
};

export const PHASE_CONFIG = {
    0: {
        id: 0,
        name: 'Calibración',
        text: '"Ubícate a 1 metro de la pantalla y centra tu cara y hombros en las guías mostradas."',
        trigger: 'pose',
        // check function ref string or map later
        holdDuration: 2000, 
        showGuides: true
    },
    1: { 
        id: 1, 
        name: 'Introducción', 
        text: '"Hola. Te contamos que, según la neurociencia, aprender no es solo pensar; es también respirar, sentir, atender y conectarse con el propio cuerpo. Por esto, te invitamos a vivir una pequeña experiencia qut facilite tu aprendizaje."',
        audioSrc: AUDIO_PATHS.INTRO, 
        nextTrigger: 'auto_after_audio' 
    },
    2: { 
        id: 2, 
        name: 'Postura', 
        text: '"Comencemos. Siéntate cómodamente, con los pies afirmados en el suelo y tu espalda derecha."',
        audioSrc: AUDIO_PATHS.POSTURA_1, 
        trigger: 'pose', 
        holdDuration: 2000 
    },
    3: { 
        id: 3, 
        name: 'Validación Postura', 
        text: '"Muy bien, mantén esa postura."',
        audioSrc: AUDIO_PATHS.POSTURA_2, 
        trigger: 'time',
        delay: 2000 
    },
    4: { 
        id: 4, 
        name: 'Respiración', 
        text: '"Ahora, realiza una o dos respiraciones profundas y lentas. Inhalando suavemente por la nariz... y exhalando por la boca. Siente cómo tu cuerpo se oxigena."',
        audioSrc: AUDIO_PATHS.RESPIRACION, 
        trigger: 'time', 
        delay: 6000 
    },
    5: { 
        id: 5, 
        name: 'Conexión', 
        text: '"En este estado de calma, conéctate con una emoción de apertura y confianza. Visualiza esa seguridad que ayuda a tu proceso de aprendizaje."',
        audioSrc: AUDIO_PATHS.CONEXION, 
        trigger: 'pose', 
        holdDuration: 1500
    },
    6: { 
        id: 6, 
        name: 'Gesto Final', 
        text: '"Finalmente, mira la pantalla y sonríe con ganas."',
        audioSrc: AUDIO_PATHS.SONRISA, 
        trigger: 'pose', 
        holdDuration: 1000 
    },
    7: { 
        id: 7, 
        name: 'Cierre', 
        text: '"Ahora que escuchaste la campana, estás listo o lista para comenzar. ¡Éxito en tu jornada!"',
        audioSrc: AUDIO_PATHS.CIERRE, 
        effectSrc: AUDIO_PATHS.CAMPANA, 
        nextTrigger: 'end' 
    }
};
