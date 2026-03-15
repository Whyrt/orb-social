import React, { useRef } from 'react';
import { animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

const MessageItem = React.memo(({ m, user, allMessages, messageRefs, onReply, onMediaView, scrollToMessage, onActionRequest, highlightedMsg }) => {
    const isMe = m.sender === user;
    const isHighlighted = highlightedMsg === m.id || highlightedMsg === m.tempId;

    const timerRef = useRef(null);

    const repliedMsg = React.useMemo(() =>
        m.reply_to ? allMessages.find(msg => msg.id === m.reply_to || msg.tempId === m.reply_to) : null
        , [m.reply_to, allMessages]);

    const bind = useDrag(({ last, movement: [mx], active }) => {
        if (mx > 50 && last) {
            onReply(m);
        }
    }, {
        axis: 'x',
        bounds: { left: 0, right: 80 },
        filterTaps: true,
        rubberband: true
    });

    const handleTouchStart = () => {
        timerRef.current = setTimeout(() => {
            onActionRequest(m, true);
            if (window.navigator.vibrate) window.navigator.vibrate(20);
        }, 400);
    };

    const handleTouchEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const setRef = (el) => {
        if (el && m.id) {
            messageRefs.current = { ...messageRefs.current, [m.id]: el };
        }
    };

    return (
        <animated.div
            {...bind()}
            ref={setRef}
            style={{ touchAction: 'pan-y' }}
            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-2 select-none outline-none`}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {repliedMsg && (
                    <div
                        onClick={(e) => { e.stopPropagation(); scrollToMessage(repliedMsg.id || repliedMsg.tempId); }}
                        className="mb-[-4px] px-2 py-1.5 terminal-border border-b-0 rounded-t-sm truncate max-w-[160px] cursor-pointer backdrop-blur-sm"
                        style={{ 
                            backgroundColor: 'var(--input-bg)',
                            color: 'var(--foreground-muted)'
                        }}
                    >
                        <span className="font-mono uppercase text-[6px] block mb-0.5" style={{ color: 'var(--foreground-dim)' }}>
                            @{repliedMsg.sender}
                        </span>
                        {repliedMsg.text || 'Media'}
                    </div>
                )}

                <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    onClick={(e) => {
                        e.stopPropagation();
                        onActionRequest(m, false);
                    }}
                    className={`relative px-3 py-2 shadow-lg transition-all active:scale-98 cursor-pointer z-10 ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'} ${isHighlighted ? 'ring-1 ring-white' : ''}`}
                >
                    {!isMe && (
                        <p className="text-[6px] font-mono uppercase tracking-widest mb-0.5" style={{ color: 'var(--foreground-dim)' }}>
                            @{m.sender}
                        </p>
                    )}

                    {m.type === 'image' && (
                        <div className="terminal-border overflow-hidden mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.media_url} alt="Shared media" className="w-full max-h-[200px] object-cover" />
                        </div>
                    )}

                    {m.type === 'audio' && (
                        <div className="flex items-center gap-2 py-0.5 min-w-[100px]">
                            <div 
                                className="w-7 h-7 terminal-border flex items-center justify-center flex-shrink-0"
                                style={{ 
                                    backgroundColor: isMe ? 'var(--message-me-bg)' : 'var(--message-other-bg)',
                                    color: isMe ? 'var(--message-me-text)' : 'var(--message-other-text)'
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: isMe ? 'var(--message-me-text)' : 'var(--message-other-text)' }}>
                                    Voice
                                </p>
                                <p className="text-[5px] font-mono opacity-50" style={{ color: isMe ? 'var(--message-me-text)' : 'var(--message-other-text)' }}>
                                    TAP
                                </p>
                            </div>
                        </div>
                    )}

                    {m.text && m.text !== 'Изображение' && m.text !== 'Аудио' && (
                        <p className="text-[11px] font-mono leading-relaxed tracking-wide break-words" style={{ color: isMe ? 'var(--message-me-text)' : 'var(--message-other-text)' }}>
                            {m.text}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-0.5 opacity-30">
                        <p className="text-[5px] font-mono uppercase tracking-tighter" style={{ color: isMe ? 'var(--message-me-text)' : 'var(--message-other-text)' }}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>
        </animated.div>
    );
});
MessageItem.displayName = 'MessageItem';

export default MessageItem;
