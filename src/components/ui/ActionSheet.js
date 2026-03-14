import React from 'react';

function ActionSheet({ isOpen, onClose, actions, title }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] bg-black/90 flex flex-col justify-end" onClick={onClose}>
            <div className="terminal-window rounded-t-none p-3 flex flex-col gap-2 animate-fade-in-up border-t border-white/10" onClick={e => e.stopPropagation()}>
                {title && <h3 className="text-white/40 text-[7px] font-mono uppercase tracking-widest text-center mb-1">{title}</h3>}
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => { action.onClick(); onClose(); }}
                        className={`w-full py-2.5 terminal-border text-[8px] font-mono uppercase tracking-widest press-effect transition-all ${action.danger ? 'text-red-400 hover:bg-red-500/10 hover:border-red-400/50' : 'text-white hover:bg-white hover:text-black'}`}
                    >
                        {action.label}
                    </button>
                ))}
                <button onClick={onClose} className="w-full py-2.5 mt-1 text-white/30 hover:text-white text-[8px] font-mono uppercase tracking-widest">Cancel</button>
            </div>
        </div>
    )
}

export default ActionSheet;
