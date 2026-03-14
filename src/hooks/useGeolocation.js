// src/hooks/useGeolocation.js
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { userLocationAtom, exploredZonesAtom, locationSharingAtom, userAtom } from '@/atoms';
import { supabase } from '@/lib/supabase';

/**
 * Demo location (London) for fallback
 */
const DEMO_LOCATION = {
    coords: {
        latitude: 51.505,
        longitude: -0.09,
        accuracy: 10,
        heading: 0,
        speed: 0
    },
    timestamp: Date.now(),
    isMock: true,
    isDemo: true
};

/**
 * Check if HTTPS is enabled
 */
const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

/**
 * Get geolocation with comprehensive mobile support and fallback
 */
export const getGeolocation = async (options = {}) => {
    const { 
        useDemo = false, 
        enableHighAccuracy = true, 
        timeout = 15000,
        maximumAge = 0 
    } = options;

    // Force demo mode if requested
    if (useDemo) {
        console.log('🧪 Using demo location (London)');
        return { ...DEMO_LOCATION, timestamp: Date.now() };
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
    }

    // Check HTTPS (required for geolocation on most browsers)
    if (!isSecureContext && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Geolocation requires HTTPS. Using demo location.');
        return { ...DEMO_LOCATION, timestamp: Date.now(), isDemo: true };
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    coords: position.coords,
                    timestamp: position.timestamp,
                    isMock: false,
                    isDemo: false
                });
            },
            (error) => {
                const errorMessage = getGeolocationErrorMessage(error);
                console.warn('Geolocation error:', errorMessage);
                reject(error);
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge
            }
        );
    });
};

/**
 * Get user-friendly error message for geolocation errors
 */
function getGeolocationErrorMessage(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Location permission denied. Please enable in browser settings.';
        case error.POSITION_UNAVAILABLE:
            return 'Location information unavailable. Check GPS settings.';
        case error.TIMEOUT:
            return 'Location request timed out. Please try again.';
        default:
            return 'An unknown error occurred while getting location.';
    }
}

/**
 * Custom hook for managing user geolocation with mobile optimizations
 */
export function useGeolocation() {
    const setUserLocation = useSetAtom(userLocationAtom);
    const setExploredZones = useSetAtom(exploredZonesAtom);
    const locationSharing = useAtomValue(locationSharingAtom);
    const user = useAtomValue(userAtom);
    
    const watchIdRef = useRef(null);
    const channelRef = useRef(null);
    const lastUpdateRef = useRef(0);
    const demoWatchIntervalRef = useRef(null);
    const [error, setError] = useState(null);
    const [permissionState, setPermissionState] = useState('prompt');

    /**
     * Add explored zone when user moves
     */
    const addExploredZone = useCallback((latitude, longitude) => {
        const newZone = {
            center: { lat: latitude, lng: longitude },
            radius: 3000, // 3km
            timestamp: Date.now()
        };

        setExploredZones(prev => {
            // Filter out overlapping zones
            const nonOverlapping = prev.filter(zone => {
                const distance = calculateDistance(
                    zone.center.lat, zone.center.lng,
                    latitude, longitude
                );
                return distance > 2000;
            });

            const updated = [...nonOverlapping, newZone];
            
            // Persist to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('orb_explored_zones', JSON.stringify(updated));
            }
            
            return updated;
        });
    }, [setExploredZones]);

    /**
     * Broadcast location to Supabase Realtime
     */
    const broadcastLocation = useCallback((latitude, longitude, accuracy) => {
        if (!channelRef.current || !user) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'location_update',
            payload: {
                user_id: user.id,
                latitude,
                longitude,
                accuracy,
                timestamp: Date.now()
            }
        });
    }, [user]);

    /**
     * Persist location to database (throttled)
     */
    const persistLocation = useCallback(async (latitude, longitude, accuracy) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 30000) return;
        
        lastUpdateRef.current = now;

        try {
            await supabase
                .from('user_locations')
                .upsert({
                    user_id: user?.id,
                    latitude,
                    longitude,
                    accuracy: accuracy || 0,
                    last_seen: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });
        } catch (error) {
            console.error('Failed to persist location:', error);
        }
    }, [user]);

    /**
     * Handle position update
     */
    const handlePositionUpdate = useCallback((positionData) => {
        const { latitude, longitude, accuracy, heading, speed } = positionData.coords;
        const isMock = positionData.isMock || false;
        const isDemo = positionData.isDemo || false;

        setUserLocation({
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
            timestamp: positionData.timestamp,
            isMock,
            isDemo
        });

        addExploredZone(latitude, longitude);
        broadcastLocation(latitude, longitude, accuracy);
        persistLocation(latitude, longitude, accuracy);
        setError(null);
    }, [setUserLocation, addExploredZone, broadcastLocation, persistLocation]);

    /**
     * Handle geolocation error with fallback
     */
    const handleGeolocationError = useCallback((error) => {
        const errorMessage = getGeolocationErrorMessage(error);
        setError(errorMessage);
        console.warn('Geolocation error, using demo location:', errorMessage);
        
        // Auto-fallback to demo location
        handlePositionUpdate(DEMO_LOCATION);
    }, [handlePositionUpdate]);

    /**
     * Start watching with mobile optimizations and real-time tracking
     */
    const startWatching = useCallback(async () => {
        // Clear any existing watchers
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (demoWatchIntervalRef.current !== null) {
            clearInterval(demoWatchIntervalRef.current);
            demoWatchIntervalRef.current = null;
        }

        setError(null);

        // Check if using demo mode
        const useDemo = typeof window !== 'undefined' &&
            (localStorage.getItem('orb_demo_location') === 'true' || !isSecureContext);

        if (useDemo) {
            console.log('🧪 Starting demo location watcher');
            handlePositionUpdate(DEMO_LOCATION);

            // Update demo location every 2 seconds for smooth tracking
            demoWatchIntervalRef.current = setInterval(() => {
                handlePositionUpdate({
                    ...DEMO_LOCATION,
                    timestamp: Date.now()
                });
            }, 2000);
            return;
        }

        // Real geolocation watching
        if (!navigator.geolocation) {
            const msg = 'Geolocation is not supported';
            setError(msg);
            console.error(msg);
            handlePositionUpdate(DEMO_LOCATION);
            return;
        }

        try {
            // First, get initial position
            const initialPosition = await getGeolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
            handlePositionUpdate(initialPosition);

            // Then start watching with optimized settings for real-time tracking
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    handlePositionUpdate({
                        coords: position.coords,
                        timestamp: position.timestamp,
                        isMock: false,
                        isDemo: false
                    });
                },
                handleGeolocationError,
                {
                    enableHighAccuracy: true,      // Use GPS for best accuracy
                    timeout: 10000,                // 10 second timeout
                    maximumAge: 0,                 // Don't accept cached positions
                }
            );
        } catch (error) {
            handleGeolocationError(error);
        }
    }, [handlePositionUpdate, handleGeolocationError]);

    /**
     * Stop watching
     */
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (demoWatchIntervalRef.current !== null) {
            clearInterval(demoWatchIntervalRef.current);
            demoWatchIntervalRef.current = null;
        }
    }, []);

    /**
     * Request location permission (mobile-friendly)
     */
    const requestPermission = useCallback(async () => {
        if (!navigator.permissions) {
            // iOS Safari doesn't support permissions API
            return 'prompt';
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            setPermissionState(result.state);
            
            result.onchange = () => {
                setPermissionState(result.state);
            };

            return result.state;
        } catch (error) {
            console.warn('Permission check failed:', error);
            return 'prompt';
        }
    }, []);

    /**
     * Get current position (one-time)
     */
    const getCurrentPosition = useCallback(async (options = {}) => {
        return await getGeolocation(options);
    }, []);

    // Check permission on mount
    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    // Setup Supabase Realtime channel
    useEffect(() => {
        if (!user || !locationSharing) return;

        channelRef.current = supabase.channel('user_locations_broadcast', {
            config: {
                broadcast: { self: true },
                presence: { key: user.id }
            }
        });

        channelRef.current.subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [user, locationSharing]);

    // Start/stop watching
    useEffect(() => {
        if (locationSharing) {
            startWatching();
        } else {
            stopWatching();
        }

        return () => {
            stopWatching();
        };
    }, [locationSharing, startWatching, stopWatching]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopWatching();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [stopWatching]);

    return {
        startWatching,
        stopWatching,
        getCurrentPosition,
        requestPermission,
        isWatching: watchIdRef.current !== null || demoWatchIntervalRef.current !== null,
        error,
        permissionState,
        hasPermission: permissionState === 'granted',
        isDenied: permissionState === 'denied'
    };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Check if a point is within a circle
 */
export function isPointInCircle(pointLat, pointLng, centerLat, centerLng, radiusMeters) {
    const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
    return distance <= radiusMeters;
}

/**
 * Toggle demo location mode
 */
export function toggleDemoLocation(enabled) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('orb_demo_location', enabled ? 'true' : 'false');
        console.log(`🧪 Demo location ${enabled ? 'enabled' : 'disabled'}`);
        window.location.reload();
    }
}

/**
 * Check if demo location is enabled
 */
export function isDemoLocationEnabled() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('orb_demo_location') === 'true' || !isSecureContext;
}
