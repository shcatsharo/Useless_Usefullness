/**
 * AIR SYNTH - MAIN APPLICATION CONTROLLER
 * Coordinates:
 * - Dynamic Stress-Relieving Particle Background
 * - MediaPipe Hands tracking & MediaPipe Face Detection
 * - Hardware Toggles (Sustain Pedal & Pitch Lock)
 * - Custom Meme Audio Triggers (Metal Pipe, Yippee, Explosion, Huh, Mario Jump)
 * - Easter Eggs: 👉👈 UwU (with conflict suppression) & 🐱 Instant-Stop Chipi Chapa
 */

import { GestureRecognizer } from './gestures.js';
import { AudioEngine } from './audio.js';

// Core instances
const gestureRecognizer = new GestureRecognizer();
const audioEngine = new AudioEngine();

// DOM Elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const flashbangOverlay = document.getElementById('flashbang-overlay');
const uwuOverlay = document.getElementById('uwu-overlay');
const chipiIndicator = document.getElementById('chipi-indicator');

// Mode Buttons & Controls
const btnInstrumental = document.getElementById('mode-instrumental');
const btnChaos = document.getElementById('mode-chaos');
const modeSlidingPill = document.getElementById('mode-sliding-pill');
const btnSustain = document.getElementById('btn-sustain');
const sustainStatus = document.getElementById('sustain-status');
const btnPitchLock = document.getElementById('btn-pitch-lock');
const pitchLockStatus = document.getElementById('pitch-lock-status');

// HUD & Telemetry Elements
const hudInstrument = document.getElementById('hud-instrument');
const hudNote = document.getElementById('hud-note');
const hudBendContainer = document.getElementById('hud-bend-container');
const hudBendVal = document.getElementById('hud-bend-val');
const hudBendBar = document.getElementById('hud-bend-bar');
const readoutLeft = document.getElementById('readout-left');
const badgeLeft = document.getElementById('badge-left');
const readoutRight = document.getElementById('readout-right');
const badgeRight = document.getElementById('badge-right');
const statusEngine = document.getElementById('status-engine');
const statusFps = document.getElementById('status-fps');
const statusPitchContainer = document.getElementById('status-pitch-container');
const statusPitch = document.getElementById('status-pitch');
const guideInstrumental = document.getElementById('guide-instrumental');
const guideChaos = document.getElementById('guide-chaos');
const btnToggleCheatsheet = document.getElementById('btn-toggle-cheatsheet');
const cheatsheetContent = document.getElementById('cheatsheet-content');
const cheatsheetChevron = document.getElementById('cheatsheet-chevron');
const cheatsheetBadge = document.getElementById('cheatsheet-badge');

// App States
let frameCount = 0;
let lastFpsTime = performance.now();
let lastLeftFingerCount = -1;
let lastChaosTriggerTime = 0;
let lastUwuTriggerTime = 0; // Tracks UwU suppression lockout
let isSustainActive = false;
let isPitchFreestyle = true; // Free style pitch chooser enabled by default
let fixedPitchCents = 0;

if (window.lucide) {
  window.lucide.createIcons();
}

/* ==========================================================================
   1. Relaxing Ambient Dust Particles & Fluid Mouse Interaction
   ========================================================================== */
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

let dustMotes = [];
let cursorMotes = [];
let mouse = { x: -1000, y: -1000, vx: 0, vy: 0, isMoving: false };
let mouseTimer = null;

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initDustMotes();
}

function initDustMotes() {
  const count = Math.min(130, Math.max(50, Math.floor((window.innerWidth * window.innerHeight) / 11000)));
  dustMotes = [];

  for (let i = 0; i < count; i++) {
    const depth = Math.random() * 0.7 + 0.3; // 0.3 (far, tiny) to 1.0 (near)
    dustMotes.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: depth * 1.1 + Math.random() * 0.5, // 0.7px to 1.6px - fine dust motes
      depth: depth,
      baseAlpha: 0.12 + depth * 0.38,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.0012 + Math.random() * 0.002,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: 0.0008 + Math.random() * 0.0012,
      baseVy: -(0.08 + depth * 0.16), // Gentle lazy upward thermal drift
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(0.08 + depth * 0.16),
      hue: Math.random() > 0.25 ? (Math.random() * 25 + 180) : (Math.random() * 35 + 230) // Starlight cyan & soft lavender
    });
  }
}

resizeBgCanvas();
window.addEventListener('resize', resizeBgCanvas);

window.addEventListener('mousemove', (e) => {
  if (mouse.x > 0) {
    mouse.vx = (e.clientX - mouse.x) * 0.18;
    mouse.vy = (e.clientY - mouse.y) * 0.18;
  }
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.isMoving = true;

  // Release 2 fine glowing micro-dust specks in cursor wake
  for (let i = 0; i < 2; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.6 + 0.15;
    cursorMotes.push({
      x: mouse.x + (Math.random() - 0.5) * 12,
      y: mouse.y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed + mouse.vx * 0.12,
      vy: Math.sin(angle) * speed + mouse.vy * 0.12 - 0.15,
      radius: Math.random() * 0.9 + 0.5, // 0.5px to 1.4px
      alpha: Math.random() * 0.45 + 0.3,
      decay: 0.005 + Math.random() * 0.005,
      hue: Math.random() > 0.35 ? (Math.random() * 25 + 180) : (Math.random() * 30 + 225)
    });
  }

  if (cursorMotes.length > 80) {
    cursorMotes.splice(0, cursorMotes.length - 80);
  }

  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(() => {
    mouse.isMoving = false;
    mouse.vx *= 0.5;
    mouse.vy *= 0.5;
  }, 200);
});

function animateDust(time) {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  const t = time || performance.now();

  // 1. Draw and update ambient floating dust motes
  for (let i = 0; i < dustMotes.length; i++) {
    const m = dustMotes[i];

    // Soothing sinusoidal air current drift
    m.driftAngle += m.driftSpeed;
    const waveX = Math.cos(m.driftAngle) * 0.2 * m.depth;
    const waveY = Math.sin(m.driftAngle * 0.8) * 0.12 * m.depth;

    // Gentle cursor interaction: dust lazily parts away
    if (mouse.x > 0) {
      const dx = m.x - mouse.x;
      const dy = m.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      const influenceDist = 120;

      if (distSq < influenceDist * influenceDist && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / influenceDist) * 1.2 * m.depth;
        m.vx += (dx / dist) * force * 0.3;
        m.vy += (dy / dist) * force * 0.3;
      }
    }

    // Velocity damping back to tranquil natural drift
    m.vx *= 0.94;
    m.vy = m.vy * 0.94 + m.baseVy * 0.06;

    m.x += m.vx + waveX;
    m.y += m.vy + waveY;

    // Wrap seamlessly around screen boundaries
    if (m.x < -8) m.x = bgCanvas.width + 8;
    if (m.x > bgCanvas.width + 8) m.x = -8;
    if (m.y < -8) m.y = bgCanvas.height + 8;
    if (m.y > bgCanvas.height + 8) m.y = -8;

    // Breathing luminance / serene twinkle
    const twinkle = 0.7 + 0.3 * Math.sin(t * m.twinkleSpeed + m.phase);
    const alpha = Math.max(0.04, Math.min(1, m.baseAlpha * twinkle));

    bgCtx.beginPath();
    bgCtx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    bgCtx.fillStyle = `hsla(${m.hue}, 80%, 75%, ${alpha})`;
    if (m.depth > 0.7) {
      bgCtx.shadowColor = `hsla(${m.hue}, 80%, 75%, ${alpha * 0.6})`;
      bgCtx.shadowBlur = 3;
    }
    bgCtx.fill();
    bgCtx.shadowBlur = 0;
  }

  // 2. Draw and update delicate cursor wake dust
  for (let i = cursorMotes.length - 1; i >= 0; i--) {
    const cm = cursorMotes[i];
    cm.x += cm.vx;
    cm.y += cm.vy;
    cm.vx *= 0.97;
    cm.vy = cm.vy * 0.97 - 0.012; // slow peaceful rise
    cm.alpha -= cm.decay;

    if (cm.alpha <= 0) {
      cursorMotes.splice(i, 1);
      continue;
    }

    bgCtx.beginPath();
    bgCtx.arc(cm.x, cm.y, cm.radius, 0, Math.PI * 2);
    bgCtx.fillStyle = `hsla(${cm.hue}, 85%, 78%, ${cm.alpha})`;
    bgCtx.shadowColor = `hsla(${cm.hue}, 85%, 78%, ${cm.alpha * 0.5})`;
    bgCtx.shadowBlur = 2.5;
    bgCtx.fill();
    bgCtx.shadowBlur = 0;
  }

  requestAnimationFrame(animateDust);
}
requestAnimationFrame(animateDust);

/* ==========================================================================
   2. Hardware Toggles: Sustain Pedal & Pitch Lock
   ========================================================================== */
btnSustain.addEventListener('click', () => {
  isSustainActive = !isSustainActive;
  audioEngine.setSustain(isSustainActive);
  btnSustain.classList.toggle('active', isSustainActive);
  sustainStatus.textContent = isSustainActive ? 'ON' : 'OFF';
});

btnPitchLock.addEventListener('click', () => {
  isPitchFreestyle = !isPitchFreestyle;

  if (isPitchFreestyle) {
    btnPitchLock.classList.add('active');
    btnPitchLock.classList.remove('fixed-pitch');
    pitchLockStatus.textContent = 'ON';
    statusPitch.textContent = (audioEngine.currentCents > 0 ? '+' : '') + audioEngine.currentCents + 'c';
    hudBendVal.textContent = (audioEngine.currentCents > 0 ? '+' : '') + audioEngine.currentCents;
  } else {
    // Toggled OFF: pitch is fixed where it was stopped!
    btnPitchLock.classList.remove('active');
    btnPitchLock.classList.add('fixed-pitch');
    pitchLockStatus.textContent = 'FIXED';
    fixedPitchCents = audioEngine.currentCents;
    audioEngine.setPitchBend(fixedPitchCents);
    hudBendVal.textContent = (fixedPitchCents > 0 ? '+' : '') + fixedPitchCents + ' (FIXED)';
    statusPitch.textContent = (fixedPitchCents > 0 ? '+' : '') + fixedPitchCents + 'c (Fixed)';
  }
});

/* ==========================================================================
   3. Mode Switching
   ========================================================================== */
function setMode(isChaos) {
  audioEngine.isChaosMode = isChaos;
  audioEngine.releaseAll();
  audioEngine.stopChipiChapa();
  chipiIndicator.classList.remove('active');

  if (isChaos) {
    if (modeSlidingPill) modeSlidingPill.classList.add('chaos');
    btnChaos.classList.remove('text-slate-400');
    btnChaos.classList.add('text-white');
    btnInstrumental.classList.remove('text-white');
    btnInstrumental.classList.add('text-slate-400');

    // Smooth tab crossfade inside cheatsheet
    if (guideInstrumental && guideChaos) {
      guideInstrumental.classList.remove('active-tab');
      setTimeout(() => {
        guideInstrumental.classList.add('hidden');
        guideChaos.classList.remove('hidden');
        requestAnimationFrame(() => guideChaos.classList.add('active-tab'));
      }, 150);
    }

    hudInstrument.textContent = "Metal Pipe (1 Finger)";
    readoutLeft.textContent = "Chaos Meme Soundboard";

    // Smooth HUD pitch bend slide & fade out
    if (hudBendContainer) hudBendContainer.classList.add('hud-hidden');
    if (statusPitchContainer) statusPitchContainer.classList.add('opacity-0', 'pointer-events-none');
  } else {
    if (modeSlidingPill) modeSlidingPill.classList.remove('chaos');
    btnInstrumental.classList.remove('text-slate-400');
    btnInstrumental.classList.add('text-white');
    btnChaos.classList.remove('text-white');
    btnChaos.classList.add('text-slate-400');

    // Smooth tab crossfade inside cheatsheet
    if (guideInstrumental && guideChaos) {
      guideChaos.classList.remove('active-tab');
      setTimeout(() => {
        guideChaos.classList.add('hidden');
        guideInstrumental.classList.remove('hidden');
        requestAnimationFrame(() => guideInstrumental.classList.add('active-tab'));
      }, 150);
    }

    hudInstrument.textContent = "1 • Grand Piano";
    readoutLeft.textContent = "1 Finger • Grand Piano";

    // Smooth HUD pitch bend slide & fade in
    if (hudBendContainer) hudBendContainer.classList.remove('hud-hidden');
    if (statusPitchContainer) statusPitchContainer.classList.remove('opacity-0', 'pointer-events-none');
  }
}

btnInstrumental.addEventListener('click', () => setMode(false));
btnChaos.addEventListener('click', () => setMode(true));

// Dropdown Cheat-Sheet Accordion Toggle (Smooth Animated)
let isCheatsheetOpen = false;
if (btnToggleCheatsheet && cheatsheetContent) {
  btnToggleCheatsheet.addEventListener('click', () => {
    isCheatsheetOpen = !isCheatsheetOpen;
    if (isCheatsheetOpen) {
      cheatsheetContent.classList.add('expanded');
      if (cheatsheetChevron) cheatsheetChevron.classList.add('open');
      if (cheatsheetBadge) cheatsheetBadge.textContent = 'Collapse';
    } else {
      cheatsheetContent.classList.remove('expanded');
      if (cheatsheetChevron) cheatsheetChevron.classList.remove('open');
      if (cheatsheetBadge) cheatsheetBadge.textContent = 'Expand';
    }
  });
}

/* ==========================================================================
   4. Easter Egg Visual & Audio Triggers
   ========================================================================== */
function triggerFlashbangVisual() {
  flashbangOverlay.classList.remove('fading');
  flashbangOverlay.classList.add('active');
  audioEngine.triggerFlashbang();

  setTimeout(() => {
    flashbangOverlay.classList.remove('active');
    flashbangOverlay.classList.add('fading');
  }, 100);
}

function triggerUwUVisualAndAudio() {
  lastUwuTriggerTime = Date.now(); // Suppress standard 1 & 2 finger sounds
  uwuOverlay.classList.add('active');
  audioEngine.playUwU();

  setTimeout(() => {
    uwuOverlay.classList.remove('active');
  }, 1600);
}

/* ==========================================================================
   5. Canvas Neon Hand Renderer
   ========================================================================== */
function drawHand(ctx, landmarks, isRightHand) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
  ];

  const strokeColor = isRightHand ? 'rgba(0, 240, 255, 0.7)' : 'rgba(52, 211, 153, 0.7)';
  const pointColor = isRightHand ? '#00f0ff' : '#34d399';

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

  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    ctx.beginPath();
    ctx.arc(p.x * canvasElement.width, p.y * canvasElement.height, i === 0 || i % 4 === 0 ? 5 : 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = pointColor;
    ctx.shadowColor = pointColor;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/* ==========================================================================
   6. MediaPipe Tracking Loops
   ========================================================================== */
function onHandsResults(results) {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    statusFps.textContent = Math.round((frameCount * 1000) / (now - lastFpsTime));
    frameCount = 0;
    lastFpsTime = now;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  let rightHandFound = false;
  let leftHandFound = false;
  let isUwUDetectedThisFrame = false;

  if (results.multiHandLandmarks && results.multiHandedness) {
    // Check 👉👈 UwU gesture when 2 hands are detected in Chaos mode
    if (results.multiHandLandmarks.length === 2 && audioEngine.isChaosMode) {
      if (gestureRecognizer.checkUwUGesture(results.multiHandLandmarks[0], results.multiHandLandmarks[1], true)) {
        triggerUwUVisualAndAudio();
        isUwUDetectedThisFrame = true;
      }
    }

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i];
      const isUserRightHand = handedness.label === 'Left';

      drawHand(canvasCtx, landmarks, isUserRightHand);
      const analysis = gestureRecognizer.analyzeFingers(landmarks);

      if (isUserRightHand) {
        rightHandFound = true;

        if (!audioEngine.isChaosMode) {
          if (isPitchFreestyle) {
            // Free style pitch chooser: dynamic wrist tracking
            const bend = gestureRecognizer.calculatePitchBend(landmarks[0]);
            audioEngine.setPitchBend(bend.cents);
            fixedPitchCents = bend.cents;

            hudBendVal.textContent = (bend.cents > 0 ? '+' : '') + bend.cents;
            statusPitch.textContent = (bend.cents > 0 ? '+' : '') + bend.cents + 'c';

            const barLeft = Math.max(0, Math.min(100, (bend.visualX * 100)));
            hudBendBar.style.left = `${Math.min(50, barLeft)}%`;
            hudBendBar.style.width = `${Math.abs(barLeft - 50)}%`;
          } else {
            // Switch is toggled OFF: fixed pitch is maintained!
            audioEngine.setPitchBend(fixedPitchCents);
            hudBendVal.textContent = (fixedPitchCents > 0 ? '+' : '') + fixedPitchCents + ' (FIXED)';
            statusPitch.textContent = (fixedPitchCents > 0 ? '+' : '') + fixedPitchCents + 'c (Fixed)';
          }
        }

        if (gestureRecognizer.checkFlashbangTrigger(analysis.count, audioEngine.isChaosMode)) {
          triggerFlashbangVisual();
        }

        const noteData = gestureRecognizer.mapRightHandNote(analysis);
        hudNote.textContent = noteData.label;
        readoutRight.textContent = noteData.label;
        badgeRight.textContent = noteData.count;

        // In Chaos mode: suppress notes if UwU was just triggered
        if (!audioEngine.isChaosMode || (Date.now() - lastUwuTriggerTime > 1500)) {
          audioEngine.playNote(noteData.note);
        }

      } else {
        leftHandFound = true;
        const instrument = gestureRecognizer.mapLeftHandInstrument(analysis.count, audioEngine.isChaosMode);
        hudInstrument.textContent = instrument.name;
        readoutLeft.textContent = instrument.name;
        badgeLeft.textContent = analysis.count;

        if (!audioEngine.isChaosMode) {
          audioEngine.setInstrument(instrument.id);
        } else {
          // Chaos Mode: SUPPRESS Metal Pipe / Yippee if UwU was triggered or detected!
          const currentTime = Date.now();
          const isUwUSuppressed = isUwUDetectedThisFrame || (currentTime - lastUwuTriggerTime < 1500);

          if (!isUwUSuppressed && analysis.count > 0 && (analysis.count !== lastLeftFingerCount || currentTime - lastChaosTriggerTime > 1200)) {
            audioEngine.playChaosSound(instrument.id);
            lastLeftFingerCount = analysis.count;
            lastChaosTriggerTime = currentTime;
          }
        }
      }
    }
  }

  if (!rightHandFound) {
    audioEngine.releaseAll();
    if (isPitchFreestyle) {
      audioEngine.setPitchBend(0);
      hudBendVal.textContent = "0";
      hudBendBar.style.left = "50%";
      hudBendBar.style.width = "0%";
      statusPitch.textContent = "Neutral";
    } else {
      // Switch is OFF (Fixed pitch): keep the locked pitch intact even when hand is out of view!
      audioEngine.setPitchBend(fixedPitchCents);
    }
    hudNote.textContent = "None";
    readoutRight.textContent = "No Hand Detected";
    badgeRight.textContent = "-";
  }

  if (!leftHandFound) {
    lastLeftFingerCount = -1;
  }

  canvasCtx.restore();
}

function onFaceResults(results) {
  if (audioEngine.isChaosMode) {
    const isVigorousSway = gestureRecognizer.trackHeadSway(results.detections, true);

    if (isVigorousSway) {
      chipiIndicator.classList.add('active');
      audioEngine.startChipiChapa();
    } else {
      chipiIndicator.classList.remove('active');
      audioEngine.stopChipiChapa();
    }
  } else {
    chipiIndicator.classList.remove('active');
    audioEngine.stopChipiChapa();
  }
}

/* ==========================================================================
   7. Application Launch
   ========================================================================== */
startBtn.addEventListener('click', async () => {
  try {
    startBtn.innerHTML = '<span class="animate-spin inline-block mr-2">⚙️</span> Initializing AI Models...';
    startBtn.disabled = true;

    await audioEngine.init();
    statusEngine.textContent = "Active (Online)";

    canvasElement.width = 640;
    canvasElement.height = 360;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    hands.onResults(onHandsResults);

    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });
    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });
    faceDetection.onResults(onFaceResults);

    let tick = 0;
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
        tick++;
        if (tick % 2 === 0) {
          await faceDetection.send({ image: videoElement });
        }
      },
      width: 640,
      height: 360
    });

    await camera.start();

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
const roasts = [
  "Bro is built like a syntax error.",
  "The face of 0 hours of sleep.",
  "Looking like a dropped Hot Pocket.",
  "Error 404: Jawline not found.",
  "Even MediaPipe couldn't track this face."
];

// This mathematically bulges the center of the image
function applyCursedFisheye(canvas, ctx) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = canvas.width;
  const height = canvas.height;
  const copy = new Uint8ClampedArray(data);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);

      if (r < radius) {
        // Fisheye distortion formula (2.0 = bulge strength)
        const bind = r / radius;
        const distortion = Math.pow(bind, 2.0) * radius;
        const factor = distortion / (r || 1);

        const srcX = Math.floor(cx + dx * factor);
        const srcY = Math.floor(cy + dy * factor);

        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const dstIdx = (y * width + x) * 4;
          const srcIdx = (srcY * width + srcX) * 4;
          data[dstIdx] = copy[srcIdx];
          data[dstIdx + 1] = copy[srcIdx + 1];
          data[dstIdx + 2] = copy[srcIdx + 2];
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}