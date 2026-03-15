import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom, userStatsAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';
import { useTheme } from '@/hooks/useTheme';

/**
 * ProfileView - Redesigned to match reference design exactly
 * Reference: D:\orb-social-main\orb-social-main\public\1.jpg
 */
export default function ProfileView() {
    const user = useAtomValue(userAtom);
    const stats = useAtomValue(userStatsAtom);
    const { logout, genCode, addFriend, setView } = useActions();
    const { isMobile, isDesktop } = useDevice();
    const { theme } = useTheme();
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
        <div className={`absolute inset-0 z-20 flex flex-col overflow-hidden grid-pattern`}
             style={{ backgroundColor: 'var(--background)' }}>

            {/* Top Bar - properly positioned */}
            <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-12 pb-4"
                 style={{ backgroundColor: 'var(--background)' }}>
                <div className="flex items-center justify-between">
                    {/* Left: Settings & Notifications */}
                    <div className="flex items-center gap-2">
                        <button className="w-11 h-11 card flex items-center justify-center press-effect">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                        </button>
                        <button className="w-11 h-11 card flex items-center justify-center press-effect relative">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                        </button>
                    </div>

                    {/* Right: Balance */}
                    <div className="card px-4 py-2.5 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {stats.balance.toLocaleString()}
                        </span>
                        <button className="w-7 h-7 rounded-full flex items-center justify-center press-effect"
                                style={{ backgroundColor: 'var(--accent)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-40 pb-24 px-4">

                {/* Profile Section */}
                <div className="flex flex-col items-center mb-6 animate-block">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3 relative"
                         style={{ 
                             background: 'linear-gradient(135deg, var(--accent-dim), transparent)',
                             border: '2px solid var(--border-color)'
                         }}>
                        <div className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-semibold"
                             style={{ color: 'var(--foreground)' }}>
                            {userInitial}
                        </div>
                    </div>

                    {/* Username */}
                    <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                        Mr.{user || 'Bobrovsky'}
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        @{user?.toLowerCase() || 'mr.bobrovsky'}
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-4 animate-block" style={{ animationDelay: '0.05s' }}>
                    {/* Win Rate */}
                    <div className="card p-4 flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                 style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                            </div>
                        </div>
                        <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{winRate}%</span>
                        <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--foreground-dim)' }}>Win/Lose</span>
                    </div>

                    {/* Level */}
                    <div className="card p-4 flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{level}</span>
                        <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--foreground-dim)' }}>Level</span>
                    </div>

                    {/* Days */}
                    <div className="card p-4 flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </div>
                        <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{daysActive}</span>
                        <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--foreground-dim)' }}>Days</span>
                    </div>
                </div>

                {/* Weekly Activity Strip */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between">
                        {weekDays.map((day, i) => (
                            <div key={day} className="flex flex-col items-center gap-2">
                                <span className="text-[9px] uppercase" style={{ color: 'var(--foreground-dim)' }}>{day}</span>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                                    i === todayIndex 
                                        ? 'text-[9px]' 
                                        : ''
                                }`}
                                    style={{
                                        backgroundColor: i === todayIndex ? 'var(--accent)' : 'transparent',
                                        border: i === todayIndex ? 'none' : '1px solid var(--border-color)',
                                        color: i === todayIndex ? 'var(--accent-text)' : 'var(--foreground-muted)'
                                    }}>
                                    {weekDates[i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Streak/Achievement Card */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.15s' }}>
                    <div className="flex items-center gap-4">
                        {/* Trophy */}
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ 
                                 background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                                 boxShadow: '0 4px 20px rgba(163, 255, 0, 0.3)'
                             }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                                <path d="M8 21h8M12 17v4M7 4h10c.66 0 1.2.54 1.2 1.2v3.8c0 3.09-2.24 5.65-5.2 5.95V17h-2v-2.05c-2.96-.3-5.2-2.86-5.2-5.95V5.2C5.8 4.54 6.34 4 7 4z"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>Keep it up!</h3>
                            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--foreground-dim)' }}>
                                {streakDays} days in a row you are here!
                            </p>
                            {/* Streak dots */}
                            <div className="flex gap-1.5 mt-2.5">
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full"
                                         style={{
                                             backgroundColor: i < 3 ? 'var(--accent)' : 'var(--border-color)',
                                             opacity: i < 3 ? 1 : 0.3
                                         }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Friends Card */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Friend avatars */}
                            <div className="flex -space-x-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium"
                                         style={{ 
                                             backgroundColor: i === 0 ? 'var(--accent)' : 'var(--background-elevated)',
                                             color: i === 0 ? 'var(--accent-text)' : 'var(--foreground)',
                                             border: '2px solid var(--background-elevated)'
                                         }}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Friends</h3>
                                <p className="text-[10px] uppercase" style={{ color: 'var(--success)' }}>{friendsOnline} online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setView('friends_manage')}
                            className="px-4 py-2 card text-[9px] uppercase tracking-wider press-effect transition-all"
                            style={{ 
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--foreground-muted)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            View All
                        </button>
                    </div>
                </div>

                {/* Tasks Card */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.25s' }}>
                    <div className="flex items-center gap-4">
                        {/* Task icon */}
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ 
                                 background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                                 boxShadow: '0 4px 20px rgba(163, 255, 0, 0.2)'
                             }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>Complete new tasks</h3>
                            <p className="text-[10px] uppercase tracking-wide leading-relaxed" style={{ color: 'var(--foreground-dim)' }}>
                                Get a bonus on your winnings with the teams in your collection
                            </p>
                        </div>
                    </div>
                </div>

                {/* Add Friend Section */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.3s' }}>
                    <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-dim)' }}>Connect Node</p>
                    <div className="flex items-center gap-2">
                        <input
                            value={friendInput}
                            onChange={(e) => setFriendInput(e.target.value)}
                            placeholder="ENTER FRIEND CODE"
                            className="flex-1 terminal-input text-[10px] uppercase tracking-wider"
                        />
                        <button
                            onClick={() => { addFriend(friendInput); setFriendInput('') }}
                            className="px-5 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-wider press-effect transition-all"
                            style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-text)'
                            }}
                        >
                            ADD
                        </button>
                    </div>
                </div>

                {/* Access Code */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.35s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--foreground-dim)' }}>My Access Code</p>
                            <p className="text-base font-mono tracking-widest" style={{ color: 'var(--foreground)' }}>{stats.code || '••••••'}</p>
                        </div>
                        <button
                            onClick={genCode}
                            className="w-11 h-11 rounded-xl flex items-center justify-center press-effect transition-all"
                            style={{ 
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--foreground-muted)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="card p-4 mb-4 animate-block" style={{ animationDelay: '0.4s' }}>
                    <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-dim)' }}>Theme</p>
                    <div className="grid grid-cols-3 gap-2">
                        <ThemeButton label="Dark" active={theme === 'dark'} />
                        <ThemeButton label="Light" active={theme === 'light'} />
                        <ThemeButton label="Auto" active={theme === 'system'} />
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full py-4 rounded-xl text-[9px] font-semibold uppercase tracking-wider press-effect transition-all mb-4"
                    style={{ 
                        backgroundColor: 'transparent',
                        color: 'var(--foreground-dim)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    Terminate Session
                </button>
            </div>
        </div>
    )
}

function ThemeButton({ label, active }) {
    const { setDarkMode, setLightMode, setSystemMode } = useTheme();
    
    const handleClick = () => {
        if (label === 'Dark') setDarkMode();
        if (label === 'Light') setLightMode();
        if (label === 'Auto') setSystemMode();
    };

    return (
        <button
            onClick={handleClick}
            className="py-3 rounded-xl text-[9px] font-semibold uppercase tracking-wider press-effect transition-all"
            style={{
                backgroundColor: active ? 'var(--accent)' : 'var(--input-bg)',
                color: active ? 'var(--accent-text)' : 'var(--foreground-muted)',
                border: active ? 'none' : '1px solid var(--border-color)'
            }}
        >
            {label}
        </button>
    );
}
