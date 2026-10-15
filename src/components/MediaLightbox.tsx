import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MediaType } from '../types/chat.js';

interface MediaLightboxProps {
  mediaUrl: string;
  mediaType: MediaType;
  mediaName?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  mediaUrl,
  mediaType,
  mediaName,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = mediaName || `echochat_file_${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between text-white z-10">
        <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md opacity-80">
          {mediaName || 'Media preview'}
        </span>
        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Download media"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors ml-2"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-2">
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={mediaName || 'Preview'}
            referrerPolicy="no-referrer"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease' }}
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        ) : mediaType === 'video' ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
          />
        ) : null}
      </div>
    </div>
  );
};
