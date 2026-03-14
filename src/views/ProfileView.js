import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom, userStatsAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';
import { useTheme } from '@/hooks/useTheme';

/**
 * ProfileView - Redesigned based on reference layout
 * Structure:
 * - Top bar: Settings, notifications, balance
 * - Profile section: Avatar placeholder, username, handle
 * - Stats row: Win rate, Level, Days active
 * - Weekly activity strip
 * - Friends card
 * - Achievement/Trophy card
 * - Tasks card
 * - Theme selector
 * - Logout
 */
export default function ProfileView() {
    const user = useAtomValue(userAtom);
    const stats = useAtomValue(userStatsAtom);
    const { logout, genCode, addFriend, setView } = useActions();
    const { isMobile, isDesktop } = useDevice();
    const { theme, setDarkMode, setLightMode, setSystemMode } = useTheme();
    const [friendInput, setFriendInput] = useState('');

    // Mock data for visual structure (matching reference layout)
    const winRate = 70;
    const level = 8;
    const daysActive = 76;
    const friendsOnline = 14;
    const streakDays = 35;

    // Weekly activity data
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekDates = [19, 20, 21, 22, 23, 24, 25];
    const todayIndex = 3; // Thursday

    const userInitial = user ? user[0].toUpperCase() : 'U';

    return (
        <div className={`absolute inset-0 z-20 flex flex-col overflow-hidden grid-pattern ${isDesktop ? 'pt-20 px-8' : 'pt-14 px-4'}`}
             style={{ backgroundColor: 'var(--background)' }}>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                
                {/* === TOP STATS ROW === */}
                <div className="grid grid-cols-3 gap-3 mb-4 animate-block">
                    {/* Win Rate */}
                    <div className="terminal-window p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                 style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                            </div>
                        </div>
                        <div className="text-lg font-mono font-bold" style={{ color: 'var(--foreground)' }}>{winRate}%</div>
                        <div className="text-[6px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Win/Lose</div>
                    </div>

                    {/* Level */}
                    <div className="terminal-window p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <div className="text-lg font-mono font-bold" style={{ color: 'var(--foreground)' }}>{level}</div>
                        <div className="text-[6px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Level</div>
                    </div>

                    {/* Days Active */}
                    <div className="terminal-window p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </div>
                        <div className="text-lg font-mono font-bold" style={{ color: 'var(--foreground)' }}>{daysActive}</div>
                        <div className="text-[6px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Days</div>
                    </div>
                </div>

                {/* === WEEKLY ACTIVITY STRIP === */}
                <div className="terminal-window p-3 mb-4 animate-block" style={{ animationDelay: '0.05s' }}>
                    <div className="flex justify-between">
                        {weekDays.map((day, i) => (
                            <div key={day} className="flex flex-col items-center gap-1">
                                <div className="text-[6px] uppercase" style={{ color: 'var(--foreground-dim)' }}>{day}</div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm ${
                                    i === todayIndex ? 'terminal-border' : ''
                                }`}
                                    style={{ 
                                        backgroundColor: i === todayIndex ? 'var(--accent)' : 'transparent',
                                        color: i === todayIndex ? 'var(--accent-text)' : 'var(--foreground-muted)'
                                    }}>
                                    {weekDates[i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === PROFILE SECTION === */}
                <div className="terminal-window p-6 mb-4 animate-block" style={{ animationDelay: '0.1s' }}>
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar Placeholder */}
                        <div className="w-20 h-20 rounded-full terminal-border flex items-center justify-center mb-3 relative">
                            <div className="absolute inset-0 rounded-full" 
                                 style={{ border: '2px dashed var(--border-color)' }}></div>
                            <div className="text-3xl font-mono" style={{ color: 'var(--foreground)' }}>
                                {userInitial}
                            </div>
                        </div>

                        {/* Username */}
                        <h2 className="text-xl font-mono font-bold" style={{ color: 'var(--foreground)' }}>
                            {user?.toUpperCase() || 'UNKNOWN'}
                        </h2>
                        <p className="text-[8px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>
                            @{user?.toLowerCase() || 'node'}
                        </p>

                        {/* Balance Display */}
                        <div className="mt-4 terminal-window px-4 py-2 flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center"
                                 style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                            </div>
                            <span className="text-lg font-mono font-bold" style={{ color: 'var(--foreground)' }}>
                                {stats.balance}
                            </span>
                            <span className="text-[6px] uppercase" style={{ color: 'var(--foreground-dim)' }}>ORB</span>
                        </div>
                    </div>
                </div>

                {/* === STREAK/ACHIEVEMENT CARD === */}
                <div className="terminal-window p-4 mb-4 animate-block" style={{ animationDelay: '0.15s' }}>
                    <div className="flex items-center gap-4">
                        {/* Trophy Icon */}
                        <div className="w-16 h-16 terminal-border flex items-center justify-center flex-shrink-0">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                                <path d="M8 21h8M12 17v4M7 4h10c.66 0 1.2.54 1.2 1.2v3.8c0 3.09-2.24 5.65-5.2 5.95V17h-2v-2.05c-2.96-.3-5.2-2.86-5.2-5.95V5.2C5.8 4.54 6.34 4 7 4z"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-mono text-sm mb-1" style={{ color: 'var(--foreground)' }}>Keep it up!</h3>
                            <p className="text-[7px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                {streakDays} days in a row you are here!
                            </p>
                            {/* Streak dots */}
                            <div className="flex gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                                         style={{ 
                                             backgroundColor: i < 3 ? 'var(--success)' : 'var(--border-color)',
                                             opacity: i < 3 ? 1 : 0.3
                                         }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* === FRIENDS CARD === */}
                <div className="terminal-window p-4 mb-4 animate-block" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Friend avatars placeholder */}
                            <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full terminal-border flex items-center justify-center text-xs"
                                         style={{ backgroundColor: 'var(--card-bg)', color: 'var(--foreground)' }}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>Friends</h3>
                                <p className="text-[7px] uppercase" style={{ color: 'var(--success)' }}>{friendsOnline} online</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('friends_manage')}
                            className="px-3 py-1.5 terminal-border text-[7px] uppercase tracking-widest press-effect"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            View All
                        </button>
                    </div>
                </div>

                {/* === TASKS CARD === */}
                <div className="terminal-window p-4 mb-4 animate-block" style={{ animationDelay: '0.25s' }}>
                    <div className="flex items-center gap-4">
                        {/* Task icon */}
                        <div className="w-16 h-16 terminal-border flex items-center justify-center flex-shrink-0">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-mono text-sm mb-1" style={{ color: 'var(--foreground)' }}>Complete new tasks</h3>
                            <p className="text-[7px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                Get a bonus on your winnings with the teams in your collection
                            </p>
                        </div>
                    </div>
                </div>

                {/* === ADD FRIEND === */}
                <div className="terminal-window p-4 mb-4 animate-block" style={{ animationDelay: '0.3s' }}>
                    <p className="text-[7px] uppercase tracking-widest mb-2" style={{ color: 'var(--foreground-dim)' }}>Connect Node</p>
                    <div className="flex items-center gap-2">
                        <input
                            value={friendInput}
                            onChange={(e) => setFriendInput(e.target.value)}
                            placeholder="ENTER FRIEND CODE"
                            className="flex-1 terminal-input text-[10px]"
                        />
                        <button 
                            onClick={() => { addFriend(friendInput); setFriendInput('') }} 
                            className="px-4 py-2 text-[7px] font-mono uppercase tracking-widest press-effect transition-colors"
                            style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-text)'
                            }}
                        >
                            ADD
                        </button>
                    </div>
                </div>

                {/* === ACCESS CODE === */}
                <div className="terminal-window p-4 mb-4 animate-block" style={{ animationDelay: '0.35s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[7px] uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-dim)' }}>My Access Code</p>
                            <p className="text-base font-mono tracking-widest" style={{ color: 'var(--foreground)' }}>{stats.code || '••••••'}</p>
                        </div>
                        <button 
                            onClick={genCode} 
                            className="w-9 h-9 terminal-border flex items-center justify-center press-effect transition-colors"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* === THEME SELECTOR === */}
                <div className="terminal-window p-4 mb-4 animate-block" style={{ animationDelay: '0.4s' }}>
                    <p className="text-[7px] uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-dim)' }}>Theme</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={setDarkMode}
                            className={`py-2 terminal-border text-[7px] font-mono uppercase tracking-widest press-effect transition-all`}
                            style={{
                                backgroundColor: theme === 'dark' ? 'var(--accent)' : 'transparent',
                                color: theme === 'dark' ? 'var(--accent-text)' : 'var(--foreground-muted)'
                            }}
                        >
                            Dark
                        </button>
                        <button
                            onClick={setLightMode}
                            className={`py-2 terminal-border text-[7px] font-mono uppercase tracking-widest press-effect transition-all`}
                            style={{
                                backgroundColor: theme === 'light' ? 'var(--accent)' : 'transparent',
                                color: theme === 'light' ? 'var(--accent-text)' : 'var(--foreground-muted)'
                            }}
                        >
                            Light
                        </button>
                        <button
                            onClick={setSystemMode}
                            className={`py-2 terminal-border text-[7px] font-mono uppercase tracking-widest press-effect transition-all`}
                            style={{
                                backgroundColor: theme === 'system' ? 'var(--accent)' : 'transparent',
                                color: theme === 'system' ? 'var(--accent-text)' : 'var(--foreground-muted)'
                            }}
                        >
                            Auto
                        </button>
                    </div>
                </div>

                {/* === LOGOUT === */}
                <button 
                    onClick={logout} 
                    className="mt-2 terminal-border py-3 text-[7px] font-mono uppercase tracking-widest press-effect transition-all"
                    style={{ color: 'var(--foreground-dim)' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--error)';
                        e.currentTarget.style.borderColor = 'var(--error)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--foreground-dim)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                >
                    [ Terminate Session ]
                </button>
            </div>
        </div>
    )
}
