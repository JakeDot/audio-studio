import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { engine } from './audio/engine';
import { TrackData } from './types';
import { Transport } from './components/Transport';
import { TrackRow } from './components/TrackRow';

const INITIAL_TRACKS: TrackData[] = [
  { id: '1', name: 'Kick', instrument: 'kick', volume: -6, muted: false, solo: false, sequence: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
  { id: '2', name: 'Snare', instrument: 'snare', volume: -6, muted: false, solo: false, sequence: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
  { id: '3', name: 'HiHat', instrument: 'hihat', volume: -12, muted: false, solo: false, sequence: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] },
  { id: '4', name: 'Bass', instrument: 'bass', volume: -6, muted: false, solo: false, sequence: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false] },
];

export default function App() {
  const [tracks, setTracks] = useState<TrackData[]>(INITIAL_TRACKS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Use a ref for tracks so the audio callback always has the latest sequence
  const tracksRef = useRef(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Initialize engine and tracks
  useEffect(() => {
    tracks.forEach(t => {
      engine.createTrack(t.id, t.instrument);
      engine.updateTrack(t.id, t.volume, t.muted, t.solo);
    });
    
    // Setup sequencer loop
    const loopId = Tone.Transport.scheduleRepeat((time) => {
      // We need to know the current step.
      // Tone.Transport.position gives us "bars:beats:sixteenths"
      const position = Tone.Transport.position.toString().split(':');
      const beat = parseInt(position[1]);
      const sixteenth = Math.floor(parseFloat(position[2]));
      const step = (beat * 4) + sixteenth;
      
      // Trigger notes
      tracksRef.current.forEach(track => {
        if (track.sequence[step] && !track.muted) {
          // If any track is soloed, only play soloed tracks
          const anySolo = tracksRef.current.some(t => t.solo);
          if (!anySolo || track.solo) {
            engine.playNote(track.id, track.instrument, time);
          }
        }
      });

      // Update UI
      Tone.Draw.schedule(() => {
        setCurrentStep(step);
      }, time);
    }, '16n');

    return () => {
      Tone.Transport.clear(loopId);
    };
  }, []); // Run once on mount

  const handlePlayPause = async () => {
    await engine.init(); // Ensure audio context is started
    if (isPlaying) {
      Tone.Transport.pause();
      engine.stopAll();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    Tone.Transport.stop();
    engine.stopAll();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    engine.setBpm(newBpm);
  };

  const handleAddTrack = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTrack: TrackData = {
      id,
      name: 'New Track',
      instrument: 'synth',
      volume: -6,
      muted: false,
      solo: false,
      sequence: Array(16).fill(false),
    };
    engine.createTrack(id, 'synth');
    setTracks([...tracks, newTrack]);
  };

  const handleUpdateTrack = (id: string, updates: Partial<TrackData>) => {
    setTracks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        if (updates.instrument) {
          engine.updateInstrument(id, updates.instrument);
        }
        if (updates.volume !== undefined || updates.muted !== undefined || updates.solo !== undefined) {
          engine.updateTrack(id, updated.volume, updated.muted, updated.solo);
        }
        return updated;
      }
      return t;
    }));
  };

  const handleDeleteTrack = (id: string) => {
    engine.disposeTrack(id);
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto flex flex-col h-screen">
        {/* Header */}
        <header className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">BeatWeaver Studio</h1>
        </header>

        {/* Transport */}
        <Transport
          isPlaying={isPlaying}
          bpm={bpm}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onBpmChange={handleBpmChange}
          onAddTrack={handleAddTrack}
        />

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-3">
            {tracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                currentStep={currentStep}
                onUpdate={handleUpdateTrack}
                onDelete={handleDeleteTrack}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
