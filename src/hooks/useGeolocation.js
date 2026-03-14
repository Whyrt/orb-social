// src/hooks/useGeolocation.js
import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { userLocationAtom, exploredZonesAtom, locationSharingAtom, userAtom } from '@/atoms';
import { supabase } from '@/lib/supabase';

/**
 * Mock geolocation for development (London coordinates)
 */
const MOCK_LOCATION = {
    coords: {
        latitude: 51.505,
        longitude: -0.09,
        accuracy: 10,
        heading: 0,
        speed: 0
    },
    timestamp: Date.now(),
    isMock: true
};

/**
 * Get geolocation with mock support for development
 */
const getGeolocation = () => {
    // Check if mock mode is enabled in localStorage
    const useMock = typeof window !== 'undefined' && localStorage.getItem('orb_mock_location') === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if ((isDevelopment && useMock) || useMock) {
        console.log('🧪 Using mock location (London)');
        return Promise.resolve({
            ...MOCK_LOCATION,
            timestamp: Date.now()
        });
    }

    // Production: real geolocation
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    coords: position.coords,
                    timestamp: position.timestamp,
                    isMock: false
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );
    });
};

/**
 * Custom hook for managing user geolocation
 */
export function useGeolocation() {
    const setUserLocation = useSetAtom(userLocationAtom);
    const setExploredZones = useSetAtom(exploredZonesAtom);
    const locationSharing = useAtomValue(locationSharingAtom);
    const user = useAtomValue(userAtom);
    
    const watchIdRef = useRef(null);
    const channelRef = useRef(null);
    const lastUpdateRef = useRef(0);
    const mockWatchIntervalRef = useRef(null);

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

        setUserLocation({
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
            timestamp: positionData.timestamp,
            isMock
        });

        addExploredZone(latitude, longitude);
        broadcastLocation(latitude, longitude, accuracy);
        persistLocation(latitude, longitude, accuracy);
    }, [setUserLocation, addExploredZone, broadcastLocation, persistLocation]);

    /**
     * Start watching with mock support
     */
    const startWatching = useCallback(() => {
        // Clear any existing watchers
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        if (mockWatchIntervalRef.current !== null) {
            clearInterval(mockWatchIntervalRef.current);
        }

        // Check if using mock location
        const useMock = typeof window !== 'undefined' && localStorage.getItem('orb_mock_location') === 'true';
        const isDevelopment = process.env.NODE_ENV === 'development';

        if ((isDevelopment && useMock) || useMock) {
            // Mock location watching
            console.log('🧪 Starting mock location watcher');
            handlePositionUpdate(MOCK_LOCATION);
            
            mockWatchIntervalRef.current = setInterval(() => {
                handlePositionUpdate({
                    ...MOCK_LOCATION,
                    timestamp: Date.now()
                });
            }, 5000); // Update every 5 seconds
        } else {
            // Real geolocation watching
            if (!navigator.geolocation) {
                console.error('Geolocation is not supported');
                return;
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    handlePositionUpdate({
                        coords: position.coords,
                        timestamp: position.timestamp,
                        isMock: false
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error.code, error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );
        }
    }, [handlePositionUpdate]);

    /**
     * Stop watching
     */
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (mockWatchIntervalRef.current !== null) {
            clearInterval(mockWatchIntervalRef.current);
            mockWatchIntervalRef.current = null;
        }
    }, []);

    /**
     * Get current position (one-time)
     */
    const getCurrentPosition = useCallback(async () => {
        return await getGeolocation();
    }, []);

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
        isWatching: watchIdRef.current !== null || mockWatchIntervalRef.current !== null
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
 * Toggle mock location mode (for development)
 */
export function toggleMockLocation(enabled) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('orb_mock_location', enabled ? 'true' : 'false');
        console.log(`🧪 Mock location ${enabled ? 'enabled' : 'disabled'}`);
        // Reload to apply changes
        window.location.reload();
    }
}

/**
 * Check if mock location is enabled
 */
export function isMockLocationEnabled() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('orb_mock_location') === 'true';
}
