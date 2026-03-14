import React, { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom, globalPlayerAtom, viewAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

/**
 * MenuView - Main Dashboard
 * Layout: Clean, minimal center with status indicators at top
 * Center screen is intentionally FREE for the 3D Neural Sphere visualization
 */
export default function MenuView() {
    const user = useAtomValue(userAtom);
    const globalPlayer = useAtomValue(globalPlayerAtom);
    const setView = useSetAtom(viewAtom);
    const { setGlobalPlayerState } = useActions();
    const { isMobile, isDesktop } = useDevice();

    const [showNotifications, setShowNotifications] = useState(false);
    const hasAudio = !!globalPlayer.src;

    // Live frequency/amp display updates
    const [freq, setFreq] = useState(() => (Math.random() * 100).toFixed(1));
    const [amp, setAmp] = useState(() => (Math.random() * 100).toFixed(0));

    useEffect(() => {
        const interval = setInterval(() => {
            setFreq((Math.random() * 100).toFixed(1));
            setAmp((Math.random() * 100).toFixed(0));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenMap = () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
        setView('map');
    };

    return (
        <div className="absolute inset-0 flex flex-col overflow-hidden grid-pattern"
             style={{ backgroundColor: 'var(--background)' }}>

            {/* TOP BAR - Status indicators (does not block center) */}
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto px-4 pt-4">
                <div className="flex justify-between items-start">
                    {/* Left: User initial */}
                    <div className="terminal-window px-3 py-2" style={{ backgroundColor: 'var(--terminal-bg)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 terminal-border flex items-center justify-center text-xs font-mono"
                                 style={{ color: 'var(--foreground)' }}>
                                {user?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="text-[6px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Node</div>
                                <div className="text-[8px] font-mono" style={{ color: 'var(--foreground)' }}>{user || 'UNKNOWN'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Notification button */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="terminal-window w-10 h-10 flex items-center justify-center press-effect transition-colors"
                        style={{ backgroundColor: 'var(--terminal-bg)', color: 'var(--foreground-muted)' }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                            <rect x="3" y="3" width="18" height="18"/>
                            <line x1="3" y1="9" x2="21" y2="9"/>
                            <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* CENTER SCREEN - INTENTIONALLY EMPTY for 3D Neural Sphere */}
            {/* The center is now completely free for the background visualization */}

            {/* Floating Map Button - Above Bottom Bar */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1500] pointer-events-auto">
                <button
                    onClick={handleOpenMap}
                    className="map-access-button terminal-border"
                    style={{
                        backgroundColor: 'var(--background-elevated)',
                        color: 'var(--foreground)',
                        backdropFilter: 'blur(10px)'
                    }}
                    aria-label="Open map"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                        <line x1="9" y1="3" x2="9" y2="18"/>
                        <line x1="15" y1="6" x2="15" y2="21"/>
                    </svg>
                    <span className="map-button-label">Map</span>
                </button>
            </div>

            {/* Note: Bottom navigation bar is handled by BottomBar component in Orb.js */}
        </div>
    );
}
