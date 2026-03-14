import React from 'react';

const BottomBar = ({ view, setView, isDesktop }) => {
    const handleNav = (targetView) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
        setView(targetView);
    };

    // Button style helper
    const getButtonStyle = (isActive) => ({
        backgroundColor: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? 'var(--accent-text)' : 'var(--foreground-muted)',
        borderColor: isActive ? 'var(--accent)' : 'var(--border-color)'
    });

    // Desktop version - sidebar navigation
    if (isDesktop) {
        return (
            <div className="fixed left-0 top-1/2 -translate-y-1/2 w-16 h-full z-[2000] flex flex-col justify-center items-center py-10 pointer-events-auto"
                 style={{ 
                     backgroundColor: 'var(--overlay-bg)',
                     backdropFilter: 'blur(10px)',
                     borderRight: '1px solid var(--border-color)'
                 }}>
                <button 
                    onClick={() => handleNav('profile')}
                    className={`w-12 h-12 mb-8 flex items-center justify-center transition-all duration-200 press-effect terminal-border`}
                    style={getButtonStyle(['profile', 'friends_manage', 'invites', 'games'].includes(view))}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                        <rect x="3" y="3" width="18" height="18" rx="0"/>
                        <circle cx="12" cy="8" r="3"/>
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                    </svg>
                </button>
                <button 
                    onClick={() => handleNav('menu')} 
                    className="relative w-14 h-14 mb-8 flex items-center justify-center press-effect terminal-border"
                    style={getButtonStyle(view === 'menu')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="12" y1="2" x2="12" y2="4"/>
                        <line x1="12" y1="20" x2="12" y2="22"/>
                    </svg>
                </button>
                <button 
                    onClick={() => handleNav('chat')}
                    className={`w-12 h-12 flex items-center justify-center transition-all duration-200 press-effect terminal-border`}
                    style={getButtonStyle(view === 'chat')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                        <rect x="3" y="3" width="18" height="18" rx="0"/>
                        <path d="M8 12h8M8 16h6"/>
                    </svg>
                </button>
            </div>
        );
    }

    // Mobile version - bottom navigation
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[340px] z-[2000] flex justify-between items-center px-10 pointer-events-auto mobile-safe-bottom">
            <button 
                onClick={() => handleNav('profile')}
                className={`w-14 h-14 flex items-center justify-center transition-all duration-200 press-effect terminal-border`}
                style={getButtonStyle(['profile', 'friends_manage', 'invites', 'games'].includes(view))}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                    <rect x="3" y="3" width="18" height="18" rx="0"/>
                    <circle cx="12" cy="8" r="3"/>
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                </svg>
            </button>
            <button 
                onClick={() => handleNav('menu')} 
                className="relative w-16 h-16 flex items-center justify-center press-effect terminal-border"
                style={getButtonStyle(view === 'menu')}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                    <line x1="12" y1="20" x2="12" y2="22"/>
                </svg>
            </button>
            <button 
                onClick={() => handleNav('chat')}
                className={`w-14 h-14 flex items-center justify-center transition-all duration-200 press-effect terminal-border`}
                style={getButtonStyle(view === 'chat')}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                    <rect x="3" y="3" width="18" height="18" rx="0"/>
                    <path d="M8 12h8M8 16h6"/>
                </svg>
            </button>
        </div>
    );
};

export default BottomBar;
