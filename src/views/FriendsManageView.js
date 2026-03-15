import React from 'react';
import { useAtomValue } from 'jotai';
import { friendsAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

export default function FriendsManageView() {
    const friends = useAtomValue(friendsAtom);
    const { removeFriend, setView } = useActions();
    const { isMobile } = useDevice();

    return (
        <div className="absolute inset-0 z-20 flex flex-col pt-14 px-4 overflow-hidden grid-pattern"
             style={{ backgroundColor: 'var(--background)' }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-8 cursor-pointer" 
                 onClick={() => setView('profile')}
                 style={{ color: 'var(--foreground-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <div className="terminal-header">
                    <span className="tech-label">CONNECTION MANAGER</span>
                </div>
            </div>

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-2">
                {friends.length === 0 ? (
                    <div className="terminal-window p-6 text-center">
                        <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>
                            No active connections
                        </p>
                    </div>
                ) : (
                    friends.map(f => (
                        <div key={f} className="terminal-window p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 terminal-border flex items-center justify-center font-mono text-sm"
                                     style={{ color: 'var(--foreground)' }}>
                                    {f[0].toUpperCase()}
                                </div>
                                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>
                                    @{f.toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={() => removeFriend(f)}
                                className="px-3 py-1.5 terminal-border text-[7px] font-mono uppercase press-effect transition-all"
                                style={{ color: 'var(--foreground-muted)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--error)';
                                    e.currentTarget.style.borderColor = 'var(--error)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--foreground-muted)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                REMOVE
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
