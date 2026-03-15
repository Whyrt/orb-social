"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { userAtom, viewAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

/**
 * NewsView - News/Updates feed
 * Redesigned to match reference design
 */
export default function NewsView() {
    const user = useAtomValue(userAtom);
    const { setView } = useActions();
    const { isMobile } = useDevice();

    // Mock news data
    const newsItems = [
        {
            id: 1,
            category: 'UPDATE',
            title: 'New Signal Game Mode',
            description: 'Predict the crash point and multiply your ORB tokens. Cash out before it collapses!',
            date: 'Today',
            image: 'gradient-accent',
            hot: true
        },
        {
            id: 2,
            category: 'EVENT',
            title: 'Weekend Tournament',
            description: 'Compete with friends and earn bonus rewards. Top 3 players get exclusive badges.',
            date: '2 days ago',
            image: 'gradient-purple',
            hot: false
        },
        {
            id: 3,
            category: 'FEATURE',
            title: 'Friend Locations Map',
            description: 'Track where your friends are in real-time. Explore together and unlock achievements.',
            date: '5 days ago',
            image: 'gradient-blue',
            hot: false
        },
        {
            id: 4,
            category: 'REWARD',
            title: 'Daily Login Bonus',
            description: 'Log in for 7 consecutive days and receive a special multiplier boost.',
            date: '1 week ago',
            image: 'gradient-gold',
            hot: false
        }
    ];

    const getGradient = (type) => {
        switch (type) {
            case 'gradient-accent':
                return 'linear-gradient(135deg, var(--accent), var(--accent-hover))';
            case 'gradient-purple':
                return 'linear-gradient(135deg, #a855f7, #7c3aed)';
            case 'gradient-blue':
                return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
            case 'gradient-gold':
                return 'linear-gradient(135deg, #fbbf24, #d97706)';
            default:
                return 'linear-gradient(135deg, var(--accent), var(--accent-hover))';
        }
    };

    return (
        <div className={`absolute inset-0 z-20 flex flex-col overflow-hidden grid-pattern`}
             style={{ backgroundColor: 'var(--background)' }}>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-12 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setView('menu')}
                            className="w-10 h-10 card flex items-center justify-center press-effect"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>News</h1>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                Latest updates & events
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-24 px-4">
                
                {/* Featured News */}
                <div className="card p-5 mb-4 animate-block">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-md text-[8px] font-semibold uppercase tracking-wider"
                                  style={{ 
                                      backgroundColor: 'var(--accent)', 
                                      color: 'var(--accent-text)' 
                                  }}>
                                Featured
                            </span>
                        </div>
                        <span className="text-[9px]" style={{ color: 'var(--foreground-dim)' }}>Just now</span>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                        Welcome to ORB Network
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                        Your decentralized social gaming platform. Connect with friends, play games, and earn rewards.
                    </p>
                    
                    <div className="w-full h-32 rounded-xl mb-4"
                         style={{ 
                             background: getGradient('gradient-accent'),
                             boxShadow: '0 8px 32px rgba(163, 255, 0, 0.2)'
                         }}>
                        <div className="w-full h-full flex items-center justify-center">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </div>
                    </div>
                    
                    <button className="w-full py-3 rounded-xl text-[9px] font-semibold uppercase tracking-wider press-effect transition-all"
                            style={{ 
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-text)'
                            }}>
                        Get Started
                    </button>
                </div>

                {/* News List */}
                <div className="flex flex-col gap-3">
                    {newsItems.map((item, index) => (
                        <div 
                            key={item.id} 
                            className="card p-4 animate-block"
                            style={{ animationDelay: `${(index + 1) * 0.05}s` }}
                        >
                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="w-20 h-20 rounded-xl flex-shrink-0"
                                     style={{ 
                                         background: getGradient(item.image),
                                         boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                                     }}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        {item.hot && (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-semibold uppercase tracking-wider"
                                              style={{ color: 'var(--accent)' }}>
                                            {item.category}
                                        </span>
                                        {item.hot && (
                                            <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                  style={{ 
                                                      backgroundColor: 'var(--error-bg)', 
                                                      color: 'var(--error)' 
                                                  }}>
                                                HOT
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--foreground)' }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-[10px] line-clamp-2" style={{ color: 'var(--foreground-dim)' }}>
                                        {item.description}
                                    </p>
                                    <span className="text-[8px] mt-2 block" style={{ color: 'var(--foreground-dim)' }}>
                                        {item.date}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
