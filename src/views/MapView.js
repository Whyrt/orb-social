// src/views/MapView.js
"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import L from 'leaflet';

import {
    userAtom,
    userLocationAtom,
    friendLocationsAtom,
    exploredZonesAtom,
    mapSettingsAtom,
    mapInstanceAtom,
    viewAtom,
    themeAtom
} from '@/atoms';
import { useGeolocation, calculateDistance, isPointInCircle } from '@/hooks/useGeolocation';
import { useFriendLocations } from '@/hooks/useFriendLocations';
import { useActions } from '@/lib/actions';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// ============================================
// REUSABLE COMPONENTS
// ============================================

function MapControlButton({ onClick, children, label, className = '', active = false }) {
    return (
        <button
            className={`map-control-btn ${active ? 'active' : ''} ${className}`}
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}

/**
 * Create enhanced pulse marker icon for user location
 * Includes pulsing ring, accuracy circle, and label
 */
function createUserMarkerIcon(isDark = true) {
    const accentColor = isDark ? '#ffffff' : '#1a1a1a';
    const borderColor = isDark ? '#000000' : '#ffffff';
    
    console.log('🎨 Creating user marker icon, isDark:', isDark, 'accentColor:', accentColor);

    // Создаём HTML элемент для маркера
    const markerDiv = document.createElement('div');
    markerDiv.className = 'enhanced-user-marker';
    markerDiv.style.cssText = `
        position: relative;
        width: 60px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    `;
    
    // Accuracy circle
    const accuracyCircle = document.createElement('div');
    accuracyCircle.style.cssText = `
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 2px solid ${accentColor};
        opacity: 0.3;
    `;
    
    // Outer pulse ring
    const pulseOuter = document.createElement('div');
    pulseOuter.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: ${accentColor};
        animation: pulse-ring-outer 2s ease-out infinite;
    `;
    
    // Inner pulse ring
    const pulseInner = document.createElement('div');
    pulseInner.style.cssText = `
        position: absolute;
        width: 70%;
        height: 70%;
        border-radius: 50%;
        background: ${accentColor};
        animation: pulse-ring-inner 1.5s ease-out infinite 0.3s;
    `;
    
    // Center dot
    const userDot = document.createElement('div');
    userDot.style.cssText = `
        position: relative;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${accentColor};
        border: 3px solid ${borderColor};
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        z-index: 3;
    `;
    
    // User label
    const label = document.createElement('div');
    label.style.cssText = `
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        font-weight: 700;
        color: ${accentColor};
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        white-space: nowrap;
        z-index: 4;
        font-family: 'SF Mono', Monaco, monospace;
    `;
    label.textContent = 'Вы';
    
    // Собираем всё вместе
    markerDiv.appendChild(accuracyCircle);
    markerDiv.appendChild(pulseOuter);
    markerDiv.appendChild(pulseInner);
    markerDiv.appendChild(userDot);
    markerDiv.appendChild(label);
    
    console.log('🎨 Created marker element:', markerDiv);

    return L.divIcon({
        html: markerDiv,
        className: 'enhanced-user-marker',
        iconSize: [60, 80],
        iconAnchor: [30, 40],
        popupAnchor: [0, -45],
    });
}

/**
 * Create friend marker icon with online status
 */
function createFriendIcon(isOnline, isDark = true) {
    const statusColor = isOnline ? '#4ade80' : '#6b7280';
    const bgColor = isDark ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

    return L.divIcon({
        className: 'enhanced-friend-marker',
        html: `
            <div class="friend-marker-container">
                <div class="friend-avatar" style="border-color: ${statusColor}; background: ${bgColor}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="friend-status-dot" style="background-color: ${statusColor}; border-color: ${borderColor}"></div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25],
    });
}

/**
 * Mini Map Preview Component for MenuView
 * Shows a small interactive map with user location and nearby friends
 */
export function MiniMapPreview({ width = '100%', height = 200, onOpenMap, className = '' }) {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const userLocation = useAtomValue(userLocationAtom);
    const friendLocations = useAtomValue(friendLocationsAtom);
    const theme = useAtomValue(themeAtom);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize mini map
    useEffect(() => {
        // Check for window (SSR safety)
        if (typeof window === 'undefined') return;
        if (!mapContainerRef.current || mapRef.current) return;

        try {
            // Fix Leaflet icons
            if (L.Icon.Default && L.Icon.Default.prototype._getIconUrl) {
                delete L.Icon.Default.prototype._getIconUrl;
            }
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            // Create mini map with restricted controls
            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false,
                zoomAnimation: true,
                fadeAnimation: true,
                minZoom: 10,
                maxZoom: 16,
                worldCopyJump: true,
                center: userLocation ? [userLocation.latitude, userLocation.longitude] : [51.505, -0.09],
                zoom: userLocation ? 14 : 13,
                preferCanvas: true,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                dragging: false,
                zoomSnap: 0,
            });

            // Add tiles
            const isDark = theme === 'dark' || theme === 'system';
            const tileUrl = isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

            L.tileLayer(tileUrl, {
                maxZoom: 16,
                minZoom: 10,
                attribution: '',
                subdomains: 'abcd',
                detectRetina: true,
                updateWhenIdle: true,
                keepBuffer: 2,
                maxNativeZoom: 18,
                crossOrigin: true,
            }).addTo(mapRef.current);

            setIsInitialized(true);

        } catch (error) {
            console.error('Mini map init error:', error);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update tiles on theme change
    useEffect(() => {
        if (!mapRef.current) return;

        const isDark = theme === 'dark' || theme === 'system';
        const tileUrl = isDark 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        // Remove existing tiles and add new ones
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                mapRef.current.removeLayer(layer);
            }
        });

        L.tileLayer(tileUrl, {
            maxZoom: 16,
            minZoom: 10,
            attribution: '',
            subdomains: 'abcd',
            detectRetina: true,
            updateWhenIdle: true,
            keepBuffer: 2,
            maxNativeZoom: 18,
            crossOrigin: true,
        }).addTo(mapRef.current);
    }, [theme]);

    // Update user marker
    useEffect(() => {
        if (!mapRef.current || !isInitialized) return;

        // Clear existing markers
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                mapRef.current.removeLayer(layer);
            }
        });

        const center = userLocation 
            ? [userLocation.latitude, userLocation.longitude] 
            : [51.505, -0.09];
        
        mapRef.current.setView(center, userLocation ? 14 : 13, { animate: true });

        if (userLocation) {
            // Add user marker
            const userIcon = createUserMarkerIcon(theme === 'dark');
            L.marker([userLocation.latitude, userLocation.longitude], {
                icon: userIcon,
                zIndexOffset: 1000,
            }).addTo(mapRef.current);

            // Add accuracy circle
            L.circle([userLocation.latitude, userLocation.longitude], {
                radius: userLocation.accuracy || 20,
                color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                fillColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                fillOpacity: 0.3,
                weight: 1,
            }).addTo(mapRef.current);
        }

        // Add friend markers
        const isDark = theme === 'dark' || theme === 'system';
        friendLocations.slice(0, 5).forEach((friend) => {
            if (friend.latitude && friend.longitude) {
                const friendIcon = createFriendIcon(friend.isOnline, isDark);
                L.marker([friend.latitude, friend.longitude], {
                    icon: friendIcon,
                    zIndexOffset: 900,
                }).addTo(mapRef.current);
            }
        });

    }, [userLocation, friendLocations, isInitialized, theme]);

    // Invalidate size when container changes
    useEffect(() => {
        if (mapRef.current && isInitialized) {
            setTimeout(() => {
                mapRef.current.invalidateSize({ animate: false });
            }, 100);
        }
    }, [width, height, isInitialized]);

    return (
        <div className={`mini-map-preview ${className}`} style={{ width, height }}>
            <div 
                ref={mapContainerRef} 
                className="mini-map-container"
                onClick={onOpenMap}
                style={{ width: '100%', height: '100%', cursor: 'pointer' }}
            />
            <div className="mini-map-overlay" onClick={onOpenMap}>
                <span className="mini-map-label">Open Live Map</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </div>
        </div>
    );
}

function MapSearchBar({ friends, onFriendSelect }) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const filteredFriends = friends.filter(friend => {
        if (!query) return false;
        const name = friend.username?.toLowerCase() || '';
        return name.includes(query.toLowerCase());
    });

    return (
        <div className={`map-search-container ${isFocused ? 'focused' : ''}`}>
            <div className="map-search-wrapper">
                <svg className="map-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    className="map-search"
                    placeholder="Search friends..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {query && (
                    <button
                        className="map-search-clear"
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
            </div>

            {isFocused && query && (
                <div className="map-search-results">
                    {filteredFriends.length > 0 ? (
                        filteredFriends.map(friend => (
                            <button
                                key={friend.id}
                                className="map-search-result-item"
                                onClick={() => {
                                    onFriendSelect(friend);
                                    setQuery('');
                                }}
                            >
                                <div className="result-avatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <span className="result-name">{friend.username || 'Friend'}</span>
                            </button>
                        ))
                    ) : (
                        <div className="map-search-no-results">No friends found</div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// MAP MARKERS (Legacy - using enhanced versions above)
// ============================================
// Note: Using createUserMarkerIcon and createFriendIcon from above

// ============================================
// FOG OF WAR OVERLAY
// ============================================

class FogOfWarOverlay extends L.Layer {
    constructor(exploredZones, showFogOfWar, theme) {
        super();
        this.exploredZones = exploredZones;
        this.showFogOfWar = showFogOfWar;
        this.theme = theme;
    }

    onAdd(map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-fog-overlay');
        this._updateCanvasSize();

        map.getPanes().overlayPane.appendChild(this._canvas);
        map.on('moveend zoomend', this._redraw, this);
        this._redraw();

        return this._canvas;
    }

    onRemove(map) {
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off('moveend zoomend', this._redraw, this);
    }

    _updateCanvasSize() {
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.zIndex = '400';
    }

    _redraw() {
        if (!this._map || !this.showFogOfWar) {
            this._canvas.style.display = 'none';
            return;
        }

        this._canvas.style.display = 'block';
        this._updateCanvasSize();

        const ctx = this._canvas.getContext('2d');
        const size = this._map.getSize();

        ctx.clearRect(0, 0, size.x, size.y);

        const fogColor = this.theme === 'dark' 
            ? 'rgba(10, 10, 10, 0.7)'
            : 'rgba(240, 240, 240, 0.6)';

        ctx.fillStyle = fogColor;
        ctx.fillRect(0, 0, size.x, size.y);

        ctx.globalCompositeOperation = 'destination-out';

        this.exploredZones.forEach(zone => {
            const centerPoint = this._map.latLngToContainerPoint([zone.center.lat, zone.center.lng]);
            const radiusPixels = this._pixelsPerMeterAtLat(zone.center.lat) * zone.radius;

            const gradient = ctx.createRadialGradient(
                centerPoint.x, centerPoint.y, radiusPixels * 0.7,
                centerPoint.x, centerPoint.y, radiusPixels
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.arc(centerPoint.x, centerPoint.y, radiusPixels, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

        ctx.globalCompositeOperation = 'source-over';
    }

    _pixelsPerMeterAtLat(lat) {
        const earthCircumference = 40075017;
        const latRad = lat * Math.PI / 180;
        const metersPerPixel = (earthCircumference * Math.cos(latRad)) / 256;
        return 1 / metersPerPixel;
    }

    setExploredZones(zones) {
        this.exploredZones = zones;
        this._redraw();
    }

    setShowFogOfWar(show) {
        this.showFogOfWar = show;
        this._redraw();
    }

    setTheme(theme) {
        this.theme = theme;
        this._redraw();
    }
}

// ============================================
// MAIN MAP COMPONENT
// ============================================

function MapViewContent() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const friendMarkersRef = useRef(new Map());
    const fogOverlayRef = useRef(null);
    const initAttemptedRef = useRef(false);
    const tileLayerRef = useRef(null);

    const user = useAtomValue(userAtom);
    const userLocation = useAtomValue(userLocationAtom);
    const friendLocations = useAtomValue(friendLocationsAtom);
    const [exploredZones, setExploredZones] = useAtom(exploredZonesAtom);
    const [mapSettings, setMapSettings] = useAtom(mapSettingsAtom);
    const setMapInstance = useSetAtom(mapInstanceAtom);
    const theme = useAtomValue(themeAtom);
    const setView = useSetAtom(viewAtom);

    const { formatLastSeen } = useFriendLocations();
    const [mapLoaded, setMapLoaded] = useState(false);
    const [locationPermission, setLocationPermission] = useState('prompt');
    const [initError, setInitError] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [tileError, setTileError] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

    // Debug: Log user location changes
    useEffect(() => {
        console.log('📍 UserLocation updated:', userLocation);
    }, [userLocation]);

    // Load explored zones from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('orb_explored_zones');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setExploredZones(parsed);
            } catch (e) {
                console.error('Failed to load explored zones:', e);
            }
        }
    }, [setExploredZones]);

    // Check location permission with mobile support
    useEffect(() => {
        if (!('permissions' in navigator)) {
            // iOS Safari doesn't support permissions API
            setLocationPermission('prompt');
            return;
        }

        navigator.permissions.query({ name: 'geolocation' })
            .then(result => {
                setLocationPermission(result.state);
                result.onchange = () => setLocationPermission(result.state);
            })
            .catch(() => {
                // Fallback for browsers without permissions API
                setLocationPermission('prompt');
            });

        // Monitor online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initialize map with mobile optimizations
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!mapContainerRef.current) return;
        if (mapRef.current || initAttemptedRef.current) return;

        initAttemptedRef.current = true;

        try {
            // Fix Leaflet marker icons
            if (L.Icon.Default && L.Icon.Default.prototype._getIconUrl) {
                delete L.Icon.Default.prototype._getIconUrl;
            }
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            // Create map with mobile-optimized settings
            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false,
                zoomAnimation: true,
                fadeAnimation: true,
                markerZoomAnimation: true,
                minZoom: 2,
                maxZoom: 19, // Extended max zoom for better detail
                worldCopyJump: true,
                center: [51.505, -0.09],
                zoom: 13,
                preferCanvas: true, // Better mobile performance
                zoomSnap: 0.5, // Smoother zoom on mobile
                wheelDebounceTime: 150, // Prevent excessive zooming
                zoomDelta: 0.5, // Finer zoom steps
            });

            setMapInstance(mapRef.current);

            // Add zoom controls in bottom-right position
            L.control.zoom({
                position: 'bottomright',
                zoomInText: '+',
                zoomOutText: '−'
            }).addTo(mapRef.current);

            L.control.attribution({
                position: 'bottomright',
                prefix: ''
            }).addTo(mapRef.current);

            setMapLoaded(true);

        } catch (error) {
            console.error('Map initialization error:', error);
            setInitError(error.message);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            initAttemptedRef.current = false;
        };
    }, [setMapInstance]);

    // Update map tiles with improved caching and max zoom handling
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        // CartoDB tiles WITH LABELS for context
        const tileLayers = {
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        };

        const tileUrl = theme === 'dark' ? tileLayers.dark : tileLayers.light;

        // Remove existing tiles
        if (tileLayerRef.current) {
            mapRef.current.removeLayer(tileLayerRef.current);
        }

        // Add new tiles with enhanced mobile caching and zoom handling
        tileLayerRef.current = L.tileLayer(tileUrl, {
            maxZoom: 19, // Support higher zoom levels
            minZoom: 2,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            detectRetina: true,
            updateWhenIdle: false, // Keep updating tiles during pan
            updateWhenZooming: true, // Show tiles during zoom
            keepBuffer: 4, // Keep more tiles in buffer for smoother panning
            maxNativeZoom: 18, // Native tile resolution
            crossOrigin: true, // Enable CORS for service worker caching
            errorTileUrl: '', // Don't show error tiles
            tileSize: 256,
            zoomOffset: 0,
        });

        tileLayerRef.current.on('tileerror', (error) => {
            console.warn('Tile load error:', error.tile);
            setTileError(true);
        });

        tileLayerRef.current.on('load', () => {
            setTileError(false);
        });

        tileLayerRef.current.addTo(mapRef.current);

        // Invalidate size after tiles load (fixes mobile display issues)
        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 100);

    }, [theme, mapLoaded]);

    // Initialize Fog of War
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        fogOverlayRef.current = new FogOfWarOverlay(exploredZones, mapSettings.showFogOfWar, theme);
        fogOverlayRef.current.addTo(mapRef.current);

        return () => {
            if (fogOverlayRef.current) {
                fogOverlayRef.current.remove();
            }
        };
    }, [mapLoaded]);

    // Update Fog of War
    useEffect(() => {
        if (!fogOverlayRef.current) return;
        fogOverlayRef.current.setExploredZones(exploredZones);
        fogOverlayRef.current.setShowFogOfWar(mapSettings.showFogOfWar);
        fogOverlayRef.current.setTheme(theme);
    }, [exploredZones, mapSettings.showFogOfWar, theme]);

    // Update user marker with enhanced pulsing animation
    useEffect(() => {
        if (!mapRef.current) {
            console.warn('Map ref not ready');
            return;
        }
        
        if (!userLocation) {
            console.warn('User location not available');
            return;
        }

        const { latitude, longitude } = userLocation;
        const isDark = theme === 'dark' || theme === 'system';
        
        console.log('📍 Updating user marker:', { latitude, longitude, accuracy: userLocation.accuracy, isDark });

        // Remove existing marker
        if (userMarkerRef.current) {
            mapRef.current.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
        }

        try {
            // Create enhanced user marker with pulse animation
            const userIcon = createUserMarkerIcon(isDark);
            console.log('🎨 Created user icon:', userIcon);
            
            userMarkerRef.current = L.marker([latitude, longitude], {
                icon: userIcon,
                zIndexOffset: 1000
            }).addTo(mapRef.current);
            
            console.log('✅ Marker added to map');

            const locationLabel = userLocation.isMock ? '🧪 Demo Location' : 'Вы';
            userMarkerRef.current.bindPopup(`
                <div class="location-popup">
                    <strong>${locationLabel}</strong><br/>
                    <small>Точность: ${Math.round(userLocation.accuracy)}м</small>
                </div>
            `);

            if (mapSettings.followUser) {
                mapRef.current.setView([latitude, longitude], mapRef.current.getZoom() || 15, {
                    animate: true,
                    duration: 0.5
                });
            }
        } catch (error) {
            console.error('❌ Error creating user marker:', error);
        }

    }, [userLocation, mapSettings.followUser, theme]);

    // Update friend markers with enhanced icons
    useEffect(() => {
        if (!mapRef.current) return;

        const currentFriendIds = new Set();
        const isDark = theme === 'dark' || theme === 'system';

        friendLocations.forEach(friend => {
            if (!friend.latitude || !friend.longitude) return;

            currentFriendIds.add(friend.user_id);

            if (friendMarkersRef.current.has(friend.user_id)) {
                mapRef.current.removeLayer(friendMarkersRef.current.get(friend.user_id));
            }

            const marker = L.marker([friend.latitude, friend.longitude], {
                icon: createFriendIcon(friend.isOnline, isDark),
                zIndexOffset: 900
            }).addTo(mapRef.current);

            const lastSeenText = friend.isOnline
                ? 'Online now'
                : `Last seen: ${formatLastSeen(friend.last_seen)}`;

            marker.bindPopup(`
                <div class="friend-popup">
                    <strong>${friend.user?.username || 'Friend'}</strong><br/>
                    <small>${lastSeenText}</small>
                </div>
            `);

            friendMarkersRef.current.set(friend.user_id, marker);
        });

        friendMarkersRef.current.forEach((marker, userId) => {
            if (!currentFriendIds.has(userId)) {
                mapRef.current.removeLayer(marker);
                friendMarkersRef.current.delete(userId);
            }
        });

    }, [friendLocations, formatLastSeen, theme]);

    // Handlers
    const handleLocateMe = useCallback(async () => {
        if (userLocation && mapRef.current) {
            mapRef.current.setView([userLocation.latitude, userLocation.longitude], 16, {
                animate: true,
                duration: 0.5
            });
        } else {
            // Request location if not available
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                
                if (mapRef.current) {
                    mapRef.current.setView(
                        [position.coords.latitude, position.coords.longitude], 
                        16, 
                        { animate: true, duration: 0.5 }
                    );
                }
            } catch (error) {
                console.error('Failed to get location:', error);
            }
        }
    }, [userLocation]);

    const handleFriendSelect = useCallback((friend) => {
        const location = friendLocations.find(l => l.user_id === friend.user_id);
        if (location && mapRef.current) {
            mapRef.current.setView([location.latitude, location.longitude], 16, {
                animate: true,
                duration: 0.5
            });

            const marker = friendMarkersRef.current.get(friend.user_id);
            if (marker) {
                marker.openPopup();
            }
        }
    }, [friendLocations]);

    const handleBack = useCallback(() => {
        setView('menu');
    }, [setView]);

    const handleProfileClick = useCallback(() => {
        setView('profile');
    }, [setView]);

    const toggleLayer = useCallback(() => {
        setMapSettings(prev => ({ ...prev, layer: prev.layer === 'dark' ? 'light' : 'dark' }));
    }, [setMapSettings]);

    const toggleFogOfWar = useCallback(() => {
        setMapSettings(prev => ({ ...prev, showFogOfWar: !prev.showFogOfWar }));
    }, [setMapSettings]);

    const toggleFollowUser = useCallback(() => {
        setMapSettings(prev => ({ ...prev, followUser: !prev.followUser }));
    }, [setMapSettings]);

    const toggleStats = useCallback(() => {
        setShowStats(prev => !prev);
    }, []);

    const toggleDemoMode = useCallback(() => {
        const current = localStorage.getItem('orb_demo_location') === 'true';
        localStorage.setItem('orb_demo_location', current ? 'false' : 'true');
        console.log(`🧪 Demo mode ${current ? 'disabled' : 'enabled'}`);
        window.location.reload();
    }, []);

    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('orb_demo_location') === 'true';

    const exploredArea = exploredZones.reduce((acc, zone) => {
        return acc + Math.PI * Math.pow(zone.radius / 1000, 2);
    }, 0);

    return (
        <div className="map-view-container">
            {/* Map Container */}
            <div
                ref={mapContainerRef}
                className="map-container"
                style={{ width: '100%', height: '100%', minHeight: '100vh' }}
            />

            {/* TOP LEFT: Back Button (40px) */}
            <div className="map-controls-top-left">
                <MapControlButton onClick={handleBack} label="Back to Menu" className="control-back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </MapControlButton>
            </div>

            {/* TOP RIGHT: Theme Toggle + Settings (vertical stack, 40px each) */}
            <div className="map-controls-top-right">
                <MapControlButton onClick={toggleDemoMode} label="Demo Mode" active={isDemoMode} className="control-demo" title={isDemoMode ? 'Demo: ON' : 'Demo: OFF'}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                </MapControlButton>
                <MapControlButton onClick={toggleLayer} label="Toggle Theme" className="control-theme">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                </MapControlButton>
                <MapControlButton onClick={toggleFogOfWar} label="Fog of War" active={mapSettings.showFogOfWar} className="control-fog">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                    </svg>
                </MapControlButton>
            </div>

            {/* BOTTOM LEFT: Stats cards (explored km², friends nearby) */}
            <div className="map-controls-bottom-left">
                <MapControlButton onClick={toggleStats} label="Stats" active={showStats} className="control-stats">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                </MapControlButton>
            </div>

            {/* BOTTOM CENTER: Search bar (full width minus padding) */}
            <div className="map-controls-bottom-center">
                <MapSearchBar
                    friends={friendLocations.map(fl => fl.user).filter(Boolean)}
                    onFriendSelect={handleFriendSelect}
                />
            </div>

            {/* BOTTOM RIGHT: Locate me button + Zoom controls (vertical stack) */}
            <div className="map-controls-bottom-right">
                <MapControlButton onClick={handleLocateMe} label="Locate Me" className="control-locate">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                </MapControlButton>
                <MapControlButton onClick={toggleFollowUser} label="Follow Me" active={mapSettings.followUser} className="control-follow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </MapControlButton>
            </div>

            {/* Stats Panel */}
            {showStats && (
                <div className="map-stats-panel">
                    <div className="stat-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                        <span>{exploredArea.toFixed(1)} km² explored</span>
                    </div>
                    <div className="stat-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{friendLocations.length} friends nearby</span>
                    </div>
                    <div className="stat-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>{exploredZones.length} zones explored</span>
                    </div>
                </div>
            )}

            {/* Offline Warning */}
            {!isOnline && (
                <div className="connection-warning">
                    <div className="warning-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                            <line x1="12" y1="20" x2="12.01" y2="20"></line>
                        </svg>
                        <p>You're offline. Map will load when connection is restored.</p>
                    </div>
                </div>
            )}

            {/* Demo Mode Indicator */}
            {isDemoMode && (
                <div className="demo-mode-indicator">
                    <div className="demo-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                        <span>Демо режим (Лондон)</span>
                    </div>
                </div>
            )}

            {/* Location Permission Warning */}
            {locationPermission === 'denied' && (
                <div className="location-permission-warning">
                    <div className="warning-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p><strong>Location Access Denied</strong></p>
                        <p className="warning-subtext">To enable location sharing:</p>
                        <ol className="warning-steps">
                            <li>Tap the lock icon in your browser</li>
                            <li>Enable "Location" permission</li>
                            <li>Refresh the page</li>
                        </ol>
                        <p className="warning-subtext">Or use demo location in settings.</p>
                    </div>
                </div>
            )}

            {/* Init Error */}
            {initError && (
                <div className="location-permission-warning">
                    <div className="warning-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p>Map failed to load: {initError}</p>
                        <button 
                            className="retry-button"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!mapLoaded && !initError && (
                <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading map...</p>
                    {!isOnline && <p className="offline-note">Offline mode active</p>}
                </div>
            )}
        </div>
    );
}

export default function MapView() {
    return <MapViewContent />;
}
