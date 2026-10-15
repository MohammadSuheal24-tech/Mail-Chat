import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioVoicePlayerProps {
  src?: string;
  duration?: number;
  isMe: boolean;
}

export const AudioVoicePlayer: React.FC<AudioVoicePlayerProps> = ({ src, duration = 0, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate randomized waveform heights for voice note visualization
  const waveformBars = useRef<number[]>(
    Array.from({ length: 28 }, (_, i) => Math.max(15, Math.sin(i * 0.45) * 50 + 45 + (i % 3) * 10))
  ).current;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.log('Audio playback error:', e));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * audioDuration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1.5 px-1 min-w-[240px] max-w-[320px]">
      {src && <audio ref={audioRef} src={src} preload="metadata" />}

      {/* Play/Pause round button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isMe
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
      </button>

      {/* Waveform and progress */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div
          className="h-7 flex items-center gap-[2.5px] cursor-pointer relative"
          onClick={handleSeek}
          title="Click to seek"
        >
          {waveformBars.map((height, idx) => {
            const barProgress = (idx / waveformBars.length) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <div
                key={idx}
                className="w-1 rounded-full transition-colors duration-100"
                style={{
                  height: `${height}%`,
                  backgroundColor: isPlayed
                    ? '#00a884'
                    : isMe
                    ? 'rgba(0, 0, 0, 0.25)'
                    : 'rgba(100, 116, 139, 0.4)',
                }}
              />
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums leading-none text-slate-500 dark:text-slate-400">
          <span>{formatSeconds(isPlaying ? currentTime : audioDuration)}</span>
          <div className="flex items-center gap-1 text-[10px] opacity-75">
            <Volume2 className="w-3 h-3" />
            <span>Voice note</span>
          </div>
        </div>
      </div>
    </div>
  );
};
