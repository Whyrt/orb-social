import React, { useState, useRef, useEffect } from 'react';

function PersistentPlayer({ player, setPlayer, audioRef }) {
    const [currentTime, setCurrentTime] = useState(0);
    const progressRef = useRef(null);

    const handleSeek = (e) => {
        if (!progressRef.current || !audioRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.min(Math.max(x / rect.width, 0), 1);
        audioRef.current.currentTime = percent * audioRef.current.duration;
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !player.src) return;
        if (audio.src !== player.src) { audio.src = player.src; audio.load(); }
        if (player.isPlaying) audio.play().catch(() => {});
        else audio.pause();
    }, [player.isPlaying, player.src, audioRef]);

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!player.src) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[2000] pointer-events-auto animate-soft-switch">
            <div className="terminal-window overflow-hidden" style={{ backgroundColor: 'var(--terminal-bg)' }}>
                <div className="terminal-header">
                    <span className="tech-label">AUDIO</span>
                    <div className="terminal-controls">
                        <div className="terminal-dot"></div>
                    </div>
                </div>
                <audio
                    ref={audioRef} crossOrigin="anonymous" loop={true}
                    onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
                    onLoadedMetadata={() => setPlayer(prev => ({ ...prev, duration: audioRef.current.duration }))}
                    onEnded={() => setPlayer(prev => ({ ...prev, isPlaying: false }))}
                    className="hidden" playsInline
                />
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <button 
                            onClick={() => setPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }))} 
                            className="w-8 h-8 flex-shrink-0 flex items-center justify-center press-effect terminal-border flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                        >
                            {player.isPlaying ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="5" width="4" height="14"/>
                                    <rect x="14" y="5" width="4" height="14"/>
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            )}
                        </button>
                        <div className="overflow-hidden min-w-0">
                            <p className="text-[10px] uppercase tracking-widest truncate" style={{ color: 'var(--foreground)' }}>
                                {player.title}
                            </p>
                            <p className="text-[7px] uppercase tracking-widest truncate" style={{ color: 'var(--foreground-dim)' }}>
                                {player.artist.startsWith('@') ? player.artist : `@${player.artist}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[7px] mono whitespace-nowrap" style={{ color: 'var(--foreground-muted)' }}>
                            {formatTime(currentTime)}
                        </span>
                        <button 
                            onClick={() => setPlayer({ isPlaying: false, src: null, title: '', artist: '' })} 
                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center press-effect"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div 
                    ref={progressRef} 
                    onClick={handleSeek} 
                    className="h-[2px] w-full cursor-pointer relative overflow-hidden"
                    style={{ backgroundColor: 'var(--border-color)' }}
                >
                    <div 
                        className="h-full transition-all duration-100" 
                        style={{ 
                            width: `${Math.min((currentTime / (player.duration || 1)) * 100, 100)}%`,
                            backgroundColor: 'var(--accent)'
                        }} 
                    />
                </div>
            </div>
        </div>
    );
}
export default PersistentPlayer;
