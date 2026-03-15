"use client";

import { useEffect, useCallback } from 'react';

/**
 * Service Worker Registration Component
 * Registers the PWA service worker for offline support
 */
export function ServiceWorkerRegistration() {
    const registerServiceWorker = useCallback(async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available
                        }
                    });
                });

                // Handle controller change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    // Controller changed
                });

            } catch (error) {
                // Service Worker registration failed
            }
        }
    }, []);

    useEffect(() => {
        // Register on mount (client-side only)
        registerServiceWorker();
    }, [registerServiceWorker]);

    return null; // This component doesn't render anything
}

/**
 * Clear map tile cache
 */
export function clearMapTileCache() {
    sendMessageToSW({ type: 'CLEAR_MAP_CACHE' });
}

/**
 * Pre-cache tiles for offline use
 */
export function cacheTiles(tileUrls) {
    sendMessageToSW({
        type: 'CACHE_TILES',
        tiles: tileUrls
    });
}

export default ServiceWorkerRegistration;
