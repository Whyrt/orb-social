import React, { useState, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

function MediaViewer({ media, onClose }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);
    const prevMediaRef = useRef(null);

    // Use render-phase state update pattern for resetting when media changes
    if (media !== prevMediaRef.current) {
        prevMediaRef.current = media;
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }

    const bind = useDrag(({ offset: [x, y], cancel }) => {
        if (scale === 1) cancel();
        setPosition({ x, y });
    }, {
        from: () => [position.x, position.y],
        enabled: !!media
    });

    if (!media) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center backdrop-blur-sm grid-pattern" onClick={onClose}>
            <div className="absolute top-4 right-4 z-[510]">
                <button onClick={onClose} className="w-9 h-9 terminal-border flex items-center justify-center text-white/60 hover:text-white press-effect bg-black/50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div className="terminal-header absolute top-4 left-1/2 -translate-x-1/2 z-[510]">
                <span className="tech-label">IMAGE</span>
            </div>
            <div {...bind()} className="w-full h-full flex items-center justify-center p-8">
                <animated.img
                    ref={imgRef}
                    src={media.url}
                    className="max-w-full max-h-full object-contain will-change-transform"
                    style={{ x: position.x, y: position.y, scale }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

export default MediaViewer;
