/**
 * AIR SYNTH - GESTURE & MOTION RECOGNITION ENGINE
 * Handles finger geometry, hitchhiker thumb detection, arm-slide pitch bending,
 * strictly-verified 👉👈 UwU shy finger touch, and high-sensitivity head-sway tracking.
 */

export class GestureRecognizer {
  constructor() {
    // State tracking for right-hand flashbang trigger (Fist -> Palm transition)
    this.prevRightFingers = 0;
    this.lastFistTimestamp = 0;
    this.lastFlashbangTimestamp = 0;

    // State tracking for 👉👈 UwU gesture
    this.lastUwuTimestamp = 0;

    // State tracking for High-Sensitivity Head Sway (Chipi Chapa)
    this.lastSwayDirection = 0;
    this.lastExtremumX = null;
    this.recentSwings = [];
    this.lastSwayTimestamp = 0;
  }

  /**
   * Euclidean distance between two 3D landmarks
   */
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Evaluates which fingers are extended on a hand.
   */
  analyzeFingers(landmarks) {
    const wrist = landmarks[0];

    // Thumb: 1-4, Index: 5-8, Middle: 9-12, Ring: 13-16, Pinky: 17-20
    const isIndexExtended = this.distance(landmarks[8], wrist) > this.distance(landmarks[6], wrist) * 1.15;
    const isMiddleExtended = this.distance(landmarks[12], wrist) > this.distance(landmarks[10], wrist) * 1.15;
    const isRingExtended = this.distance(landmarks[16], wrist) > this.distance(landmarks[14], wrist) * 1.15;
    const isPinkyExtended = this.distance(landmarks[20], wrist) > this.distance(landmarks[18], wrist) * 1.15;

    const thumbTipToPinky = this.distance(landmarks[4], landmarks[17]);
    const thumbIpToPinky = this.distance(landmarks[3], landmarks[17]);
    const isThumbExtended = thumbTipToPinky > thumbIpToPinky * 1.25;

    const isThumbOnly = isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;
    const isHitchhikerSpread = isThumbExtended && (thumbTipToPinky > this.distance(landmarks[5], landmarks[17]) * 1.6);

    const fingers = {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended,
      isHitchhiker: isThumbOnly || isHitchhikerSpread
    };

    let count = 0;
    if (isIndexExtended) count++;
    if (isMiddleExtended) count++;
    if (isRingExtended) count++;
    if (isPinkyExtended) count++;
    if (isThumbExtended) count++;

    return { fingers, count };
  }

  /**
   * Maps right hand finger count and thumb state to musical notes
   */
  mapRightHandNote(fingerAnalysis) {
    const { fingers, count } = fingerAnalysis;

    if (fingers.isHitchhiker && (!fingers.index || count === 1 || count >= 5)) {
      if (fingers.thumb && (!fingers.index || count >= 5)) {
        return { note: 'G', label: 'Hitchhiker (G)', count: '👍 G' };
      }
    }

    switch (count) {
      case 0:
        return { note: 'A', label: 'Fist (A)', count: 0 };
      case 1:
        return { note: 'B', label: 'Index (B)', count: 1 };
      case 2:
        return { note: 'C', label: 'Peace (C)', count: 2 };
      case 3:
        return { note: 'D', label: 'Three (D)', count: 3 };
      case 4:
        return { note: 'E', label: 'Four (E)', count: 4 };
      case 5:
        return { note: 'F', label: 'Open Palm (F)', count: 5 };
      default:
        return { note: 'A', label: 'Fist (A)', count: 0 };
    }
  }

  /**
   * Maps left hand finger count to active instrument or custom sound
   */
  mapLeftHandInstrument(count, isChaosMode) {
    if (!isChaosMode) {
      switch (count) {
        case 1:
          return { id: 'piano', name: 'Grand Piano', count: 1 };
        case 2:
          return { id: 'cello', name: 'Cello / Guitar', count: 2 };
        case 3:
          return { id: 'brass', name: 'Saxophone / Brass', count: 3 };
        case 4:
          return { id: 'flute', name: 'Flute / Harp', count: 4 };
        case 5:
          return { id: 'strings', name: 'Orchestral Pad', count: 5 };
        default:
          return { id: 'piano', name: 'Grand Piano', count: count };
      }
    } else {
      switch (count) {
        case 1:
          return { id: 'metalPipe', name: 'Metal Pipe 💥', count: 1 };
        case 2:
          return { id: 'yippee', name: 'Yippee! 🎉', count: 2 };
        case 3:
          return { id: 'explosion', name: 'Explosion 💣', count: 3 };
        case 4:
          return { id: 'huh', name: 'Huh? ❓', count: 4 };
        case 5:
          return { id: 'marioJump', name: 'Mario Jump 🍄', count: 5 };
        default:
          return { id: 'none', name: 'Standby', count: count };
      }
    }
  }

  /**
   * Calculates horizontal pitch bend based on right wrist X coordinate
   */
  calculatePitchBend(wristLandmark) {
    const visualX = 1.0 - wristLandmark.x;
    const clamped = Math.max(0.15, Math.min(0.85, visualX));
    const normalized = (clamped - 0.5) / 0.35;
    const cents = Math.round(normalized * 1200);

    return {
      cents: cents,
      normalized: Math.max(-1, Math.min(1, normalized)),
      visualX: visualX
    };
  }

  /**
   * Checks for Flashbang Trigger (Fist -> Full Open Palm)
   */
  checkFlashbangTrigger(currentFingers, isChaosMode) {
    if (!isChaosMode) return false;

    const now = Date.now();
    if (currentFingers === 0) {
      this.lastFistTimestamp = now;
    }

    if (currentFingers === 5 && this.prevRightFingers < 2) {
      if (now - this.lastFistTimestamp < 800 && now - this.lastFlashbangTimestamp > 3000) {
        this.lastFlashbangTimestamp = now;
        return true;
      }
    }

    this.prevRightFingers = currentFingers;
    return false;
  }

  /**
   * Strictly Verified 👉👈 UwU Shy Finger Touch:
   * Requires BOTH index fingers to be clearly extended while other fingers are curled.
   * Fists and open palms are strictly rejected!
   */
  checkUwUGesture(hand1Landmarks, hand2Landmarks, isChaosMode) {
    if (!isChaosMode) return false;

    const now = Date.now();
    if (now - this.lastUwuTimestamp < 2500) return false;

    // Analyze extended fingers on both hands
    const h1 = this.analyzeFingers(hand1Landmarks);
    const h2 = this.analyzeFingers(hand2Landmarks);

    // Rule 1: BOTH index fingers MUST be extended! (Prevents fists from triggering)
    if (!h1.fingers.index || !h2.fingers.index) {
      return false;
    }

    // Rule 2: Hand must not be an open palm or random 4/5 finger pose
    // A true 👉👈 only has index (or index + thumb) extended
    if (h1.count > 3 || h2.count > 3) {
      return false;
    }

    // Rule 3: Middle, ring, and pinky must not be extended
    if (h1.fingers.pinky || h2.fingers.pinky || h1.fingers.ring || h2.fingers.ring) {
      return false;
    }

    // Rule 4: Distance between index fingertips (landmark 8)
    const tip1 = hand1Landmarks[8];
    const tip2 = hand2Landmarks[8];

    const dx = tip1.x - tip2.x;
    const dy = tip1.y - tip2.y;
    const touchDistance = Math.sqrt(dx * dx + dy * dy);

    if (touchDistance < 0.065) {
      this.lastUwuTimestamp = now;
      return true;
    }

    return false;
  }

  /**
   * High-Sensitivity Head Sway Tracking
   */
  trackHeadSway(faceDetections, isChaosMode) {
    if (!isChaosMode || !faceDetections || faceDetections.length === 0) {
      return false;
    }

    const now = Date.now();
    const detection = faceDetections[0];
    let headX = 0.5;

    if (detection.landmarks && detection.landmarks.length > 2) {
      headX = detection.landmarks[2].x;
    } else if (detection.boundingBox) {
      headX = detection.boundingBox.xCenter;
    }

    if (this.lastExtremumX === null) {
      this.lastExtremumX = headX;
      return false;
    }

    const deltaX = headX - this.lastExtremumX;
    const currentDirection = deltaX > 0.002 ? 1 : (deltaX < -0.002 ? -1 : 0);

    if (currentDirection !== 0 && this.lastSwayDirection !== 0 && currentDirection !== this.lastSwayDirection) {
      const swingDistance = Math.abs(deltaX);

      if (swingDistance >= 0.022) {
        this.recentSwings.push({ time: now, distance: swingDistance });
        this.lastExtremumX = headX;
      }
    }

    if (currentDirection !== 0) {
      this.lastSwayDirection = currentDirection;
    }

    this.recentSwings = this.recentSwings.filter(s => now - s.time <= 1200);

    if (this.recentSwings.length >= 1) {
      this.lastSwayTimestamp = now;
    }

    const isCurrentlySwaying = (now - this.lastSwayTimestamp) < 400;
    return isCurrentlySwaying;
  }
}
