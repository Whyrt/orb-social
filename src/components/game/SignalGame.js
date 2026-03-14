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
        <div className="terminal-window p-4 w-full max-w-sm mx-auto mt-2">
            <div className="terminal-header mb-4">
                <span className="tech-label">SIGNAL FLUX v1.0</span>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        isRunning ? 'animate-pulse' : 'opacity-30'
                    }`} style={{ backgroundColor: 'var(--foreground)' }}></div>
                    <span className="text-[6px] uppercase" style={{ color: 'var(--foreground)' }}>
                        {isRunning ? 'TRACKING' : (isCrashed ? 'CRASHED' : 'STANDBY')}
                    </span>
                </div>
            </div>

            <div className="text-center font-mono transition-all duration-100" style={{ color: getMultiplierColor() }}>
                <h2 className="text-5xl tracking-tighter leading-none">
                    <animated.span>
                        {animatedMult.to(val => val.toFixed(2))}
                    </animated.span>
                    <span className="text-xl ml-1">x</span>
                </h2>
                <div className="tech-line my-3"></div>
                <p className="text-[7px] font-mono uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>
                    {isCrashed && cashout > 0 && `CASHED @ ${mult.toFixed(2)}x | +${cashout} ORB`}
                    {isCrashed && cashout === 0 && `SIGNAL LOST @ ${mult.toFixed(2)}x`}
                    {isRunning && `TRACKING SIGNAL...`}
                    {canBet && `READY FOR NEXT FLUX`}
                </p>
            </div>

            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[6px] uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Stake Amount</span>
                    <span className="text-[9px] font-mono" style={{ color: 'var(--foreground)' }}>{bet} ORB</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <input
                        type="number"
                        value={bet}
                        onChange={e => setStake(e.target.value)}
                        placeholder="STAKE..."
                        className="flex-1 terminal-input text-center font-mono text-sm"
                        disabled={!canBet}
                    />
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                    {[10, 50, 100, 250, 500].map(amt => (
                        <button
                            key={amt}
                            onClick={() => setStake(amt.toString())}
                            className="py-1.5 terminal-border text-[7px] font-mono press-effect transition-colors"
                            style={{ color: 'var(--foreground-muted)' }}
                            disabled={!canBet}
                        >
                            {amt}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => isRunning && cashout === 0
                        ? funcs.handleSignalCashout()
                        : funcs.handleSignalStart(bet)
                    }
                    disabled={loading || isCrashed || (isRunning && cashout > 0) || (canBet && parseInt(bet) <= 0)}
                    className={`w-full py-3 font-mono text-[8px] uppercase tracking-widest press-effect transition-all terminal-border`}
                    style={{
                        backgroundColor: isRunning && cashout === 0 ? 'var(--accent)' :
                            isCrashed ? 'var(--input-bg)' : 'transparent',
                        color: isRunning && cashout === 0 ? 'var(--accent-text)' :
                            isCrashed ? 'var(--foreground-dim)' : 'var(--foreground)',
                        opacity: (loading || isCrashed || (isRunning && cashout > 0) || (canBet && parseInt(bet) <= 0)) ? 0.5 : 1
                    }}
                >
                    {isRunning && cashout === 0 && `CASHOUT @ ${mult.toFixed(2)}x (${Math.floor(parseInt(bet) * mult)} ORB)`}
                    {isCrashed && cashout > 0 && `WON: +${cashout} ORB`}
                    {isCrashed && cashout === 0 && `SIGNAL LOST - NEXT IN 3s`}
                    {canBet && `INITIATE TRACE`}
                </button>
            </div>
        </div>
    );
}
export default SignalGame;
