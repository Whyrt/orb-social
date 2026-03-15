import React, { useState, useEffect, Suspense } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom, globalPlayerAtom, viewAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

// Dynamic import for MiniMapPreview to avoid SSR issues with Leaflet
const MiniMapPreview = React.lazy(() =>
    import('@/views/MapView').then(module => ({ default: module.MiniMapPreview }))
);

/**
 * MenuView - Main Dashboard (Home)
 * Redesigned to match reference design
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

            {/* TOP BAR - User info & notifications */}
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto px-4 pt-12 pb-4">
                <div className="flex justify-between items-center">
                    {/* Left: User info */}
                    <div className="card px-3 py-2" style={{ backgroundColor: 'var(--background-elevated)' }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                 style={{ 
                                     backgroundColor: 'var(--accent)', 
                                     color: 'var(--accent-text)' 
                                 }}>
                                {user?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>Welcome</div>
                                <div className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{user || 'User'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Notification button */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-10 h-10 card flex items-center justify-center press-effect relative"
                        style={{ backgroundColor: 'var(--background-elevated)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <div className="absolute top-2 right-2.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                    </button>
                </div>
            </div>

            {/* CENTER SCREEN - Live Map Preview Card */}
            <div className="absolute inset-0 z-40 pointer-events-auto flex items-center justify-center px-4">
                <div className="w-full max-w-md card overflow-hidden"
                     style={{
                         backgroundColor: 'var(--background-elevated)',
                         backdropFilter: 'blur(20px)',
                         borderRadius: '20px',
                         border: '1px solid var(--border-color)',
                         maxHeight: 'calc(100vh - 180px)'
                     }}>
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b"
                         style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                                    <line x1="9" y1="3" x2="9" y2="18"/>
                                    <line x1="15" y1="6" x2="15" y2="21"/>
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Live Map</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                                    <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>Real-time tracking</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleOpenMap}
                            className="px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider press-effect transition-all"
                            style={{ 
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-text)'
                            }}
                        >
                            Open
                        </button>
                    </div>

                    {/* Mini map preview - Client side only */}
                    <Suspense fallback={
                        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground-muted)', fontSize: '12px' }}>
                            Loading map...
                        </div>
                    }>
                        <MiniMapPreview
                            height={280}
                            onOpenMap={handleOpenMap}
                        />
                    </Suspense>

                    {/* Card footer - Quick stats */}
                    <div className="px-4 py-3 border-t"
                         style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>Frequency</div>
                                    <div className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>{freq} Hz</div>
                                </div>
                                <div>
                                    <div className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>Amplitude</div>
                                    <div className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>{amp}%</div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                 style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom spacing for navigation */}
            <div className="flex-shrink-0" style={{ height: '100px' }}></div>
        </div>
    );
}
