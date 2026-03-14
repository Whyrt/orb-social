import React, { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { loadingAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDevice } from '@/hooks/useDevice';

export default function LoginView() {
    const loading = useAtomValue(loadingAtom);
    const { login, register } = useActions();
    const { isMobile } = useDevice();

    const [inputs, setInputs] = useState({ nick: '', pass: '', code: '' });
    const [authMode, setAuthMode] = useState('login');
    const handleInput = useCallback((e) => setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })), []);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 grid-pattern overflow-hidden"
             style={{ backgroundColor: 'var(--background)' }}>
            <div className="scanline"></div>
            <div className={`relative z-10 w-full ${isMobile ? 'max-w-sm px-6' : 'max-w-md px-8'} flex flex-col gap-8`}>
                {/* Logo Section */}
                <div className="text-center">
                    <div className="terminal-window inline-block px-6 py-5 mb-4">
                        <div className="terminal-header mb-4">
                            <span className="tech-label">AUTHENTICATION</span>
                            <div className="terminal-controls">
                                <div className="terminal-dot"></div>
                            </div>
                        </div>
                        <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-mono tracking-widest uppercase`} style={{ color: 'var(--foreground)' }}>
                            ORB <span className="opacity-50">NETWORK</span>
                        </h1>
                    </div>
                    <p className="text-[8px] uppercase tracking-[0.3em]" style={{ color: 'var(--foreground-dim)' }}>Secure Access Terminal</p>
                </div>

                {/* Form Section */}
                <div className="terminal-window p-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Node Identifier</label>
                            <input 
                                name="nick" 
                                value={inputs.nick} 
                                onChange={handleInput} 
                                placeholder="ENTER NICKNAME" 
                                className="terminal-input w-full" 
                            />
                        </div>
                        {authMode === 'invite' && (
                            <div className="flex flex-col gap-1">
                                <label className="text-[7px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Access Key</label>
                                <input 
                                    name="code" 
                                    value={inputs.code} 
                                    onChange={handleInput} 
                                    placeholder="ENTER INVITE CODE" 
                                    className="terminal-input w-full" 
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <label className="text-[7px] uppercase tracking-widest" style={{ color: 'var(--foreground-dim)' }}>Password</label>
                            <input 
                                name="pass" 
                                type="password" 
                                value={inputs.pass} 
                                onChange={handleInput} 
                                placeholder="ENTER PASSWORD" 
                                className="terminal-input w-full" 
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <button 
                            onClick={() => setAuthMode(authMode === 'login' ? 'invite' : 'login')} 
                            className="text-[8px] uppercase tracking-widest transition-colors"
                            style={{ color: 'var(--foreground-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            {authMode === 'login' ? '[ REQUEST KEY ]' : '[ EXISTING NODE ]'}
                        </button>
                        <button 
                            onClick={() => authMode === 'login' ? login(inputs.nick, inputs.pass) : register(inputs.nick, inputs.pass, inputs.code)} 
                            className="px-5 py-2 text-[8px] font-mono uppercase tracking-widest press-effect transition-colors"
                            style={{
                                backgroundColor: loading ? 'var(--foreground-dim)' : 'var(--accent)',
                                color: 'var(--accent-text)',
                                opacity: loading ? 0.7 : 1
                            }}
                            disabled={loading}
                        >
                            {loading ? '...' : 'AUTHENTICATE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
