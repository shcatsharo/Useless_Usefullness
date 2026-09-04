/**
 * AIR SYNTH - AUDIO SYNTHESIS & CHAOS SOUND ENGINE
 * Powered by Tone.js: Synthesizes 5 realistic musical instruments,
 * real-time arm-slide pitch bend, procedural Chaos meme sound effects,
 * and the CS:GO-style Flashbang audio shockwave.
 */

export class AudioEngine {
  constructor() {
    this.isInitialized = false;
    this.currentInstrument = 'piano';
    this.currentNote = null;
    this.currentCents = 0;
    this.isChaosMode = false;
    this.memeIndex = 0;

    // Scale note frequency mappings (A Minor / C Major natural tones)
    this.noteFrequencies = {
      'A': 'A3',
      'B': 'B3',
      'C': 'C4',
      'D': 'D4',
      'E': 'E4',
      'F': 'F4',
      'G': 'G4'
    };
  }

  /**
   * Initializes Tone.js AudioContext on user gesture.
   */
  async init() {
    if (this.isInitialized) return;

    await Tone.start();
    Tone.context.lookAhead = 0.03; // Ultra-low latency for motion control

    // Master bus with Limiter to prevent clipping
    this.masterLimiter = new Tone.Limiter(-1).toDestination();
    this.masterReverb = new Tone.Reverb({ decay: 2.2, preDelay: 0.01, wet: 0.25 }).connect(this.masterLimiter);

    // Build the 5 Instrumental Synthesizers
    this.buildInstruments();

    // Build the Chaos Mode Generators
    this.buildChaosGenerators();

    this.isInitialized = true;
  }

  /**
   * Synthesizer presets for the 5 instruments
   */
  buildInstruments() {
    // 1. Grand Piano: Multi-stage acoustic percussive envelope with warm harmonics
    this.piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.005, decay: 1.5, sustain: 0.15, release: 1.2 }
    }).connect(this.masterReverb);
    this.piano.volume.value = 0;

    // 2. Cello / Acoustic Guitar: Warm sawtooth with resonant lowpass filter envelope
    this.cello = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      filter: { Q: 3, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.08, decay: 0.8, sustain: 0.4, release: 0.9 },
      filterEnvelope: { attack: 0.04, decay: 0.6, sustain: 0.3, release: 0.8, baseFrequency: 200, octaves: 3 }
    }).connect(this.masterReverb);
    this.cello.volume.value = -3;

    // 3. Saxophone / Brass: FM Synth with brassy harmonic bite
    this.brass = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.01,
      modulationIndex: 3.5,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.4 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.06, decay: 0.3, sustain: 0.3, release: 0.3 }
    }).connect(this.masterReverb);
    this.brass.volume.value = -4;

    // 4. Flute / Harp: Pure sine & subtle modulation with breathy release
    this.flute = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.0,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.09, decay: 0.5, sustain: 0.7, release: 0.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.5 }
    }).connect(this.masterReverb);
    this.flute.volume.value = -2;

    // 5. Orchestral Strings: Lush, detuned ensemble pad
    this.strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
      envelope: { attack: 0.25, decay: 1.0, sustain: 0.8, release: 1.5 }
    }).connect(this.masterReverb);
    this.strings.volume.value = -5;

    this.instruments = {
      piano: this.piano,
      cello: this.cello,
      brass: this.brass,
      flute: this.flute,
      strings: this.strings
    };
  }

  /**
   * Sound effect generators for Chaos Mode
   */
  buildChaosGenerators() {
    // Heavy Airhorn Synthesizer (Triple detuned saws)
    this.airhornSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.05 }
    }).connect(this.masterLimiter);
    this.airhornSynth.volume.value = 2;

    // Cartoon Squeaky Toy Synth
    this.squeakSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.08 }
    }).connect(this.masterLimiter);

    // Deep Fried Explosion Generator (Distortion + Noise + Sub Drop)
    this.distortion = new Tone.Distortion(0.9).connect(this.masterLimiter);
    this.explosionNoise = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.005, decay: 1.2, sustain: 0, release: 0.4 }
    }).connect(this.distortion);
    this.subDrop = new Tone.MembraneSynth().connect(this.distortion);
    this.subDrop.volume.value = 4;

    // Flashbang Tinnitus Ring Synth (High-pitched ringing oscillator)
    this.tinnitusRing = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 2.2, sustain: 0, release: 1.0 }
    }).connect(this.masterLimiter);
    this.tinnitusRing.volume.value = -6;

    // Meme Roulette Bell/Bong Synth
    this.memeSynth = new Tone.MetalSynth({
      frequency: 220,
      envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
      harmonicity: 4.1,
      modulationIndex: 28,
      resonance: 3500,
      octaves: 1.5
    }).connect(this.masterReverb);
  }

  /**
   * Sets active instrument for Left Hand
   */
  setInstrument(instrumentId) {
    if (this.instruments[instrumentId]) {
      if (this.currentInstrument !== instrumentId) {
        this.releaseAll();
        this.currentInstrument = instrumentId;
      }
    }
  }

  /**
   * Gets currently active synth
   */
  getActiveSynth() {
    return this.instruments[this.currentInstrument] || this.piano;
  }

  /**
   * Plays or updates the active musical note from Right Hand
   */
  playNote(noteLetter) {
    if (!this.isInitialized || this.isChaosMode) return;
    if (!noteLetter || !this.noteFrequencies[noteLetter]) {
      this.releaseAll();
      return;
    }

    const pitch = this.noteFrequencies[noteLetter];

    // If already playing this exact note, keep holding
    if (this.currentNote === pitch) return;

    this.releaseAll();
    const synth = this.getActiveSynth();
    synth.set({ detune: this.currentCents });
    synth.triggerAttack(pitch);
    this.currentNote = pitch;
  }

  /**
   * Updates pitch bend detune in real-time from horizontal wrist slide
   */
  setPitchBend(cents) {
    this.currentCents = cents;
    if (!this.isInitialized) return;

    const synth = this.getActiveSynth();
    try {
      synth.set({ detune: cents });
    } catch (e) {
      // Ignore rapid audio param updates
    }
  }

  /**
   * Stops all active notes smoothly
   */
  releaseAll() {
    if (!this.isInitialized) return;
    try {
      Object.values(this.instruments).forEach(synth => {
        synth.releaseAll();
      });
    } catch (e) {}
    this.currentNote = null;
  }

  /**
   * Triggers Chaos Mode Left Hand Sound Effects
   */
  playChaosSound(effectId) {
    if (!this.isInitialized || !this.isChaosMode) return;
    const now = Tone.now();

    switch (effectId) {
      case 'airhorn':
        // Classic MLG rhythmic triple airhorn blast
        const chord = ['F#5', 'A5', 'C6'];
        this.airhornSynth.triggerAttackRelease(chord, '16n', now);
        this.airhornSynth.triggerAttackRelease(chord, '16n', now + 0.12);
        this.airhornSynth.triggerAttackRelease(chord, '8n', now + 0.25);
        break;

      case 'squeak':
        // Squeaky toy pitch sweep
        this.squeakSynth.triggerAttackRelease('C6', '16n', now);
        this.squeakSynth.frequency.rampTo('F7', 0.08, now);
        this.squeakSynth.frequency.rampTo('G5', 0.1, now + 0.08);
        break;

      case 'explosion':
        // Deep fried bass boost explosion
        this.explosionNoise.triggerAttackRelease('8n', now);
        this.subDrop.triggerAttackRelease('C1', '2n', now, 1.0);
        break;

      case 'fhaaa':
        // Dramatic failing vocal formant sigh
        const sighSynth = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.1, decay: 0.8, sustain: 0, release: 0.2 }
        }).connect(this.masterLimiter);
        sighSynth.triggerAttack('G3', now);
        sighSynth.frequency.rampTo('C2', 0.7, now);
        break;

      case 'meme':
        // Meme sound roulette
        this.playMemeRoulette(now);
        break;
    }
  }

  /**
   * Plays a distinct procedural meme effect each time 5 fingers is shown
   */
  playMemeRoulette(now) {
    const memeTypes = ['tacoBell', 'bruh', 'metalPipe', 'windowsDing', 'bonk'];
    const chosen = memeTypes[this.memeIndex % memeTypes.length];
    this.memeIndex++;

    switch (chosen) {
      case 'tacoBell':
        // Taco Bell Bong
        this.memeSynth.triggerAttackRelease('F#2', '1n', now);
        break;

      case 'bruh':
        // Low pitched "Bruh" vocal sound
        const bruh = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.05, decay: 0.35, sustain: 0.1, release: 0.2 }
        }).connect(this.masterLimiter);
        bruh.triggerAttackRelease('B1', '4n', now);
        bruh.frequency.rampTo('G1', 0.25, now);
        break;

      case 'metalPipe':
        // Metal Pipe Falling Clatter
        this.memeSynth.triggerAttackRelease('C7', '16n', now, 0.9);
        this.memeSynth.triggerAttackRelease('F6', '16n', now + 0.06, 0.7);
        this.memeSynth.triggerAttackRelease('D6', '8n', now + 0.12, 0.8);
        break;

      case 'windowsDing':
        // Error Ding
        const ding = new Tone.PolySynth(Tone.Synth).connect(this.masterLimiter);
        ding.triggerAttackRelease(['C#5', 'G#5', 'C#6'], '8n', now);
        break;

      case 'bonk':
        // Cartoon Bonk
        const bonk = new Tone.MembraneSynth({ pitchDecay: 0.05 }).connect(this.masterLimiter);
        bonk.triggerAttackRelease('G4', '16n', now, 1.0);
        bonk.frequency.rampTo('C2', 0.1, now);
        break;
    }
  }

  /**
   * CS:GO / COD Style FLASHBANG Shockwave + Tinnitus Ring!
   */
  triggerFlashbang() {
    if (!this.isInitialized) return;
    const now = Tone.now();

    // 1. Massive concussive explosion blast
    this.explosionNoise.triggerAttackRelease('4n', now, 1.0);
    this.subDrop.triggerAttackRelease('A0', '1n', now, 1.0);

    // 2. High-pitched deafening tinnitus ringing (3800Hz sine wave slowly fading)
    this.tinnitusRing.triggerAttackRelease('3800', '2.5s', now + 0.05, 0.8);
  }
}
