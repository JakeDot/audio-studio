export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'bass' | 'synth' | 'pluck' | 'vocal';

export interface TrackData {
  id: string;
  name: string;
  instrument: InstrumentType;
  volume: number; // in decibels, e.g., -60 to 6
  muted: boolean;
  solo: boolean;
  reverb: number; // 0 to 1
  delay: number; // 0 to 1
  sequence: boolean[]; // 16 steps
  lyrics?: string;
  vocalDuration?: number; // in seconds
}
