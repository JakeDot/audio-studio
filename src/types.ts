export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'bass' | 'synth' | 'pluck';

export interface TrackData {
  id: string;
  name: string;
  instrument: InstrumentType;
  volume: number; // in decibels, e.g., -60 to 6
  muted: boolean;
  solo: boolean;
  sequence: boolean[]; // 16 steps
}
