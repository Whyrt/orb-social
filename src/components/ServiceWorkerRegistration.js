// src/components/ServiceWorkerRegistration.js
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

                console.log('[SW] Service Worker registered:', registration.scope);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[SW] Update found, installing...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[SW] New content available, please refresh.');
                            // Could show update notification here
                        }
                    });
                });

                // Handle controller change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('[SW] Controller changed, reloading...');
                });

            } catch (error) {
                console.error('[SW] Service Worker registration failed:', error);
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
 * Utility to send messages to service worker
 */
export function sendMessageToSW(message) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    }
}

/**
 * Clear map tile cache
 */
export function clearMapTileCache() {
    sendMessageToSW({ type: 'CLEAR_MAP_CACHE' });
    console.log('[SW] Map tile cache cleared');
}

/**
 * Pre-cache tiles for offline use
 */
export function cacheTiles(tileUrls) {
    sendMessageToSW({ 
        type: 'CACHE_TILES', 
        tiles: tileUrls 
    });
    console.log('[SW] Queued', tileUrls.length, 'tiles for caching');
}

export default ServiceWorkerRegistration;
