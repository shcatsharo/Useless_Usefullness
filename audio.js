/**
 * AIR SYNTH - AUDIO SYNTHESIS ENGINE
 * Features dual acoustic profiles for all 5 instruments:
 * - Sustained Profile: Sings & sustains as long as your finger is held up; cuts off cleanly when lowered or changed.
 * - Sustainless Profile: Punchy, staccato, percussive plucks & hits that decay quickly even while held.
 * - Instant cutoff when changing notes (no overlapping muddy chords).
 */

export class AudioEngine {
  constructor() {
    this.isInitialized = false;
    this.currentInstrument = 'piano';
    this.currentNote = null;
    this.currentCents = 0;
    this.isChaosMode = false;
    this.isSustainOn = false;
    this.isChipiPlaying = false;

    this.noteFrequencies = {
      'A': 'A3',
      'B': 'B3',
      'C': 'C4',
      'D': 'D4',
      'E': 'E4',
      'F': 'F4',
      'G': 'G4'
    };

    // Custom meme sounds
    this.customSounds = {
      metalPipe: new Audio('sounds/Metal pipe.mp3'),
      yippee: new Audio('sounds/yippee.mp3'),
      explosion: new Audio('sounds/explosion.mp3'),
      huh: new Audio('sounds/huh.mp3'),
      marioJump: new Audio('sounds/Mario Jump.mp3'),
      uwu: new Audio('sounds/uwu.mp3'),
      chipiChapa: new Audio('sounds/Chipi Chipi Chapa Chapa.mp3'),
      flashbang: new Audio('sounds/fahhhhh.mp3')
    };

    Object.values(this.customSounds).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.9;
    });
  }

  async init() {
    if (this.isInitialized) return;

    await Tone.start();
    Tone.context.lookAhead = 0.03;

    this.masterLimiter = new Tone.Limiter(-1).toDestination();
    this.masterReverb = new Tone.Reverb({ decay: 2.0, preDelay: 0.01, wet: 0.2 }).connect(this.masterLimiter);

    // 1. Build Sustained Instruments (Note sustains continuously while finger is up)
    this.buildSustainedInstruments();

    // 2. Build Sustainless Instruments (Crisp staccato plucks & stabs)
    this.buildSustainlessInstruments();

    this.isInitialized = true;
  }

  /**
   * SUSTAINED PROFILES: Holds full tone while finger is up,
   * releases cleanly when lowered.
   */
  buildSustainedInstruments() {
    // 1. Piano (Sustained grand piano)
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0.75, release: 0.25 }
    }).connect(this.masterReverb);
    piano.volume.value = 0;

    // 2. Cello / Acoustic Guitar (Rich bowed note holding long)
    const cello = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2.5, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.06, decay: 1.2, sustain: 0.85, release: 0.3 },
      filterEnvelope: { attack: 0.04, decay: 0.8, sustain: 0.6, release: 0.3, baseFrequency: 200, octaves: 3 }
    }).connect(this.masterReverb);
    cello.volume.value = -3;

    // 3. Saxophone / Brass (Continuous horn sustain)
    const brass = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.01,
      modulationIndex: 3.5,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.04, decay: 0.8, sustain: 0.85, release: 0.25 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.05, decay: 0.5, sustain: 0.6, release: 0.25 }
    }).connect(this.masterReverb);
    brass.volume.value = -4;

    // 4. Flute / Harp (Airy sustained woodwind)
    const flute = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.0,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.06, decay: 0.8, sustain: 0.9, release: 0.25 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.08, decay: 0.4, sustain: 0.6, release: 0.25 }
    }).connect(this.masterReverb);
    flute.volume.value = -2;

    // 5. Orchestral Strings (Lush ensemble holding as long as gesture is held)
    const strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 25 },
      envelope: { attack: 0.12, decay: 1.2, sustain: 0.95, release: 0.35 }
    }).connect(this.masterReverb);
    strings.volume.value = -5;

    this.sustainedSynths = { piano, cello, brass, flute, strings };
  }

  /**
   * SUSTAINLESS PROFILES: Short, crisp, punchy staccato/pizzicato hits.
   * Decays quickly even if finger stays up!
   */
  buildSustainlessInstruments() {
    // 1. Piano Staccato (Tight, dampened key hit)
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.005, decay: 0.25, sustain: 0.0, release: 0.05 }
    }).connect(this.masterReverb);
    piano.volume.value = 1;

    // 2. Cello / Guitar Pizzicato (Dry, crisp finger pluck)
    const cello = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      filter: { Q: 3.5, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.05 },
      filterEnvelope: { attack: 0.01, decay: 0.18, sustain: 0.0, release: 0.05, baseFrequency: 250, octaves: 2.5 }
    }).connect(this.masterReverb);
    cello.volume.value = -2;

    // 3. Brass Stab (Punchy, short trumpet jab)
    const brass = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.01,
      modulationIndex: 4.0,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0.0, release: 0.05 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.0, release: 0.05 }
    }).connect(this.masterReverb);
    brass.volume.value = -3;

    // 4. Flute Pip (Short, breathy staccato pip)
    const flute = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.0,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.16, sustain: 0.0, release: 0.05 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.02, decay: 0.12, sustain: 0.0, release: 0.05 }
    }).connect(this.masterReverb);
    flute.volume.value = -1;

    // 5. Strings Spiccato (Short, crisp orchestral chop)
    const strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0.0, release: 0.06 }
    }).connect(this.masterReverb);
    strings.volume.value = -4;

    this.sustainlessSynths = { piano, cello, brass, flute, strings };
  }

  setSustain(isOn) {
    if (this.isSustainOn !== isOn) {
      this.releaseAll(); // Clean release on toggle
      this.isSustainOn = isOn;
    }
  }

  setInstrument(instrumentId) {
    if (this.currentInstrument !== instrumentId) {
      this.releaseAll(); // Stop previous notes immediately on instrument change
      this.currentInstrument = instrumentId;
    }
  }

  /**
   * Returns active synth based on current instrument and Sustain toggle
   */
  getActiveSynth() {
    const synths = this.isSustainOn ? this.sustainedSynths : this.sustainlessSynths;
    return (synths && synths[this.currentInstrument]) || (this.sustainedSynths && this.sustainedSynths.piano);
  }

  /**
   * Plays note: IMMEDIATELY stops previous note so no overlapping chords occur!
   */
  playNote(noteLetter) {
    if (!this.isInitialized || this.isChaosMode) return;

    if (!noteLetter || !this.noteFrequencies[noteLetter]) {
      this.releaseAll();
      return;
    }

    const pitch = this.noteFrequencies[noteLetter];
    if (this.currentNote === pitch) return; // Keep sustaining current note

    // CRITICAL FIX: Cut off previous note completely before starting new note!
    this.releaseAll();

    const synth = this.getActiveSynth();
    synth.set({ detune: this.currentCents });
    synth.triggerAttack(pitch);
    this.currentNote = pitch;
  }

  setPitchBend(cents) {
    this.currentCents = cents;
    if (!this.isInitialized) return;
    const synth = this.getActiveSynth();
    try {
      synth.set({ detune: this.currentCents });
    } catch (e) {}
  }

  /**
   * Immediately stops all notes across all synths
   */
  releaseAll() {
    if (!this.isInitialized) return;
    try {
      if (this.sustainedSynths) {
        Object.values(this.sustainedSynths).forEach(s => s.releaseAll());
      }
      if (this.sustainlessSynths) {
        Object.values(this.sustainlessSynths).forEach(s => s.releaseAll());
      }
    } catch (e) {}
    this.currentNote = null;
  }

  playCustomAudio(soundKey) {
    const audio = this.customSounds[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Audio play error:', e));
    }
  }

  playChaosSound(effectId) {
    if (!this.isChaosMode) return;
    switch (effectId) {
      case 'metalPipe': this.playCustomAudio('metalPipe'); break;
      case 'yippee': this.playCustomAudio('yippee'); break;
      case 'explosion': this.playCustomAudio('explosion'); break;
      case 'huh': this.playCustomAudio('huh'); break;
      case 'marioJump': this.playCustomAudio('marioJump'); break;
    }
  }

  playUwU() {
    this.playCustomAudio('uwu');
  }

  startChipiChapa() {
    if (this.isChipiPlaying) return;
    const chipi = this.customSounds.chipiChapa;
    if (chipi) {
      chipi.loop = true;
      chipi.play().catch(e => console.warn(e));
      this.isChipiPlaying = true;
    }
  }

  stopChipiChapa() {
    if (!this.isChipiPlaying) return;
    const chipi = this.customSounds.chipiChapa;
    if (chipi) {
      chipi.pause();
      chipi.currentTime = 0;
      this.isChipiPlaying = false;
    }
  }

  triggerFlashbang() {
    this.playCustomAudio('flashbang');
  }
}
