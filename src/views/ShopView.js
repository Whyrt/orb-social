"use client";

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom, userStatsAtom, viewAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

/**
 * ShopView - In-app purchases and items
 * Redesigned to match reference design
 */
export default function ShopView() {
    const user = useAtomValue(userAtom);
    const stats = useAtomValue(userStatsAtom);
    const { setView, showToast } = useActions();
    const { isMobile } = useDevice();
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Mock shop items
    const categories = [
        { id: 'all', label: 'All' },
        { id: 'tokens', label: 'Tokens' },
        { id: 'boosters', label: 'Boosters' },
        { id: 'avatars', label: 'Avatars' }
    ];

    const shopItems = [
        {
            id: 1,
            category: 'tokens',
            name: 'ORB Token Pack',
            description: '1,000 ORB tokens',
            price: 500,
            image: 'gradient-accent',
            popular: true
        },
        {
            id: 2,
            category: 'tokens',
            name: 'Mega Token Pack',
            description: '5,500 ORB tokens + 500 bonus',
            price: 2500,
            image: 'gradient-gold',
            popular: false
        },
        {
            id: 3,
            category: 'boosters',
            name: 'Multiplier Boost',
            description: '2x multiplier for 1 hour',
            price: 200,
            image: 'gradient-purple',
            popular: true
        },
        {
            id: 4,
            category: 'boosters',
            name: 'Shield Pack',
            description: 'Protect your streak for 24h',
            price: 150,
            image: 'gradient-blue',
            popular: false
        },
        {
            id: 5,
            category: 'avatars',
            name: 'Golden Avatar',
            description: 'Exclusive golden frame',
            price: 1000,
            image: 'gradient-gold',
            popular: false
        },
        {
            id: 6,
            category: 'avatars',
            name: 'Neon Avatar',
            description: 'Glowing neon effect',
            price: 750,
            image: 'gradient-accent',
            popular: false
        }
    ];

    const filteredItems = selectedCategory === 'all' 
        ? shopItems 
        : shopItems.filter(item => item.category === selectedCategory);

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

    const handlePurchase = (item) => {
        if (stats.balance >= item.price) {
            showToast(`Purchased: ${item.name}`, 'success');
        } else {
            showToast('Insufficient balance', 'error');
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
                            <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Shop</h1>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                Upgrade your experience
                            </p>
                        </div>
                    </div>
                    
                    {/* Balance */}
                    <div className="card px-3 py-2 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {stats.balance.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="absolute top-28 left-0 right-0 z-40 px-4 py-3"
                 style={{ backgroundColor: 'var(--background)' }}>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className="px-4 py-2 rounded-xl text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap press-effect transition-all"
                            style={{
                                backgroundColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--input-bg)',
                                color: selectedCategory === cat.id ? 'var(--accent-text)' : 'var(--foreground-muted)',
                                border: selectedCategory === cat.id ? 'none' : '1px solid var(--border-color)'
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-44 pb-24 px-4">
                
                {/* Special Offer Banner */}
                <div className="card p-5 mb-4 animate-block"
                     style={{
                         background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                         boxShadow: '0 8px 32px rgba(163, 255, 0, 0.3)'
                     }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-semibold uppercase tracking-wider"
                                  style={{ color: 'var(--accent-text)', opacity: 0.8 }}>
                                Limited Time
                            </span>
                            <h2 className="text-xl font-bold mt-1 mb-2" style={{ color: 'var(--accent-text)' }}>
                                +50% Bonus
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--accent-text)', opacity: 0.9 }}>
                                On all token purchases today!
                            </p>
                        </div>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Shop Items Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item, index) => (
                        <div 
                            key={item.id} 
                            className="card p-3 animate-block"
                            style={{ animationDelay: `${(index + 1) * 0.05}s` }}
                        >
                            {/* Image */}
                            <div className="w-full aspect-square rounded-xl mb-3 relative"
                                 style={{ 
                                     background: getGradient(item.image),
                                     boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                                 }}>
                                {item.popular && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider"
                                          style={{ 
                                              backgroundColor: 'rgba(0,0,0,0.5)', 
                                              color: '#fff' 
                                          }}>
                                        Popular
                                    </span>
                                )}
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                                        {item.category === 'tokens' && (
                                            <>
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="M12 6v6l4 2"/>
                                            </>
                                        )}
                                        {item.category === 'boosters' && (
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                        )}
                                        {item.category === 'avatars' && (
                                            <>
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                <circle cx="12" cy="7" r="4"/>
                                            </>
                                        )}
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Info */}
                            <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--foreground)' }}>
                                {item.name}
                            </h3>
                            <p className="text-[9px] mb-2 truncate" style={{ color: 'var(--foreground-dim)' }}>
                                {item.description}
                            </p>
                            
                            {/* Price & Buy */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full flex items-center justify-center"
                                         style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {item.price.toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handlePurchase(item)}
                                    className="px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wider press-effect transition-all"
                                    style={{ 
                                        backgroundColor: 'var(--accent)',
                                        color: 'var(--accent-text)'
                                    }}
                                >
                                    Buy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
