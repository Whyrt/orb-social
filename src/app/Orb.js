"use client"
import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { Provider, useAtomValue, useStore } from 'jotai';
import { atom } from 'jotai';

import {
    userAtom, viewAtom, toastsAtom, globalPlayerAtom, activeChatAtom,
    signalMultiplierAtom, signalCrashPointAtom, signalStateAtom, signalCashoutAmountAtom,
    signalCurrentBetAtom, isInitializingAtom, connectionStatusAtom, themeAtom
} from '@/atoms';

import { useAppInitializer } from '@/hooks/useAppInitializer';
import { useActions } from '@/lib/actions';
import useAudioData from '@/hooks/useAudioData';
import { useDevice } from '@/hooks/useDevice';
import { useTheme } from '@/hooks/useTheme';

import GlobalStyles from '@/styles/GlobalStyles';
import ToastContainer from '@/components/ui/ToastContainer';
import PersistentPlayer from '@/components/ui/PersistentPlayer';
import BottomBar from '@/components/ui/BottomBar';
import NeuralSphere from '@/components/NeuralSphere';
import LoginView from '@/views/LoginView';
import MenuView from '@/views/MenuView';
import GamesView from '@/views/GamesView';
import ProfileView from '@/views/ProfileView';
import FriendsManageView from '@/views/FriendsManageView';
import InvitesView from '@/views/InvitesView';
import ChatView from '@/views/ChatView';

// Dynamic import for MapView with SSR disabled (Leaflet requires browser)
import dynamic from 'next/dynamic';
const MapView = dynamic(() => import('@/views/MapView'), { ssr: false });

// Import MapView styles
import '@/styles/MapView.css';

/**
 * Loading Screen Component
 * Displays during app initialization
 */
function LoadingScreen() {
    return (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center"
             style={{ backgroundColor: 'var(--background)' }}>
            <div className="terminal-window p-8 flex flex-col items-center">
                <div className="w-16 h-16 terminal-border flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin"
                         style={{ 
                             borderColor: 'var(--border-color)',
                             borderTopColor: 'var(--accent)'
                         }}></div>
                </div>
                <p className="text-[9px] font-mono uppercase tracking-widest animate-pulse"
                   style={{ color: 'var(--foreground-muted)' }}>
                    Initializing Node...
                </p>
            </div>
        </div>
    );
}

/**
 * Connection Status Indicator
 * Shows connection state to the user
 */
function ConnectionStatus({ status }) {
    if (status === 'connected') return null;

    const getStatusColors = () => {
        switch (status) {
            case 'error':
                return { bg: 'var(--error-bg)', border: 'var(--error)', dot: 'var(--error)', text: 'var(--error)' };
            case 'reconnecting':
                return { bg: 'rgba(251, 191, 36, 0.2)', border: 'var(--warning)', dot: 'var(--warning)', text: 'var(--warning)' };
            default:
                return { bg: 'var(--input-bg)', border: 'var(--border-color)', dot: 'var(--foreground-muted)', text: 'var(--foreground-muted)' };
        }
    };

    const colors = getStatusColors();

    return (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="px-4 py-1.5 terminal-border flex items-center gap-2"
                 style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                    status === 'reconnecting' ? 'animate-pulse' : ''
                }`} style={{ backgroundColor: colors.dot }}></div>
                <span className="text-[6px] font-mono uppercase tracking-widest" style={{ color: colors.text }}>
                    {status === 'error' ? 'CONNECTION LOST' :
                     status === 'reconnecting' ? 'RECONNECTING...' :
                     'CONNECTING...'}
                </span>
            </div>
        </div>
    );
}

function Interface() {
    const user = useAtomValue(userAtom);
    const view = useAtomValue(viewAtom);
    const { checkSession, isInitializing, connectionStatus } = useActions();

    useEffect(() => {
        if (!user) {
            checkSession();
        }
    }, [user, checkSession]);

    if (!user) return <LoginView />;

    switch (view) {
        case 'menu': return <MenuView />;
        case 'map': return <MapView />;
        case 'games': return <GamesView />;
        case 'profile': return <ProfileView />;
        case 'friends_manage': return <FriendsManageView />;
        case 'invites': return <InvitesView />;
        case 'chat': return <ChatView />;
        default: return <MenuView />;
    }
}

function OrbContent() {
    useAppInitializer();
    useTheme(); // Apply theme on load

    const store = useStore();
    const view = useAtomValue(viewAtom);
    const toasts = useAtomValue(toastsAtom);
    const globalPlayer = useAtomValue(globalPlayerAtom);
    const activeChat = useAtomValue(activeChatAtom);
    const isInitializing = useAtomValue(isInitializingAtom);
    const connectionStatus = useAtomValue(connectionStatusAtom);

    const { setView, setGlobalPlayerState, setSignalMultiplier, setSignalState, setSignalCrashPoint, setSignalCurrentBet } = useActions();
    const { isMobile, isDesktop } = useDevice();

    const { signalState, signalCashoutAmount, signalCrashPoint } = useAtomValue(atom(get => ({
        signalState: get(signalStateAtom),
        signalCashoutAmount: get(signalCashoutAmountAtom),
        signalCrashPoint: get(signalCrashPointAtom)
    })));

    const audioRef = useRef(null);
    const audioData = useAudioData(audioRef, globalPlayer.isPlaying);

    // Game loop for signal multiplier animation
    useEffect(() => {
        if (signalState !== 'running' || signalCashoutAmount > 0) return;

        let frameId;
        let lastTime = 0;

        const gameLoop = (timestamp) => {
            if (lastTime === 0) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            const growthRate = 0.0002;
            const currentMultiplier = store.get(signalMultiplierAtom);
            const newMultiplier = currentMultiplier + growthRate * deltaTime * currentMultiplier;

            if (newMultiplier >= signalCrashPoint) {
                store.set(signalMultiplierAtom, signalCrashPoint);
                setSignalState('crashed');
                setSignalCurrentBet(null);

                setTimeout(() => {
                    setSignalState('idle');
                    setSignalCrashPoint(null);
                }, 3000);

                cancelAnimationFrame(frameId);
                return;
            }

            store.set(signalMultiplierAtom, newMultiplier);
            frameId = requestAnimationFrame(gameLoop);
        };

        frameId = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [signalState, signalCashoutAmount, signalCrashPoint, store, setSignalState, setSignalCurrentBet, setSignalCrashPoint]);

    /**
     * Swipe gesture handler for navigation
     * Optimized to not interfere with native scrolling
     */
    const viewsOrder = ['profile', 'menu', 'chat'];
    const bindSwipes = useDrag(({ active, movement: [mx], direction: [xDir], cancel }) => {
        // Only handle swipes when no chat is active and on mobile
        if (activeChat || !isMobile) return;
        
        // Increased threshold for more intentional swipes (120px vs 100px)
        if (active && Math.abs(mx) > 120 && Math.abs(xDir) > 0.5) {
            const idx = viewsOrder.indexOf(view);
            let next = idx;
            if (xDir > 0 && idx > 0) next--;
            else if (xDir < 0 && idx < viewsOrder.length - 1) next++;
            if (next !== idx) { 
                setView(viewsOrder[next]); 
                cancel(); 
            }
        }
    }, { 
        axis: 'x', 
        filterTaps: true, 
        pointer: { touch: true },
        // Allow native scroll when not actively swiping
        touchAction: 'pan-y pan-x'
    });

    return (
        <div {...bindSwipes()} 
             className={`fixed inset-0 w-full h-[100dvh] overflow-hidden touch-none select-none ${isDesktop ? 'desktop-centered' : ''}`}
             style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            <GlobalStyles />
            <PersistentPlayer player={globalPlayer} setPlayer={setGlobalPlayerState} audioRef={audioRef} />
            <ToastContainer toasts={toasts} />

            {/* Loading indicator */}
            {isInitializing && <LoadingScreen />}

            {/* Connection status indicator */}
            <ConnectionStatus status={connectionStatus} />

            {/* 3D Neural Sphere Background - only visible on menu view */}
            <div className={`absolute inset-0 z-0 transition-all duration-1000 pointer-events-none ${
                view === 'menu' ? 'opacity-100' : 'opacity-0'
            }`}>
                <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
                    <color attach="background" args={['#000000']} />
                    <NeuralSphere view={view} audioData={audioData} globalPlayer={globalPlayer} />
                </Canvas>
            </div>
            
            {/* Main interface layer */}
            <div key={view} className="relative z-[100] w-full h-full animate-soft-switch">
                <Interface />
            </div>
            
            {/* Bottom navigation bar */}
            {!activeChat && <BottomBar view={view} setView={setView} isDesktop={isDesktop} />}
        </div>
    )
}

export default function Orb() {
    return <Provider><OrbContent /></Provider>;
}
