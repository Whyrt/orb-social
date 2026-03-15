"use client"
import React, { useState } from 'react';
import { useActions } from '@/lib/actions';

/**
 * Компонент запроса разрешения на доступ к геолокации
 * Показывается когда пользователь не дал разрешение
 */
export default function LocationPermissionRequest({ onAllow, onDeny }) {
    const [isRequesting, setIsRequesting] = useState(false);

    const handleAllow = async () => {
        setIsRequesting(true);
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            if (result.state === 'granted') {
                onAllow();
            } else {
                // Запросим явно
                navigator.geolocation.getCurrentPosition(
                    () => onAllow(),
                    () => onDeny(),
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }
        } catch (error) {
            onDeny();
        }
        setIsRequesting(false);
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black bg-opacity-90">
            <div className="terminal-window p-6 max-w-sm mx-4" style={{
                backgroundColor: 'var(--background-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px'
            }}>
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                     style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                         fill="none" stroke="var(--accent)" strokeWidth="1.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-center text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    Доступ к местоположению
                </h2>

                {/* Description */}
                <p className="text-center text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
                    Разрешите доступ к вашему местоположению для использования карты и поиска друзей поблизости
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleAllow}
                        disabled={isRequesting}
                        className="w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider press-effect transition-all"
                        style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-text)',
                            opacity: isRequesting ? 0.7 : 1
                        }}
                    >
                        {isRequesting ? 'Запрос...' : 'Разрешить'}
                    </button>

                    <button
                        onClick={onDeny}
                        disabled={isRequesting}
                        className="w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider press-effect transition-all"
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--foreground-muted)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        Использовать демо-режим
                    </button>
                </div>

                {/* Info */}
                <p className="text-[9px] text-center mt-4" style={{ color: 'var(--foreground-dim)' }}>
                    Ваши данные используются только для отображения на карте
                </p>
            </div>
        </div>
    );
}
