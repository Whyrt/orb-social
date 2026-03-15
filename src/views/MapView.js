// src/views/MapView.js
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { calculateDistance } from '@/hooks/useGeolocation';
import { useFriendLocations } from '@/hooks/useFriendLocations';
import { useActions } from '@/lib/actions';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// ============================================
// REUSABLE COMPONENTS
// ============================================

function MapControlButton({ onClick, children, label, className = '', active = false, title }) {
    return (
        <button
            className={`map-control-btn ${active ? 'active' : ''} ${className}`}
            onClick={onClick}
            aria-label={label}
            title={title || label}
        >
            {children}
        </button>
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
// SIMPLE USER MARKER - MAXIMUM RELIABILITY
// ============================================

function createUserMarker(isDark = true) {
    const color = isDark ? '#ffffff' : '#000000';
    const borderColor = isDark ? '#000000' : '#ffffff';
    
    // Создаём HTML строку - максимально просто
    const html = `
        <div style="
            position: relative;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Pulsing ring -->
            <div style="
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: ${color};
                opacity: 0.3;
                animation: pulse 1.5s ease-out infinite;
            "></div>
            
            <!-- Center dot -->
            <div style="
                position: relative;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: ${color};
                border: 3px solid ${borderColor};
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                z-index: 10;
            "></div>
            
            <!-- Label -->
            <div style="
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                font-weight: 700;
                color: ${color};
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                white-space: nowrap;
                background: ${isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'};
                padding: 2px 6px;
                border-radius: 4px;
                z-index: 11;
            ">ВЫ</div>
        </div>
    `;
    
    return L.divIcon({
        html: html,
        className: 'user-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -30]
    });
}

// ============================================
// FRIEND MARKER
// ============================================

function createFriendMarker(isOnline, isDark = true) {
    const color = isOnline ? '#4ade80' : '#6b7280';
    const bgColor = isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)';
    
    const html = `
        <div style="
            position: relative;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${bgColor};
                border: 2.5px solid ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div style="
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${color};
                border: 2px solid ${bgColor};
            "></div>
        </div>
    `;
    
    return L.divIcon({
        html: html,
        className: 'friend-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25]
    });
}

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
// MINI MAP PREVIEW (for MenuView)
// ============================================

export function MiniMapPreview({ width = '100%', height = 200, onOpenMap, className = '' }) {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const userLocation = useAtomValue(userLocationAtom);
    const friendLocations = useAtomValue(friendLocationsAtom);
    const theme = useAtomValue(themeAtom);
    const [isInitialized, setIsInitialized] = useState(false);

    // Don't render mini-map if no location yet - prevents null coordinate errors
    const hasValidLocation = userLocation && 
                              typeof userLocation.latitude === 'number' && 
                              typeof userLocation.longitude === 'number' &&
                              !isNaN(userLocation.latitude) && 
                              !isNaN(userLocation.longitude);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!mapContainerRef.current || mapRef.current) return;

        try {
            if (L.Icon.Default && L.Icon.Default.prototype._getIconUrl) {
                delete L.Icon.Default.prototype._getIconUrl;
            }
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

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
            // Mini map init error
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [theme]); // Removed userLocation from dependencies

    useEffect(() => {
        if (!mapRef.current) return;

        const isDark = theme === 'dark' || theme === 'system';
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

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
    }, [theme]); // Removed userLocation from dependencies

    useEffect(() => {
        if (!mapRef.current || !isInitialized) return;

        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                mapRef.current.removeLayer(layer);
            }
        });

        // Используем дефолтный центр если нет локации
        const defaultCenter = [51.505, -0.09];

        const center = hasValidLocation
            ? [userLocation.latitude, userLocation.longitude]
            : defaultCenter;

        mapRef.current.setView(center, hasValidLocation ? 14 : 13);

        if (hasValidLocation) {
            const userIcon = createUserMarker(theme === 'dark');
            L.marker([userLocation.latitude, userLocation.longitude], {
                icon: userIcon,
                zIndexOffset: 1000,
            }).addTo(mapRef.current);

            L.circle([userLocation.latitude, userLocation.longitude], {
                radius: userLocation.accuracy || 20,
                color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                fillColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                fillOpacity: 0.3,
                weight: 1,
            }).addTo(mapRef.current);
        }

        const isDark = theme === 'dark' || theme === 'system';
        friendLocations.slice(0, 5).forEach((friend) => {
            if (friend &&
                typeof friend.latitude === 'number' &&
                typeof friend.longitude === 'number' &&
                !isNaN(friend.latitude) &&
                !isNaN(friend.longitude)) {
                const friendIcon = createFriendMarker(friend.isOnline, isDark);
                L.marker([friend.latitude, friend.longitude], {
                    icon: friendIcon,
                    zIndexOffset: 900,
                }).addTo(mapRef.current);
            }
        });

    }, [userLocation, friendLocations, isInitialized, theme, hasValidLocation]);

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
    const hasCenteredRef = useRef(false); // Track if we've centered on user

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

    // Load explored zones
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('orb_explored_zones');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setExploredZones(parsed);
            } catch (e) {
                // Failed to load explored zones
            }
        }
    }, [setExploredZones]);

    // Check location permission
    useEffect(() => {
        if (!('permissions' in navigator)) {
            setLocationPermission('prompt');
            return;
        }

        navigator.permissions.query({ name: 'geolocation' })
            .then(result => {
                setLocationPermission(result.state);
                result.onchange = () => setLocationPermission(result.state);
            })
            .catch(() => {
                setLocationPermission('prompt');
            });

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!mapContainerRef.current) return;
        if (mapRef.current || initAttemptedRef.current) return;

        initAttemptedRef.current = true;

        try {
            // Fix Leaflet default icons
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false,
                zoomAnimation: true,
                fadeAnimation: true,
                markerZoomAnimation: true,
                minZoom: 2,
                maxZoom: 19,
                worldCopyJump: true,
                center: [51.505, -0.09],
                zoom: 13,
                preferCanvas: true,
                zoomSnap: 0.5,
                wheelDebounceTime: 150,
                zoomDelta: 0.5,
            });

            setMapInstance(mapRef.current);

            L.control.attribution({
                position: 'bottomright',
                prefix: ''
            }).addTo(mapRef.current);

            setMapLoaded(true);

        } catch (error) {
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

    // Update tiles - ONLY on theme change, NOT on userLocation change
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        const tileLayers = {
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        };

        const tileUrl = theme === 'dark' ? tileLayers.dark : tileLayers.light;

        if (tileLayerRef.current) {
            mapRef.current.removeLayer(tileLayerRef.current);
        }

        tileLayerRef.current = L.tileLayer(tileUrl, {
            maxZoom: 19,
            minZoom: 2,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            detectRetina: true,
            updateWhenIdle: false,
            updateWhenZooming: true,
            keepBuffer: 4,
            maxNativeZoom: 18,
            crossOrigin: true,
            errorTileUrl: '',
            tileSize: 256,
            zoomOffset: 0,
        });

        tileLayerRef.current.on('tileerror', (error) => {
            setTileError(true);
        });

        tileLayerRef.current.on('load', () => {
            setTileError(false);
        });

        tileLayerRef.current.addTo(mapRef.current);

        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 100);

    }, [theme, mapLoaded]); // Removed userLocation from dependencies

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
    }, [exploredZones, mapSettings.showFogOfWar, theme, mapLoaded]);

    // Update Fog of War
    useEffect(() => {
        if (!fogOverlayRef.current) return;
        fogOverlayRef.current.setExploredZones(exploredZones);
        fogOverlayRef.current.setShowFogOfWar(mapSettings.showFogOfWar);
        fogOverlayRef.current.setTheme(theme);
    }, [exploredZones, mapSettings.showFogOfWar, theme, mapLoaded]);

    // CRITICAL: Update user marker - simplified and reliable
    // Only update marker position, don't follow user on every location update
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) {
            return;
        }

        const hasValidLocation = userLocation && 
                                  typeof userLocation.latitude === 'number' && 
                                  typeof userLocation.longitude === 'number' &&
                                  !isNaN(userLocation.latitude) && 
                                  !isNaN(userLocation.longitude);

        if (!hasValidLocation) {
            return;
        }

        const { latitude, longitude } = userLocation;
        const isDark = theme === 'dark' || theme === 'system';

        // Remove existing marker
        if (userMarkerRef.current) {
            mapRef.current.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
        }

        try {
            // Create and add new marker
            const userIcon = createUserMarker(isDark);
            userMarkerRef.current = L.marker([latitude, longitude], {
                icon: userIcon,
                zIndexOffset: 1000
            });

            userMarkerRef.current.addTo(mapRef.current);

            // Add popup
            const locationLabel = userLocation.isMock ? '🧪 Демо' : 'Вы';
            userMarkerRef.current.bindPopup(`
                <div class="location-popup" style="text-align: center;">
                    <strong>${locationLabel}</strong><br/>
                    <small>Точность: ${Math.round(userLocation.accuracy || 0)}м</small>
                </div>
            `);

            // Auto-follow ONLY on initial load or when zoom is far from user
            // Don't follow on every small location update
            if (mapSettings.followUser) {
                try {
                    const currentCenter = mapRef.current.getCenter();
                    if (currentCenter) {
                        const distance = calculateDistance(
                            currentCenter.lat,
                            currentCenter.lng,
                            latitude,
                            longitude
                        );
                        
                        // Only auto-center if user is more than 500m away from center
                        if (distance > 500 || !hasCenteredRef.current) {
                            mapRef.current.setView([latitude, longitude], mapRef.current.getZoom() || 15);
                            hasCenteredRef.current = true;
                        }
                    }
                } catch (centerError) {
                    // Map not ready, skip auto-center
                }
            }
        } catch (error) {
            // Error creating marker
        }

    }, [userLocation, mapLoaded, mapSettings.followUser, theme]);

    // Update friend markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        const currentFriendIds = new Set();
        const isDark = theme === 'dark' || theme === 'system';

        friendLocations.forEach(friend => {
            if (!friend.latitude || !friend.longitude) return;

            currentFriendIds.add(friend.user_id);

            if (friendMarkersRef.current.has(friend.user_id)) {
                mapRef.current.removeLayer(friendMarkersRef.current.get(friend.user_id));
            }

            const marker = L.marker([friend.latitude, friend.longitude], {
                icon: createFriendMarker(friend.isOnline, isDark),
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

    }, [friendLocations, formatLastSeen, mapLoaded, theme]);

    // Handlers
    const handleLocateMe = useCallback(async () => {
        if (userLocation && mapRef.current) {
            mapRef.current.setView([userLocation.latitude, userLocation.longitude], 16, {
                animate: true,
                duration: 0.5
            });
        } else {
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
                // Failed to get location
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

            {/* TOP LEFT: Back Button */}
            <div className="map-controls-top-left">
                <MapControlButton onClick={handleBack} label="Back to Menu" className="control-back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </MapControlButton>
            </div>

            {/* TOP RIGHT: Controls */}
            <div className="map-controls-top-right">
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

            {/* BOTTOM LEFT: Stats */}
            <div className="map-controls-bottom-left">
                <MapControlButton onClick={toggleStats} label="Stats" active={showStats} className="control-stats">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                </MapControlButton>
            </div>

            {/* BOTTOM CENTER: Search */}
            <div className="map-controls-bottom-center">
                <MapSearchBar
                    friends={friendLocations.map(fl => fl.user).filter(Boolean)}
                    onFriendSelect={handleFriendSelect}
                />
            </div>

            {/* BOTTOM RIGHT: Locate + Follow */}
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
                        <p>You&#39;re offline. Map will load when connection is restored.</p>
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
                        <p className="warning-subtext">Используйте демо&#39;режим для просмотра карты</p>
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
