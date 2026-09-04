/**
 * AIR SYNTH - GESTURE RECOGNITION ENGINE
 * Handles MediaPipe landmark geometry, finger counting, hitchhiker thumb detection,
 * and horizontal arm-slide pitch bend calculation.
 */

export class GestureRecognizer {
  constructor() {
    // State tracking for right-hand flashbang trigger (Fist -> Palm transition)
    this.prevRightFingers = 0;
    this.lastFistTimestamp = 0;
    this.lastFlashbangTimestamp = 0;
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
   * Returns an object with finger boolean states and total extended count.
   */
  analyzeFingers(landmarks) {
    const wrist = landmarks[0];

    // Landmark indices
    // Thumb: 1 (CMC), 2 (MCP), 3 (IP), 4 (TIP)
    // Index: 5 (MCP), 6 (PIP), 7 (DIP), 8 (TIP)
    // Middle: 9 (MCP), 10 (PIP), 11 (DIP), 12 (TIP)
    // Ring: 13 (MCP), 14 (PIP), 15 (DIP), 16 (TIP)
    // Pinky: 17 (MCP), 18 (PIP), 19 (DIP), 20 (TIP)

    // A finger (index, middle, ring, pinky) is extended if its TIP distance to wrist
    // is noticeably greater than PIP joint distance to wrist.
    const isIndexExtended = this.distance(landmarks[8], wrist) > this.distance(landmarks[6], wrist) * 1.15;
    const isMiddleExtended = this.distance(landmarks[12], wrist) > this.distance(landmarks[10], wrist) * 1.15;
    const isRingExtended = this.distance(landmarks[16], wrist) > this.distance(landmarks[14], wrist) * 1.15;
    const isPinkyExtended = this.distance(landmarks[20], wrist) > this.distance(landmarks[18], wrist) * 1.15;

    // Thumb detection:
    // Check distance between thumb tip and pinky base (MCP 17) vs thumb IP (3) to pinky base.
    const thumbTipToPinky = this.distance(landmarks[4], landmarks[17]);
    const thumbIpToPinky = this.distance(landmarks[3], landmarks[17]);
    const isThumbExtended = thumbTipToPinky > thumbIpToPinky * 1.25;

    // Hitchhiker thumb gesture (Thumb extended sideways / Hitchhiker pose)
    // Either thumb is extended while other 4 fingers are curled, OR thumb is stretched far outwards.
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

    // Calculate standard finger count (0 to 5)
    let count = 0;
    if (isIndexExtended) count++;
    if (isMiddleExtended) count++;
    if (isRingExtended) count++;
    if (isPinkyExtended) count++;
    if (isThumbExtended) count++;

    return { fingers, count };
  }

  /**
   * Maps right hand finger count and thumb state to the musical scale.
   * Mappings:
   * 0 (Fist) -> A (Root)
   * 1 Finger -> B
   * 2 Fingers -> C
   * 3 Fingers -> D
   * 4 Fingers -> E
   * 5 Fingers (Palm) -> F
   * Hitchhiker Thumb Pose -> G
   */
  mapRightHandNote(fingerAnalysis) {
    const { fingers, count } = fingerAnalysis;

    // Priority 1: Check for Hitchhiker Thumb Pose (G Note)
    if (fingers.isHitchhiker && (!fingers.index || count === 1 || count >= 5)) {
      if (fingers.thumb && (!fingers.index || count >= 5)) {
        return { note: 'G', label: 'Hitchhiker (G)', count: '👍 G' };
      }
    }

    // Priority 2: Standard finger count mappings
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
   * Maps left hand finger count to active instrument or sound effect.
   */
  mapLeftHandInstrument(count, isChaosMode) {
    if (!isChaosMode) {
      // Instrumental Mode
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
          return { id: 'piano', name: 'Grand Piano (Default)', count: count };
      }
    } else {
      // Chaos Mode
      switch (count) {
        case 1:
          return { id: 'airhorn', name: 'Heavy Airhorn 📢', count: 1 };
        case 2:
          return { id: 'squeak', name: 'Cartoon Squeaky Toy 🐤', count: 2 };
        case 3:
          return { id: 'explosion', name: 'Deep-Fried Boom 💥', count: 3 };
        case 4:
          return { id: 'fhaaa', name: 'Fhaaaaa... 😩', count: 4 };
        case 5:
          return { id: 'meme', name: 'Meme Roulette 🎲', count: 5 };
        default:
          return { id: 'none', name: 'Standby', count: count };
      }
    }
  }

  /**
   * Calculates horizontal pitch bend based on right wrist X coordinate.
   * Screen left = lower pitch (-1200 cents), Screen right = higher pitch (+1200 cents).
   */
  calculatePitchBend(wristLandmark) {
    // In mirrored canvas display:
    // User moving hand rightward corresponds to visual right (1 - wristLandmark.x).
    const visualX = 1.0 - wristLandmark.x;

    // Normalize from active center range [0.2, 0.8] into [-1.0, 1.0]
    const clamped = Math.max(0.15, Math.min(0.85, visualX));
    const normalized = (clamped - 0.5) / 0.35; // Range roughly -1 to +1

    // Pitch bend in cents: -1200 cents (1 octave down) to +1200 cents (1 octave up)
    const cents = Math.round(normalized * 1200);

    return {
      cents: cents,
      normalized: Math.max(-1, Math.min(1, normalized)),
      visualX: visualX
    };
  }

  /**
   * Checks for Chaos Mode Flashbang Trigger:
   * Triggers when the right hand transitions suddenly from a Fist (0 fingers)
   * to a Full Open Palm (5 fingers).
   */
  checkFlashbangTrigger(currentFingers, isChaosMode) {
    if (!isChaosMode) return false;

    const now = Date.now();

    // Track when fist was active
    if (currentFingers === 0) {
      this.lastFistTimestamp = now;
    }

    // If currently full open palm, and fist was held within the last 800ms
    // and flashbang cooldown (3.5 seconds) has elapsed
    if (currentFingers === 5 && this.prevRightFingers < 2) {
      if (now - this.lastFistTimestamp < 800 && now - this.lastFlashbangTimestamp > 3500) {
        this.lastFlashbangTimestamp = now;
        return true;
      }
    }

    this.prevRightFingers = currentFingers;
    return false;
  }
}
