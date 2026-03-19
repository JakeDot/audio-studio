import React from 'react';
import { Play, Square, Plus, Settings } from 'lucide-react';

interface TransportProps {
  isPlaying: boolean;
  bpm: number;
  onPlayPause: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onAddTrack: () => void;
}

export function Transport({
  isPlaying,
  bpm,
  onPlayPause,
  onStop,
  onBpmChange,
  onAddTrack,
}: TransportProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onPlayPause}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20"
        >
          {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>
        
        <button
          onClick={onStop}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <Square size={16} />
        </button>

        <div className="flex flex-col gap-1 ml-4">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Tempo ({bpm} BPM)
          </label>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value))}
            className="w-32 accent-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onAddTrack}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Track
        </button>
      </div>
    </div>
  );
}
