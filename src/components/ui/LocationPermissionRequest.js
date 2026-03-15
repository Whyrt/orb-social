"use client"
import React, { useState, useEffect } from 'react';
import { useActions } from '@/lib/actions';

/**
 * Компонент запроса разрешения на доступ к геолокации
 * Показывается когда пользователь не дал разрешение или отказал ранее
 */
export default function LocationPermissionRequest({ onAllow, onDeny, onClose }) {
    const [isRequesting, setIsRequesting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [deviceType, setDeviceType] = useState('desktop');

    useEffect(() => {
        // Detect device type for platform-specific instructions
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isIOS) setDeviceType('ios');
        else if (isAndroid) setDeviceType('android');
        else setDeviceType('desktop');
    }, []);

    const handleAllow = async () => {
        setIsRequesting(true);
        try {
            // Try to request geolocation - this will trigger browser permission prompt
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    onAllow();
                    setIsRequesting(false);
                },
                (error) => {
                    // If denied again, show instructions
                    if (error.code === error.PERMISSION_DENIED) {
                        setShowInstructions(true);
                    }
                    setIsRequesting(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch (error) {
            setShowInstructions(true);
            setIsRequesting(false);
        }
    };

    const getInstructions = () => {
        switch (deviceType) {
            case 'ios':
                return (
                    <>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                            Как включить геолокацию в Safari (iOS):
                        </h3>
                        <ol className="text-xs text-left space-y-2" style={{ color: 'var(--foreground-muted)' }}>
                            <li>1. Откройте <strong>Настройки</strong> на iPhone</li>
                            <li>2. Найдите и откройте <strong>Safari</strong></li>
                            <li>3. Нажмите <strong>Геопозиция</strong></li>
                            <li>4. Выберите <strong>Разрешить</strong></li>
                            <li>5. Обновите страницу</li>
                        </ol>
                    </>
                );
            case 'android':
                return (
                    <>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                            Как включить геолокацию в Chrome (Android):
                        </h3>
                        <ol className="text-xs text-left space-y-2" style={{ color: 'var(--foreground-muted)' }}>
                            <li>1. Откройте <strong>Настройки</strong></li>
                            <li>2. Перейдите в <strong>Приложения → Chrome</strong></li>
                            <li>3. Нажмите <strong>Разрешения</strong></li>
                            <li>4. Включите <strong>Геолокация</strong></li>
                            <li>5. Обновите страницу</li>
                        </ol>
                    </>
                );
            default:
                return (
                    <>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                            Как включить геолокацию в браузере:
                        </h3>
                        <ol className="text-xs text-left space-y-2" style={{ color: 'var(--foreground-muted)' }}>
                            <li>1. Нажмите на иконку <strong>🔒 замка</strong> в адресной строке</li>
                            <li>2. Найдите пункт <strong>Геолокация</strong></li>
                            <li>3. Измените на <strong>Разрешить</strong></li>
                            <li>4. Обновите страницу (F5)</li>
                        </ol>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black bg-opacity-90">
            <div className="terminal-window p-6 max-w-sm mx-4 max-h-[90vh] overflow-y-auto" style={{
                backgroundColor: 'var(--background-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px'
            }}>
                {!showInstructions ? (
                    <>
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
                                Демо-режим
                            </button>

                            <button
                                onClick={() => setShowInstructions(true)}
                                disabled={isRequesting}
                                className="w-full py-2 rounded-xl text-xs font-semibold uppercase tracking-wider press-effect transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--accent)',
                                    border: '1px dashed var(--accent)'
                                }}
                            >
                                ❓ Как включить?
                            </button>

                            {onClose && (
                                <button
                                    onClick={onClose}
                                    disabled={isRequesting}
                                    className="w-full py-2 rounded-xl text-xs press-effect transition-all"
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: 'var(--foreground-dim)',
                                    }}
                                >
                                    Закрыть
                                </button>
                            )}
                        </div>

                        {/* Info */}
                        <p className="text-[9px] text-center mt-4" style={{ color: 'var(--foreground-dim)' }}>
                            Ваши данные используются только для отображения на карте
                        </p>
                    </>
                ) : (
                    <>
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                             style={{ backgroundColor: 'var(--info-bg)', opacity: 0.15 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                 fill="none" stroke="var(--info)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>

                        <h2 className="text-center text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            Инструкция
                        </h2>

                        {getInstructions()}

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 mt-6">
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
                                Попробовать снова
                            </button>

                            <button
                                onClick={onDeny}
                                className="w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider press-effect transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--foreground-muted)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                Использовать демо-режим
                            </button>

                            <button
                                onClick={() => setShowInstructions(false)}
                                className="w-full py-2 rounded-xl text-xs press-effect transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--foreground-dim)',
                                }}
                            >
                                ← Назад
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
