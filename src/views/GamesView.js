import React from 'react';
import { useAtomValue } from 'jotai';
import {
    userStatsAtom, loadingAtom,
    signalStakeAtom, signalMultiplierAtom, signalCrashPointAtom, signalStateAtom, signalCashoutAmountAtom
} from '@/atoms/index.js';
import { useActions } from '@/lib/actions';
import SignalGame from '../components/game/SignalGame.js';
import { useDevice } from '@/hooks/useDevice';

export default function GamesView() {
    const stats = useAtomValue(userStatsAtom);
    const loading = useAtomValue(loadingAtom);
    const { isMobile } = useDevice();

    const signalStake = useAtomValue(signalStakeAtom);
    const signalMultiplier = useAtomValue(signalMultiplierAtom);
    const signalCrashPoint = useAtomValue(signalCrashPointAtom);
    const signalState = useAtomValue(signalStateAtom);
    const signalCashoutAmount = useAtomValue(signalCashoutAmountAtom);

    const {
        setView, setSignalStake,
        handleSignalStart, handleSignalCashout
    } = useActions();

    const signalGameFuncs = {
        handleSignalStart,
        handleSignalCashout,
        loading
    };

    return (
        <div className="absolute inset-0 z-20 flex flex-col pt-14 px-4 pb-24 overflow-y-auto no-scrollbar grid-pattern"
             style={{ backgroundColor: 'var(--background)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('profile')}
                     style={{ color: 'var(--foreground-muted)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    <div className="terminal-header">
                        <span className="tech-label">SIGNAL FLUX</span>
                    </div>
                </div>
                <div className="terminal-window px-3 py-1.5">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>{stats.balance}</span>
                        <span className="text-[6px] font-mono uppercase" style={{ color: 'var(--foreground-dim)' }}>ORB</span>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="terminal-window p-4 mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5" style={{ backgroundColor: 'var(--foreground-muted)' }}></div>
                    <h2 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>Game Module</h2>
                </div>
                <p className="text-[6px] font-mono uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                    Predict the signal crash point. Cash out before it collapses.
                </p>
            </div>

            {/* Signal Game Component */}
            <SignalGame
                funcs={signalGameFuncs}
                state={signalState}
                setStake={setSignalStake}
                bet={signalStake}
                mult={signalMultiplier}
                cashout={signalCashoutAmount}
                crashPoint={signalCrashPoint}
                loading={loading}
            />
        </div>
    );
}
