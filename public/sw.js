// public/sw.js - Service Worker for Orb Social PWA
// Handles offline caching for map tiles and app shell

const CACHE_NAME = 'orb-social-v1';
const MAP_TILE_CACHE = 'orb-map-tiles-v1';

// App shell files to cache
const APP_SHELL = [
    '/',
    '/manifest.json',
];

// Map tile domains to cache
const MAP_TILE_DOMAINS = [
    'basemaps.cartocdn.com',
    'tile.openstreetmap.org',
    'server.arcgisonline.com',
    'cdnjs.cloudflare.com' // Leaflet assets
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== MAP_TILE_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle map tile requests with cache-first strategy
    if (MAP_TILE_DOMAINS.includes(url.hostname)) {
        event.respondWith(handleMapTileRequest(request));
        return;
    }

    // Handle navigation requests (app shell)
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Handle other requests with network-first strategy
    event.respondWith(handleNetworkFirstRequest(request));
});

/**
 * Handle map tile requests - cache first
 * Map tiles are static and can be cached aggressively
 */
async function handleMapTileRequest(request) {
    const cache = await caches.open(MAP_TILE_CACHE);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Fetch from network
    try {
        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'omit'
        });

        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.warn('[SW] Map tile fetch failed:', error);
        
        // Return placeholder tile for failed requests
        return createPlaceholderTile();
    }
}

/**
 * Handle navigation requests - network first with cache fallback
 */
async function handleNavigationRequest(request) {
    // Try network first
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            return networkResponse;
        }
    } catch (error) {
        console.warn('[SW] Navigation fetch failed, trying cache:', error);
    }

    // Fallback to cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    if (cachedResponse) {
        return cachedResponse;
    }

    // Offline fallback
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

/**
 * Handle other requests - network first with cache fallback
 */
async function handleNetworkFirstRequest(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * Create placeholder tile for offline mode
 * Returns a simple gray tile
 */
function createPlaceholderTile() {
    const canvas = new OffscreenCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 256, 256);
    
    // Grid pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 256; i += 64) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
    }
    ctx.stroke();
    
    // Text
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Offline', 128, 128);
    
    return canvas.convertToBlob().then(blob => {
        return new Response(blob, {
            headers: {
                'Content-Type': 'image/png'
            }
        });
    });
}

// Message handler for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_MAP_CACHE') {
        console.log('[SW] Clearing map tile cache...');
        caches.delete(MAP_TILE_CACHE);
    }
    
    if (event.data && event.data.type === 'CACHE_TILES') {
        const { tiles } = event.data;
        cacheTiles(tiles);
    }
});

/**
 * Pre-cache tiles for offline use
 */
async function cacheTiles(tiles) {
    const cache = await caches.open(MAP_TILE_CACHE);
    const requests = tiles.map(url => new Request(url, {
        mode: 'cors',
        credentials: 'omit'
    }));
    
    try {
        const responses = await Promise.all(
            requests.map(request => fetch(request))
        );
        
        await Promise.all(
            responses.map((response, index) => {
                if (response.ok) {
                    return cache.put(requests[index], response.clone());
                }
            })
        );
        
        console.log('[SW] Cached', tiles.length, 'tiles');
    } catch (error) {
        console.warn('[SW] Error caching tiles:', error);
    }
}

console.log('[SW] Service worker loaded');
