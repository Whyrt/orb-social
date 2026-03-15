import React from 'react';
import { useSpring, animated } from '@react-spring/web';

function SignalGame({ funcs, state, setStake, bet, mult, cashout, crashPoint, loading }) {
    const isRunning = state === 'running';
    const isCrashed = state === 'crashed';
    const canBet = state === 'idle' && !loading;

    const { animatedMult } = useSpring({
        from: { animatedMult: 1.00 },
        to: { animatedMult: mult },
        config: { mass: 1, tension: 170, friction: 26, duration: 100 },
        immediate: isCrashed || canBet,
    });

    // Determine text color based on state using CSS variables
    const getMultiplierColor = () => {
        if (isCrashed) {
            return cashout > 0 ? 'var(--foreground)' : 'var(--foreground-dim)';
        }
        if (isRunning) return 'var(--foreground)';
        return 'var(--foreground-muted)';
    };

    return (
        <div className="card p-5 w-full max-w-sm mx-auto mt-2 animate-block"
             style={{ 
                 backgroundColor: 'var(--background-elevated)',
                 border: '1px solid var(--border-color)'
             }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                         style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--foreground)' }}>
                            Signal Flux
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                isRunning ? 'animate-pulse' : 'opacity-30'
                            }`} style={{ backgroundColor: isRunning ? 'var(--accent)' : 'var(--foreground-dim)' }}></div>
                            <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                                {isRunning ? 'Live' : (isCrashed ? 'Crashed' : 'Ready')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Multiplier Display */}
            <div className="text-center mb-6">
                <div className="relative w-32 h-32 mx-auto mb-4">
                    {/* Circular progress background */}
                    <div className="absolute inset-0 rounded-full"
                         style={{ 
                             background: `conic-gradient(var(--accent) ${Math.min(mult * 36, 360)}deg, var(--border-color) 0deg)`,
                             opacity: isRunning ? 0.3 : 0.1
                         }}>
                    </div>
                    <div className="absolute inset-2 rounded-full" style={{ backgroundColor: 'var(--background-elevated)' }}>
                        <div className="w-full h-full flex items-center justify-center">
                            <animated.span className="text-5xl font-bold" style={{ color: getMultiplierColor() }}>
                                {animatedMult.to(val => val.toFixed(2))}
                            </animated.span>
                        </div>
                    </div>
                </div>
                
                {/* Status text */}
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>
                    {isCrashed && cashout > 0 && (
                        <span style={{ color: 'var(--success)' }}>Cashed @ {mult.toFixed(2)}x | +{cashout} ORB</span>
                    )}
                    {isCrashed && cashout === 0 && (
                        <span style={{ color: 'var(--error)' }}>Crashed @ {mult.toFixed(2)}x</span>
                    )}
                    {isRunning && (
                        <span style={{ color: 'var(--accent)' }}>Tracking signal...</span>
                    )}
                    {canBet && 'Place your bet to start'}
                </p>
            </div>

            {/* Betting Controls */}
            <div className="space-y-3">
                {/* Stake input */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>Stake Amount</span>
                        <span className="text-[9px] font-semibold" style={{ color: 'var(--foreground)' }}>{bet} ORB</span>
                    </div>
                    <input
                        type="number"
                        value={bet}
                        onChange={e => setStake(e.target.value)}
                        placeholder="STAKE..."
                        className="w-full terminal-input text-center font-semibold"
                        disabled={!canBet}
                    />
                </div>

                {/* Quick bet buttons */}
                <div className="grid grid-cols-5 gap-2">
                    {[10, 50, 100, 250, 500].map(amt => (
                        <button
                            key={amt}
                            onClick={() => setStake(amt.toString())}
                            className="py-2.5 rounded-xl text-[8px] font-semibold uppercase tracking-wider press-effect transition-all"
                            style={{ 
                                backgroundColor: parseInt(bet) === amt ? 'var(--accent)' : 'var(--input-bg)',
                                color: parseInt(bet) === amt ? 'var(--accent-text)' : 'var(--foreground-muted)',
                                border: parseInt(bet) === amt ? 'none' : '1px solid var(--border-color)'
                            }}
                            disabled={!canBet}
                        >
                            {amt}
                        </button>
                    ))}
                </div>

                {/* Main action button */}
                <button
                    onClick={() => isRunning && cashout === 0
                        ? funcs.handleSignalCashout()
                        : funcs.handleSignalStart(bet)
                    }
                    disabled={loading || isCrashed || (isRunning && cashout > 0) || (canBet && parseInt(bet) <= 0)}
                    className="w-full py-4 rounded-xl text-[9px] font-semibold uppercase tracking-wider press-effect transition-all"
                    style={{
                        backgroundColor: isRunning && cashout === 0 ? 'var(--accent)' :
                            isCrashed ? 'var(--input-bg)' : 'var(--accent)',
                        color: isRunning && cashout === 0 ? 'var(--accent-text)' :
                            isCrashed ? 'var(--foreground-dim)' : 'var(--accent-text)',
                        opacity: (loading || isCrashed || (isRunning && cashout > 0) || (canBet && parseInt(bet) <= 0)) ? 0.5 : 1,
                        boxShadow: isRunning && cashout === 0 ? '0 4px 20px rgba(163, 255, 0, 0.3)' : 'none'
                    }}
                >
                    {isRunning && cashout === 0 && `Cashout @ ${mult.toFixed(2)}x (${Math.floor(parseInt(bet) * mult)} ORB)`}
                    {isCrashed && cashout > 0 && `Won: +${cashout} ORB`}
                    {isCrashed && cashout === 0 && `Next round in 3s`}
                    {canBet && `Start Game`}
                </button>
            </div>
        </div>
    );
}
export default SignalGame;
