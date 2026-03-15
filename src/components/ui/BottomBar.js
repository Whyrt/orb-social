import React from 'react';

const BottomBar = ({ view, setView, isDesktop }) => {
    const handleNav = (targetView) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
        setView(targetView);
    };

    // Icon style helper
    const getIconStyle = (isActive) => ({
        stroke: isActive ? 'var(--accent)' : 'var(--foreground-muted)',
        strokeWidth: isActive ? 2 : 1.5
    });

    // Desktop version - Sidebar navigation
    if (isDesktop) {
        return (
            <div className="fixed left-0 top-0 w-20 h-full z-[2000] flex flex-col justify-between items-center py-6 pointer-events-auto"
                 style={{
                     backgroundColor: 'var(--background-elevated)',
                     backdropFilter: 'blur(20px)',
                     borderRight: '1px solid var(--border-color)'
                 }}>
                {/* Logo/Brand */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-8"
                     style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </div>

                {/* Navigation buttons */}
                <div className="flex flex-col items-center gap-6 flex-1 justify-center">
                    {/* Profile */}
                    <button
                        onClick={() => handleNav('profile')}
                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all press-effect"
                        style={{
                            backgroundColor: ['profile', 'friends_manage', 'invites', 'games'].includes(view) ? 'var(--accent)' : 'transparent',
                            color: ['profile', 'friends_manage', 'invites', 'games'].includes(view) ? 'var(--accent-text)' : 'var(--foreground-muted)'
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </button>

                    {/* Main/Map - Center button (larger) */}
                    <button
                        onClick={() => handleNav('menu')}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all press-effect"
                        style={{
                            backgroundColor: view === 'menu' || view === 'map' ? 'var(--accent)' : 'transparent',
                            color: view === 'menu' || view === 'map' ? 'var(--accent-text)' : 'var(--foreground-muted)',
                            boxShadow: view === 'menu' || view === 'map' ? '0 4px 20px rgba(163, 255, 0, 0.3)' : 'none'
                        }}
                    >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                            <line x1="9" y1="3" x2="9" y2="18"/>
                            <line x1="15" y1="6" x2="15" y2="21"/>
                        </svg>
                    </button>

                    {/* Chat */}
                    <button
                        onClick={() => handleNav('chat')}
                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all press-effect"
                        style={{
                            backgroundColor: view === 'chat' ? 'var(--accent)' : 'transparent',
                            color: view === 'chat' ? 'var(--accent-text)' : 'var(--foreground-muted)'
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                </div>

                {/* Games button at bottom */}
                <button
                    onClick={() => handleNav('games')}
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all press-effect mb-4"
                    style={{
                        backgroundColor: view === 'games' ? 'var(--accent)' : 'transparent',
                        color: view === 'games' ? 'var(--accent-text)' : 'var(--foreground-muted)'
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                </button>
            </div>
        );
    }

    // Mobile version - bottom navigation with 3 tabs (ALL buttons INSIDE the bar)
    return (
        <div className="fixed bottom-0 left-0 right-0 z-[2000] pointer-events-auto mobile-safe-bottom">
            {/* Navigation bar - properly sized to contain all buttons */}
            <div className="mx-4 mb-4 card px-6 py-4"
                 style={{
                     backgroundColor: 'var(--background-elevated)',
                     backdropFilter: 'blur(20px)',
                     borderRadius: '20px',
                     border: '1px solid var(--border-color)',
                     height: '72px' // Fixed height to properly contain buttons
                 }}>
                <div className="flex items-center justify-around h-full">
                    {/* Profile Tab */}
                    <button
                        onClick={() => handleNav('profile')}
                        className="flex flex-col items-center gap-1 press-effect transition-all"
                        style={{
                            color: ['profile', 'friends_manage', 'invites', 'games'].includes(view) ? 'var(--accent)' : 'var(--foreground-muted)'
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="text-[9px] uppercase tracking-wide font-medium">Profile</span>
                    </button>

                    {/* Main/Map Tab - Center (slightly larger, but INSIDE the bar) */}
                    <button
                        onClick={() => handleNav('menu')}
                        className="flex flex-col items-center gap-1 press-effect transition-all"
                        style={{
                            color: view === 'menu' || view === 'map' ? 'var(--accent)' : 'var(--foreground-muted)'
                        }}
                    >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                             style={{
                                 backgroundColor: view === 'menu' || view === 'map' ? 'var(--accent)' : 'var(--input-bg)',
                                 border: view === 'menu' || view === 'map' ? 'none' : '1px solid var(--border-color)'
                             }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                                <line x1="9" y1="3" x2="9" y2="18"/>
                                <line x1="15" y1="6" x2="15" y2="21"/>
                            </svg>
                        </div>
                        <span className="text-[9px] uppercase tracking-wide font-medium">Map</span>
                    </button>

                    {/* Chat Tab */}
                    <button
                        onClick={() => handleNav('chat')}
                        className="flex flex-col items-center gap-1 press-effect transition-all"
                        style={{
                            color: view === 'chat' ? 'var(--accent)' : 'var(--foreground-muted)'
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="text-[9px] uppercase tracking-wide font-medium">Chat</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BottomBar;
