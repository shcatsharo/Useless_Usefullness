/**
 * AIR SYNTH - MAIN APPLICATION CONTROLLER
 * Coordinates Webcam, MediaPipe Hands tracking loop, Canvas rendering,
 * Gesture analysis, Audio triggers, and Watermelon UI state.
 */

import { GestureRecognizer } from './gestures.js';
import { AudioEngine } from './audio.js';

// Initialize core instances
const gestureRecognizer = new GestureRecognizer();
const audioEngine = new AudioEngine();

// DOM Elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const flashbangOverlay = document.getElementById('flashbang-overlay');

// Mode Tab Buttons
const btnInstrumental = document.getElementById('mode-instrumental');
const btnChaos = document.getElementById('mode-chaos');

// HUD & Telemetry Elements
const hudInstrument = document.getElementById('hud-instrument');
const hudNote = document.getElementById('hud-note');
const hudBendVal = document.getElementById('hud-bend-val');
const hudBendBar = document.getElementById('hud-bend-bar');
const readoutLeft = document.getElementById('readout-left');
const badgeLeft = document.getElementById('badge-left');
const readoutRight = document.getElementById('readout-right');
const badgeRight = document.getElementById('badge-right');
const statusEngine = document.getElementById('status-engine');
const statusFps = document.getElementById('status-fps');
const statusPitch = document.getElementById('status-pitch');
const guideInstrumental = document.getElementById('guide-instrumental');
const guideChaos = document.getElementById('guide-chaos');

// FPS & Performance State
let frameCount = 0;
let lastFpsTime = performance.now();
let lastLeftFingerCount = -1;
let lastChaosTriggerTime = 0;

/**
 * Initialize Lucide Icons
 */
if (window.lucide) {
  window.lucide.createIcons();
}

/**
 * Mode Switching (Watermelon Segmented Pill Buttons)
 */
function setMode(isChaos) {
  audioEngine.isChaosMode = isChaos;
  audioEngine.releaseAll();

  if (isChaos) {
    btnChaos.className = "relative z-10 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 text-white bg-rose-500/25 border border-rose-400/40 shadow-lg shadow-rose-500/20";
    btnInstrumental.className = "relative z-10 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 text-slate-400 hover:text-slate-200";
    guideInstrumental.classList.add('hidden');
    guideChaos.classList.remove('hidden');
    hudInstrument.textContent = "Standby (Chaos)";
    readoutLeft.textContent = "Chaos Soundboard";
  } else {
    btnInstrumental.className = "relative z-10 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 text-white bg-cyan-500/20 border border-cyan-400/40 shadow-lg shadow-cyan-500/20";
    btnChaos.className = "relative z-10 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 text-slate-400 hover:text-slate-200";
    guideChaos.classList.add('hidden');
    guideInstrumental.classList.remove('hidden');
    hudInstrument.textContent = "1 • Grand Piano";
    readoutLeft.textContent = "1 Finger • Grand Piano";
  }
}

btnInstrumental.addEventListener('click', () => setMode(false));
btnChaos.addEventListener('click', () => setMode(true));

/**
 * Surprise Fullscreen Flashbang Animation (Chaos Mode)
 */
function triggerFlashbangVisual() {
  flashbangOverlay.classList.remove('fading');
  flashbangOverlay.classList.add('active');

  // Trigger audio blast + ringing tinnitus
  audioEngine.triggerFlashbang();

  // Smooth fadeout over 2 seconds
  setTimeout(() => {
    flashbangOverlay.classList.remove('active');
    flashbangOverlay.classList.add('fading');
  }, 100);
}

/**
 * Draw Hand Skeleton & Landmarks with Neon Cyberpunk Aesthetic
 */
function drawHand(ctx, landmarks, isRightHand) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [0, 13], [13, 14], [14, 15], [15, 16],// Ring
    [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [5, 9], [9, 13], [13, 17]             // Palm base
  ];

  const strokeColor = isRightHand ? 'rgba(0, 240, 255, 0.7)' : 'rgba(52, 211, 153, 0.7)';
  const pointColor = isRightHand ? '#00f0ff' : '#34d399';

  // Draw connecting bones
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [startIdx, endIdx] of connections) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    ctx.beginPath();
    ctx.moveTo(p1.x * canvasElement.width, p1.y * canvasElement.height);
    ctx.lineTo(p2.x * canvasElement.width, p2.y * canvasElement.height);
    ctx.stroke();
  }

  // Draw joints
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    const x = p.x * canvasElement.width;
    const y = p.y * canvasElement.height;

    ctx.beginPath();
    ctx.arc(x, y, i === 0 || i % 4 === 0 ? 5 : 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = pointColor;
    ctx.shadowColor = pointColor;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/**
 * MediaPipe Results Processing Loop
 */
function onResults(results) {
  // Update Tracking FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    statusFps.textContent = Math.round((frameCount * 1000) / (now - lastFpsTime));
    frameCount = 0;
    lastFpsTime = now;
  }

  // Clear Canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw video frame to canvas
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  let rightHandFound = false;
  let leftHandFound = false;

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i];

      // In mirrored selfie video:
      // MediaPipe 'Left' label = User's physical Right hand
      // MediaPipe 'Right' label = User's physical Left hand
      const isUserRightHand = handedness.label === 'Left';

      // Draw cyber skeleton
      drawHand(canvasCtx, landmarks, isUserRightHand);

      const analysis = gestureRecognizer.analyzeFingers(landmarks);

      if (isUserRightHand) {
        rightHandFound = true;

        // 1. Horizontal Arm-Slide Pitch Bending (Wrist X-coordinate)
        const bend = gestureRecognizer.calculatePitchBend(landmarks[0]);
        audioEngine.setPitchBend(bend.cents);

        // Update Pitch HUD
        hudBendVal.textContent = (bend.cents > 0 ? '+' : '') + bend.cents;
        statusPitch.textContent = (bend.cents > 0 ? '+' : '') + bend.cents + 'c';

        // Move slider bar: Center is 50%
        const barLeft = Math.max(0, Math.min(100, (bend.visualX * 100)));
        hudBendBar.style.left = `${Math.min(50, barLeft)}%`;
        hudBendBar.style.width = `${Math.abs(barLeft - 50)}%`;

        // 2. Check Flashbang Trap (Fist -> Open Palm in Chaos Mode)
        const isFlashbang = gestureRecognizer.checkFlashbangTrigger(analysis.count, audioEngine.isChaosMode);
        if (isFlashbang) {
          triggerFlashbangVisual();
        }

        // 3. Right Hand Note Mapping (A to G)
        const noteData = gestureRecognizer.mapRightHandNote(analysis);
        hudNote.textContent = noteData.label;
        readoutRight.textContent = noteData.label;
        badgeRight.textContent = noteData.count;

        // Trigger Audio Note
        audioEngine.playNote(noteData.note);

      } else {
        leftHandFound = true;

        // Left Hand Instrument / Chaos Sound Selection
        const instrument = gestureRecognizer.mapLeftHandInstrument(analysis.count, audioEngine.isChaosMode);
        hudInstrument.textContent = instrument.name;
        readoutLeft.textContent = instrument.name;
        badgeLeft.textContent = analysis.count;

        if (!audioEngine.isChaosMode) {
          audioEngine.setInstrument(instrument.id);
        } else {
          // In Chaos mode: Trigger sound on finger count changes
          const currentTime = Date.now();
          if (analysis.count > 0 && (analysis.count !== lastLeftFingerCount || currentTime - lastChaosTriggerTime > 1200)) {
            audioEngine.playChaosSound(instrument.id);
            lastLeftFingerCount = analysis.count;
            lastChaosTriggerTime = currentTime;
          }
        }
      }
    }
  }

  // If right hand is pulled out of view, silence notes
  if (!rightHandFound) {
    audioEngine.releaseAll();
    hudNote.textContent = "None";
    readoutRight.textContent = "No Hand Detected";
    badgeRight.textContent = "-";
  }

  if (!leftHandFound) {
    lastLeftFingerCount = -1;
  }

  canvasCtx.restore();
}

/**
 * Launch Application (User Gesture initialization)
 */
startBtn.addEventListener('click', async () => {
  try {
    startBtn.innerHTML = '<span class="animate-spin inline-block mr-2">⚙️</span> Initializing...';
    startBtn.disabled = true;

    // 1. Initialize Tone.js AudioContext
    await audioEngine.init();
    statusEngine.textContent = "Active (Online)";

    // 2. Setup Canvas Dimensions
    canvasElement.width = 640;
    canvasElement.height = 360;

    // 3. Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    // 4. Start Camera Stream
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 360
    });

    await camera.start();

    // Hide Start Overlay
    startOverlay.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      startOverlay.style.display = 'none';
    }, 300);

  } catch (error) {
    console.error("Initialization error:", error);
    alert("Camera or Audio initialization failed: " + error.message);
    startBtn.disabled = false;
    startBtn.innerHTML = 'Retry Launch';
  }
});
