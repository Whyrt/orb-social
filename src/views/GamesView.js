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
        <div className="absolute inset-0 z-20 flex flex-col overflow-hidden grid-pattern"
             style={{ backgroundColor: 'var(--background)' }}>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-12 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('profile')}>
                        <button className="w-10 h-10 card flex items-center justify-center press-effect">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Signal Flux</h1>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                Predict & cash out
                            </p>
                        </div>
                    </div>
                    
                    {/* Balance */}
                    <div className="card px-3 py-2 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {stats.balance.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-24 px-4">
                
                {/* Game Info Card */}
                <div className="card p-4 mb-4 animate-block">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                             style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>Game Module</h2>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                Predict the crash point
                            </p>
                        </div>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Place your bet and watch the multiplier grow. Cash out before it crashes to win!
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
        </div>
    );
}
