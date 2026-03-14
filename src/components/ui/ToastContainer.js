import React from 'react';

function ToastContainer({ toasts }) {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full px-4 items-center">
            {toasts.map((t) => (
                <div 
                    key={t.id} 
                    className="pointer-events-auto px-4 py-2 terminal-border backdrop-blur-md text-[7px] font-mono uppercase tracking-widest animate-fade-in-down"
                    style={{
                        backgroundColor: 'var(--overlay-bg)',
                        borderColor: t.type === 'error' ? 'var(--error)' : 'var(--border-color)',
                        color: t.type === 'error' ? 'var(--error)' : 'var(--foreground)'
                    }}
                >
                    {t.text}
                </div>
            ))}
        </div>
    )
}

export default ToastContainer;
