// src/hooks/useFriendLocations.js
import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { friendLocationsAtom, userAtom, friendsAtom } from '@/atoms';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for managing friend locations via Supabase Realtime
 * - Subscribes to postgres_changes for user_locations table
 * - Subscribes to broadcast channel for real-time updates
 * - Filters friends based on visibility range
 */
export function useFriendLocations() {
    const setFriendLocations = useSetAtom(friendLocationsAtom);
    const user = useAtomValue(userAtom);
    const friends = useAtomValue(friendsAtom);
    
    const channelRef = useRef(null);
    const presenceChannelRef = useRef(null);

    /**
     * Fetch initial friend locations from database
     */
    const fetchFriendLocations = useCallback(async () => {
        if (!user || !friends.length) {
            setFriendLocations([]);
            return;
        }

        try {
            const friendIds = friends
                .filter(f => f.status === 'accepted')
                .map(f => f.friend_id === user.id ? f.user_id : f.friend_id);

            if (friendIds.length === 0) {
                setFriendLocations([]);
                return;
            }

            const { data, error } = await supabase
                .from('user_locations')
                .select('user_id, latitude, longitude, last_seen, accuracy')
                .in('user_id', friendIds);

            if (error) throw error;

            // Enrich with friend data
            const enriched = data.map(location => {
                const friend = friends.find(
                    f => (f.friend_id === location.user_id || f.user_id === location.user_id)
                );
                return {
                    ...location,
                    user: friend ? {
                        id: location.user_id,
                        username: friend.friend_id === user.id ? friend.user_id : friend.friend_id,
                        // Add more friend data as needed
                    } : null,
                    isOnline: isRecentlyActive(location.last_seen)
                };
            });

            setFriendLocations(enriched);
        } catch (error) {
            // Failed to fetch friend locations
        }
    }, [user, friends, setFriendLocations]);

    /**
     * Check if a timestamp is within the last 5 minutes (considered "online")
     */
    const isRecentlyActive = (timestamp) => {
        if (!timestamp) return false;
        const lastSeen = new Date(timestamp);
        const now = new Date();
        const diffMs = now - lastSeen;
        return diffMs < 5 * 60 * 1000; // 5 minutes
    };

    /**
     * Format "last seen" time for display
     */
    const formatLastSeen = useCallback((timestamp) => {
        if (!timestamp) return 'Unknown';
        
        const lastSeen = new Date(timestamp);
        const now = new Date();
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return lastSeen.toLocaleDateString();
    }, []);

    // Subscribe to database changes via postgres_changes
    useEffect(() => {
        if (!user) return;

        channelRef.current = supabase
            .channel('friend_locations_db')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_locations'
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newLocation = payload.new;
                        
                        // Check if this is a friend's location
                        const friendIds = friends
                            .filter(f => f.status === 'accepted')
                            .map(f => f.friend_id === user.id ? f.user_id : f.friend_id);

                        if (friendIds.includes(newLocation.user_id)) {
                            setFriendLocations(prev => {
                                const existing = prev.findIndex(l => l.user_id === newLocation.user_id);
                                const friend = friends.find(
                                    f => (f.friend_id === newLocation.user_id || f.user_id === newLocation.user_id)
                                );

                                const updated = {
                                    ...newLocation,
                                    user: friend,
                                    isOnline: isRecentlyActive(newLocation.last_seen)
                                };

                                if (existing >= 0) {
                                    const copy = [...prev];
                                    copy[existing] = updated;
                                    return copy;
                                }
                                return [...prev, updated];
                            });
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.user_id;
                        setFriendLocations(prev => prev.filter(l => l.user_id !== deletedId));
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [user, friends, setFriendLocations]);

    // Subscribe to broadcast channel for real-time updates
    useEffect(() => {
        if (!user) return;

        presenceChannelRef.current = supabase
            .channel('user_locations_broadcast')
            .on('broadcast', { event: 'location_update' }, (payload) => {
                const { user_id, latitude, longitude, accuracy, timestamp } = payload.payload;
                
                // Check if this is a friend
                const friendIds = friends
                    .filter(f => f.status === 'accepted')
                    .map(f => f.friend_id === user.id ? f.user_id : f.friend_id);

                if (friendIds.includes(user_id)) {
                    setFriendLocations(prev => {
                        const existing = prev.findIndex(l => l.user_id === user_id);
                        const friend = friends.find(
                            f => (f.friend_id === user_id || f.user_id === user_id)
                        );

                        const updated = {
                            user_id,
                            latitude,
                            longitude,
                            accuracy,
                            last_seen: new Date(timestamp).toISOString(),
                            user: friend,
                            isOnline: true
                        };

                        if (existing >= 0) {
                            const copy = [...prev];
                            copy[existing] = updated;
                            return copy;
                        }
                        return [...prev, updated];
                    });
                }
            })
            .subscribe();

        return () => {
            if (presenceChannelRef.current) {
                supabase.removeChannel(presenceChannelRef.current);
            }
        };
    }, [user, friends, setFriendLocations]);

    // Fetch initial locations when friends list changes
    useEffect(() => {
        fetchFriendLocations();
    }, [fetchFriendLocations]);

    return {
        formatLastSeen,
        refreshLocations: fetchFriendLocations
    };
}
