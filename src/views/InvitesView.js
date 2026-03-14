import React from 'react';
import { useAtomValue } from 'jotai';
import { userStatsAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

export default function InvitesView() {
    const stats = useAtomValue(userStatsAtom);
    const { buyInvite, setView } = useActions();
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
                    <span className="tech-label">ACCESS KEYS</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-4">
                {/* Generate Key Card */}
                <div className="terminal-window p-6 text-center">
                    <div className="w-12 h-12 terminal-border flex items-center justify-center mx-auto mb-3 text-2xl">🔑</div>
                    <h2 className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--foreground)' }}>Access Keys</h2>
                    <p className="text-[7px] font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--foreground-dim)' }}>
                        Generate invitation codes to bring new nodes into the network.
                    </p>
                    <button
                        onClick={buyInvite}
                        className="w-full py-3 font-mono text-[8px] uppercase tracking-widest press-effect transition-colors"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                    >
                        Generate Key (100 ORB)
                    </button>
                </div>

                {/* Inventory Header */}
                <div className="terminal-header mt-6">
                    <span className="tech-label">INVENTORY</span>
                </div>

                {/* Keys List */}
                <div className="space-y-2">
                    {stats.invites && stats.invites.length === 0 && (
                        <p className="text-[8px] font-mono italic" style={{ color: 'var(--foreground-dim)' }}>No keys generated.</p>
                    )}
                    {stats.invites && stats.invites.map(i => (
                        <div key={i.code} className="terminal-window p-3 flex justify-between items-center">
                            <span className="font-mono text-xs tracking-widest select-all" style={{ color: 'var(--foreground)' }}>{i.code}</span>
                            <span className={`text-[6px] font-mono uppercase px-2 py-0.5 terminal-border`}
                                  style={{
                                      color: i.is_used ? 'var(--foreground-dim)' : 'var(--foreground)',
                                      backgroundColor: i.is_used ? 'transparent' : 'var(--input-bg)'
                                  }}>
                                {i.is_used ? 'Used' : 'Active'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
