import * as Tone from 'tone';
import { InstrumentType } from '../types';

class AudioEngine {
  private synths: Map<string, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth | Tone.FMSynth | Tone.AMSynth> = new Map();
  private players: Map<string, Tone.Player> = new Map();
  private channels: Map<string, Tone.Channel> = new Map();
  private reverbs: Map<string, Tone.Freeverb> = new Map();
  private delays: Map<string, Tone.FeedbackDelay> = new Map();
  private initialized = false;

  public analyser = new Tone.Analyser('waveform', 256);

  public async init() {
    if (this.initialized) return;
    await Tone.start();
    Tone.getDestination().connect(this.analyser);
    Tone.Transport.bpm.value = 120;
    this.initialized = true;
  }

  public setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public createTrack(id: string, type: InstrumentType) {
    if (this.channels.has(id)) return;

    const reverb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000 });
    reverb.wet.value = 0;
    const delay = new Tone.FeedbackDelay("8n", 0.4);
    delay.wet.value = 0;
    const channel = new Tone.Channel();

    channel.chain(delay, reverb, Tone.Destination);

    this.channels.set(id, channel);
    this.reverbs.set(id, reverb);
    this.delays.set(id, delay);

    this.setupInstrument(id, type);
  }

  private setupInstrument(id: string, type: InstrumentType) {
    const channel = this.channels.get(id)!;
    
    if (type === 'vocal') {
      const player = new Tone.Player().connect(channel);
      this.players.set(id, player);
    } else {
      let synth;
      switch (type) {
        case 'kick':
          synth = new Tone.MembraneSynth().connect(channel);
          break;
        case 'snare':
          synth = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
          }).connect(channel);
          break;
        case 'hihat':
          synth = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
          }).connect(channel);
          synth.frequency.value = 200;
          break;
        case 'bass':
          synth = new Tone.FMSynth({
            harmonicity: 0.5,
            modulationIndex: 1.2,
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 }
          }).connect(channel);
          break;
        case 'synth':
          synth = new Tone.AMSynth().connect(channel);
          break;
        case 'pluck':
          synth = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
          }).connect(channel);
          break;
      }
      if (synth) {
        this.synths.set(id, synth);
      }
    }
  }

  public updateTrack(id: string, volume: number, muted: boolean, solo: boolean, reverbAmt: number, delayAmt: number) {
    const channel = this.channels.get(id);
    if (channel) {
      channel.volume.value = volume;
      channel.mute = muted;
      channel.solo = solo;
    }
    const reverb = this.reverbs.get(id);
    if (reverb) reverb.wet.value = reverbAmt;
    
    const delay = this.delays.get(id);
    if (delay) delay.wet.value = delayAmt;
  }

  public updateInstrument(id: string, type: InstrumentType) {
    const oldSynth = this.synths.get(id);
    if (oldSynth) {
      oldSynth.dispose();
      this.synths.delete(id);
    }
    const oldPlayer = this.players.get(id);
    if (oldPlayer) {
      oldPlayer.dispose();
      this.players.delete(id);
    }
    
    this.setupInstrument(id, type);
  }

  public async setVocalBuffer(id: string, base64Pcm: string): Promise<number | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;

    try {
      const binaryString = window.atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const audioContext = Tone.getContext().rawContext as AudioContext;
      const audioBuffer = audioContext.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768.0;
      }

      const toneBuffer = new Tone.ToneAudioBuffer(audioBuffer);
      player.buffer = toneBuffer;
      return toneBuffer.duration;
    } catch (err) {
      console.error("Failed to decode vocal buffer", err);
      return undefined;
    }
  }

  public playNote(id: string, type: InstrumentType, time: number) {
    if (type === 'vocal') {
      const player = this.players.get(id);
      if (player && player.loaded) {
        player.start(time);
      }
    } else {
      const synth = this.synths.get(id);
      if (!synth) return;

      switch (type) {
        case 'kick':
          (synth as Tone.MembraneSynth).triggerAttackRelease('C1', '8n', time);
          break;
        case 'snare':
          (synth as Tone.NoiseSynth).triggerAttackRelease('16n', time);
          break;
        case 'hihat':
          (synth as Tone.MetalSynth).triggerAttackRelease('32n', time, 0.3);
          break;
        case 'bass':
          (synth as Tone.FMSynth).triggerAttackRelease('C2', '16n', time);
          break;
        case 'synth':
          (synth as Tone.AMSynth).triggerAttackRelease('C4', '16n', time);
          break;
        case 'pluck':
          (synth as Tone.Synth).triggerAttackRelease('C5', '16n', time);
          break;
      }
    }
  }

  public disposeTrack(id: string) {
    this.synths.get(id)?.dispose();
    this.players.get(id)?.dispose();
    this.reverbs.get(id)?.dispose();
    this.delays.get(id)?.dispose();
    this.channels.get(id)?.dispose();
    
    this.synths.delete(id);
    this.players.delete(id);
    this.reverbs.delete(id);
    this.delays.delete(id);
    this.channels.delete(id);
  }

  public stopAll() {
    this.synths.forEach(synth => {
      if ('triggerRelease' in synth) {
        (synth as any).triggerRelease();
      }
    });
    this.players.forEach(player => {
      player.stop();
    });
  }
}

export const engine = new AudioEngine();

