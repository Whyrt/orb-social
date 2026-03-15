// src/atoms.js (Refactored version with better state management)
import { atom } from 'jotai';

// --- USER ---
export const userAtom = atom(null);
export const userStatsAtom = atom({ balance: 0, code: null, invites: [], badges: [] });
export const friendsAtom = atom([]);
export const loadingAtom = atom(false);

// --- INITIALIZATION ---
export const isInitializingAtom = atom(false);
export const connectionStatusAtom = atom('connecting');
export const loadAttemptsAtom = atom(0);

// --- SETTINGS ---
// Initialize theme from localStorage on client side, default to 'dark'
const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'dark';
    const savedTheme = localStorage.getItem('orb_theme');
    if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
        return savedTheme;
    }
    return 'dark';
};
export const themeAtom = atom(getInitialTheme()); // 'dark' | 'light' | 'system'

// --- ИНТЕРФЕЙС ---
export const viewAtom = atom('menu'); // 'menu' | 'map' | 'chat' | 'profile' | 'friends_manage' | 'invites' | 'games'
export const toastsAtom = atom([]);
export const activeChatAtom = atom(null);
export const globalPlayerAtom = atom({
    isPlaying: false,
    src: null,
    title: 'Unknown Node',
    artist: 'System',
    isMusicNode: true,
    sourceKey: 0,
});

// --- ЧАТ ---
export const chatsAtom = atom([]);
export const hiddenMessagesAtom = atom([]);
export const chatPageAtom = atom(0);
export const hasMoreMessagesAtom = atom(true);

// --- ИГРА (SIGNAL) ---
export const signalStakeAtom = atom(10);
export const signalMultiplierAtom = atom(1.00);
export const signalCrashPointAtom = atom(null);
export const signalStateAtom = atom('idle');
export const signalCashoutAmountAtom = atom(0);
export const signalCurrentBetAtom = atom(null);

// --- DEBOUNCE STATES ---
export const lastActionTimeAtom = atom({
    sendMsg: 0,
    addFriend: 0,
    buyInvite: 0,
    signalStart: 0,
});

// --- MAP / LOCATION ---
// User's current geolocation
export const userLocationAtom = atom(null); // { latitude, longitude, accuracy, heading, speed }

// Friend locations (fetched from Supabase)
export const friendLocationsAtom = atom([]); // Array of { user_id, latitude, longitude, last_seen, user }

// Explored zones for Fog of War (LocalStorage persisted)
// Initialize empty on server, load from localStorage in component
export const exploredZonesAtom = atom([]); // Array of { center: {lat, lng}, radius }

// Map settings
export const mapSettingsAtom = atom({
    showFriends: true,
    showFogOfWar: true,
    layer: 'satellite', // 'street' | 'satellite' | 'dark'
    followUser: true,
});

// Map instance reference (for imperative operations)
export const mapInstanceAtom = atom(null);

// Location sharing status
export const locationSharingAtom = atom(true); // Whether user is sharing their location
