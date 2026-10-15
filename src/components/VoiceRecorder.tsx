import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, StopCircle } from 'lucide-react';
import { api } from '../services/api.js';

interface VoiceRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        // Real-time audio analyzer for visualizer
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!mounted) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVolumeLevel(avg / 255); // 0 to 1
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (e) {
          // Fallback if AudioContext is blocked
        }

        mediaRecorder.start(200);
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      } catch (err) {
        console.error('Microphone access denied or error:', err);
        alert('Could not access microphone. Please check your browser microphone permissions.');
        onCancel();
      }
    }

    startRecording();

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCancel = () => {
    cleanup();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const handleFinishAndSend = async () => {
    if (!mediaRecorderRef.current) return;
    setIsProcessing(true);
    const recordedDuration = Math.max(1, duration);

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      cleanup();
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          try {
            const uploadRes = await api.uploadFile(base64Data, `voice_${Date.now()}.webm`, 'audio/webm');
            onSend(uploadRes.url, recordedDuration);
          } catch (uploadErr) {
            // If upload fails, fallback to direct data URL
            onSend(base64Data, recordedDuration);
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (e) {
        console.error('Failed processing voice note:', e);
        setIsProcessing(false);
        onCancel();
      }
    };

    recorder.stop();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-emerald-50 dark:bg-[#1f2c34] rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm animate-in fade-in duration-200">
      {/* Delete / Cancel button */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={isProcessing}
        className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
        title="Discard recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording status & Live waveform animation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full bg-rose-500 transition-transform duration-100"
            style={{ transform: `scale(${1 + volumeLevel * 0.8})` }}
          />
          <span className="font-mono text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {formatTime(duration)}
          </span>
        </div>

        {/* Live waveform bars */}
        <div className="flex items-center gap-1 h-6">
          {Array.from({ length: 12 }).map((_, i) => {
            const heightMultiplier = Math.sin((i + duration * 2) * 0.8) * 0.4 + 0.6;
            const dynamicHeight = Math.max(20, (volumeLevel * 100 * heightMultiplier) + 15);
            return (
              <div
                key={i}
                className="w-1 rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-75"
                style={{ height: `${Math.min(100, dynamicHeight)}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Send recording button */}
      <button
        type="button"
        onClick={handleFinishAndSend}
        disabled={isProcessing}
        className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
        title="Send voice message"
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4 ml-0.5" />
        )}
      </button>
    </div>
  );
};
