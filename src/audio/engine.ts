import * as Tone from 'tone';
import { InstrumentType } from '../types';

class AudioEngine {
  private synths: Map<string, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth | Tone.FMSynth | Tone.AMSynth> = new Map();
  private channels: Map<string, Tone.Channel> = new Map();
  private initialized = false;

  public async init() {
    if (this.initialized) return;
    await Tone.start();
    Tone.Transport.bpm.value = 120;
    this.initialized = true;
  }

  public setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public createTrack(id: string, type: InstrumentType) {
    if (this.synths.has(id)) return;

    const channel = new Tone.Channel().toDestination();
    this.channels.set(id, channel);
    
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
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5
        }).connect(channel);
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
    this.synths.set(id, synth);
  }

  public updateTrack(id: string, volume: number, muted: boolean, solo: boolean) {
    const channel = this.channels.get(id);
    if (channel) {
      channel.volume.value = volume;
      channel.mute = muted;
      channel.solo = solo;
    }
  }

  public updateInstrument(id: string, type: InstrumentType) {
    const oldSynth = this.synths.get(id);
    if (oldSynth) {
      oldSynth.dispose();
    }
    const oldChannel = this.channels.get(id);
    if (oldChannel) {
      oldChannel.dispose();
    }
    this.synths.delete(id);
    this.channels.delete(id);
    
    this.createTrack(id, type);
  }

  public playNote(id: string, type: InstrumentType, time: number) {
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

  public disposeTrack(id: string) {
    this.synths.get(id)?.dispose();
    this.channels.get(id)?.dispose();
    this.synths.delete(id);
    this.channels.delete(id);
  }

  public stopAll() {
    this.synths.forEach(synth => {
      if ('triggerRelease' in synth) {
        (synth as any).triggerRelease();
      }
    });
  }
}

export const engine = new AudioEngine();
