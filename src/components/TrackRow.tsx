import React from 'react';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { InstrumentType, TrackData } from '../types';
import { cn } from '../lib/utils';

interface TrackRowProps {
  track: TrackData;
  currentStep: number;
  onUpdate: (id: string, updates: Partial<TrackData>) => void;
  onDelete: (id: string) => void;
}

const INSTRUMENTS: { value: InstrumentType; label: string }[] = [
  { value: 'kick', label: 'Kick Drum' },
  { value: 'snare', label: 'Snare' },
  { value: 'hihat', label: 'Hi-Hat' },
  { value: 'bass', label: 'FM Bass' },
  { value: 'synth', label: 'AM Synth' },
  { value: 'pluck', label: 'Pluck' },
];

export function TrackRow({ track, currentStep, onUpdate, onDelete }: TrackRowProps) {
  const toggleStep = (index: number) => {
    const newSequence = [...track.sequence];
    newSequence[index] = !newSequence[index];
    onUpdate(track.id, { sequence: newSequence });
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
      {/* Track Controls */}
      <div className="flex flex-col gap-2 w-48 shrink-0">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={track.name}
            onChange={(e) => onUpdate(track.id, { name: e.target.value })}
            className="bg-transparent text-sm font-medium text-zinc-100 focus:outline-none w-24"
          />
          <button
            onClick={() => onDelete(track.id)}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Del
          </button>
        </div>

        <select
          value={track.instrument}
          onChange={(e) => onUpdate(track.id, { instrument: e.target.value as InstrumentType })}
          className="bg-zinc-800 text-xs text-zinc-300 rounded px-2 py-1 border border-zinc-700 outline-none focus:border-indigo-500"
        >
          {INSTRUMENTS.map((inst) => (
            <option key={inst.value} value={inst.value}>
              {inst.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(track.id, { muted: !track.muted })}
            className={cn(
              "p-1.5 rounded transition-colors",
              track.muted ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            )}
            title="Mute"
          >
            {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={() => onUpdate(track.id, { solo: !track.solo })}
            className={cn(
              "p-1.5 rounded transition-colors",
              track.solo ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            )}
            title="Solo"
          >
            <Headphones size={14} />
          </button>
          <input
            type="range"
            min="-60"
            max="6"
            step="1"
            value={track.volume}
            onChange={(e) => onUpdate(track.id, { volume: parseFloat(e.target.value) })}
            className="w-16 accent-indigo-500"
          />
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
        {track.sequence.map((isActive, i) => (
          <button
            key={i}
            onClick={() => toggleStep(i)}
            className={cn(
              "h-12 flex-1 min-w-[2rem] rounded-md transition-all duration-75 border",
              isActive 
                ? "bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
              currentStep === i && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900",
              i % 4 === 0 && !isActive && "bg-zinc-700/50" // Highlight downbeats
            )}
          />
        ))}
      </div>
    </div>
  );
}
