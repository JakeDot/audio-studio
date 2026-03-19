import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { engine } from '../audio/engine';

interface VisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export function VisualizerModal({ isOpen, onClose }: VisualizerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prompt, setPrompt] = useState('A neon hologram of a futuristic city pulsing to the beat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    let animationFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationFrame = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      const values = engine.analyser.getValue();
      
      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ec4899'; // pink-500
      
      for (let i = 0; i < values.length; i++) {
        const val = values[i] as number;
        const x = width * (i / (values.length - 1));
        const y = (0.5 + val * 0.5) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationFrame);
  }, [isOpen]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setStatus('Checking API Key...');
      
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("No API key available");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      setStatus('Starting video generation (this takes a few minutes)...');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus('Generating video... Please wait, this can take 2-3 minutes.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("No video URI returned");

      setStatus('Downloading video...');
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });
      
      const blob = await response.blob();
      setVideoUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      console.error(err);
      setStatus('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="text-indigo-400" />
            Visualizer & Music Video
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative aspect-video bg-black w-full flex-1 overflow-hidden flex items-center justify-center">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              autoPlay 
              loop 
              muted 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-pink-900/20" />
          )}
          
          <canvas 
            ref={canvasRef}
            width={1024}
            height={512}
            className="absolute inset-0 w-full h-full z-10"
            style={{ filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.5))' }}
          />
          
          {isGenerating && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-white font-medium text-lg">{status}</p>
              <p className="text-zinc-400 text-sm mt-2 max-w-md text-center">
                Veo is rendering your music video. This process typically takes a few minutes.
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 z-10">
          <div className="flex gap-3">
            <input 
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your music video..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Video size={18} />
              {isGenerating ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
          {status && !isGenerating && (
            <p className="text-sm text-red-400 mt-2">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
