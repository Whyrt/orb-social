import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom, friendsAtom, chatsAtom, activeChatAtom, hiddenMessagesAtom, hasMoreMessagesAtom, chatPageAtom } from '@/atoms';
import { useActions } from '@/lib/actions';
import { useDrag } from '@use-gesture/react';

import MediaViewer from '../components/ui/MediaViewer.js';
import ActionSheet from '../components/ui/ActionSheet.js';
import MessageItem from '../components/chat/MessageItem.js';

export default function ChatView() {
    const user = useAtomValue(userAtom);
    const friends = useAtomValue(friendsAtom);
    const chats = useAtomValue(chatsAtom);
    const activeChat = useAtomValue(activeChatAtom);
    const hiddenMessages = useAtomValue(hiddenMessagesAtom);
    const hasMoreMessages = useAtomValue(hasMoreMessagesAtom);
    const chatPage = useAtomValue(chatPageAtom);

    const {
        setActiveChat, sendMsg, sendMedia, deleteMessage, clearChat, loadChatHistory,
        setGlobalPlayerState, showToast, setView
    } = useActions();

    const [msgText, setMsgText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [streamRef, setStreamRef] = useState(null);
    const [viewingMedia, setViewingMedia] = useState(null);
    const [actionMenu, setActionMenu] = useState({ isOpen: false, type: null, data: null, actions: [] });
    const [highlightedMsg, setHighlightedMsg] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isLoadingMoreRef = useRef(false);

    const messagesEndRef = useRef(null);
    const messagesStartRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageRefs = useRef({});
    const chatContainerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    const currentMessages = useMemo(() => {
        if (!activeChat || !chats) return [];
        const targetRoom = activeChat === 'global' ? 'global' : [user, activeChat].sort().join('_');
        return chats
            .filter(m => m.room === targetRoom && !hiddenMessages.includes(m.id))
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, [chats, activeChat, user, hiddenMessages]);

    useEffect(() => {
        if (activeChat && !isLoadingMore) {
            const timer = setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [activeChat, isLoadingMore]);

    const handleScroll = useCallback(() => {
        const container = chatContainerRef.current;
        if (!container || isLoadingMore || !hasMoreMessages) return;

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const scrollTop = container.scrollTop;
            if (scrollTop < 50 && !isLoadingMoreRef.current) {
                isLoadingMoreRef.current = true;
                setIsLoadingMore(true);

                const previousScrollHeight = container.scrollHeight;
                const previousScrollTop = container.scrollTop;

                loadChatHistory(user, activeChat, chatPage + 1).then(() => {
                    requestAnimationFrame(() => {
                        const newScrollHeight = container.scrollHeight;
                        const heightDiff = newScrollHeight - previousScrollHeight;
                        container.scrollTop = heightDiff;
                        setIsLoadingMore(false);
                        isLoadingMoreRef.current = false;
                    });
                });
            }
        }, 100);
    }, [isLoadingMore, hasMoreMessages, chatPage, user, activeChat, loadChatHistory]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => {
                container.removeEventListener('scroll', handleScroll);
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }
    }, [handleScroll]);

    const bindListSwipes = useDrag(({ movement: [mx], direction: [xDir], last, cancel }) => {
        if (activeChat || !last) return;
        if (xDir > 0 && mx > 70) {
             setView('menu');
             cancel();
        }
    }, { axis: 'x', filterTaps: true });

    const startRecording = async (e) => {
        if (e) e.preventDefault();
        if (!navigator.mediaDevices) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 44100
                }
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                             ? 'audio/webm;codecs=opus'
                             : 'audio/mp4';

            const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
            const chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());
                if (blob.size > 2000) sendMedia(activeChat, blob, 'audio');
            };

            recorder.start();
            setMediaRecorder(recorder);
            setStreamRef(stream);
            setIsRecording(true);
            if (window.navigator.vibrate) window.navigator.vibrate(40);
        } catch (e) {
            // Recording error
        }
    };

    const stopRecording = (e) => {
        if (e) e.preventDefault();
        setIsRecording(false);
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setMediaRecorder(null);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('audio/') ? 'audio' : null);
        if (!type) return showToast('Format not supported', 'error');
        sendMedia(activeChat, file, type);
    };

    const scrollToMessage = (msgId) => {
        const msgElement = messageRefs.current[msgId];
        if (msgElement) {
            msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMsg(msgId);
            setTimeout(() => setHighlightedMsg(null), 1000);
        }
    };

    const openMessageActions = (msg, forceMenu = false) => {
        if (msg.type === 'audio' && !forceMenu) {
            setGlobalPlayerState({
                isPlaying: true,
                src: msg.media_url,
                title: 'VOICE NODE',
                artist: `@${msg.sender}`,
                isMusicNode: false
            });
            return;
        }
        if (msg.type === 'image' && !forceMenu) {
            setViewingMedia({ url: msg.media_url });
            return;
        }
        if (forceMenu || msg.type === 'text') {
            setActionMenu({
                isOpen: true,
                type: 'message',
                data: msg,
                actions: [
                    { label: 'REPLY', onClick: () => { setReplyTo(msg); setMsgText(''); } },
                    { label: 'COPY TEXT', onClick: () => { if (msg.text) { navigator.clipboard.writeText(msg.text); showToast('COPIED'); } } },
                    { label: 'DELETE FOR ME', danger: true, onClick: () => deleteMessage(msg.id || msg.tempId, false) },
                    { label: 'DELETE FOR ALL', danger: true, onClick: () => deleteMessage(msg.id || msg.tempId, true) }
                ]
            });
        }
    };

    const openChatClearActions = (target) => {
        setActionMenu({
            isOpen: true,
            type: 'clear',
            data: target,
            actions: [
                { label: 'Clear for me', onClick: () => clearChat(target, false), danger: true },
                { label: 'Clear for both', onClick: () => clearChat(target, true), danger: true }
            ]
        });
    };

    const handleSendMsg = () => {
        sendMsg(activeChat, msgText, replyTo);
        setMsgText('');
        setReplyTo(null);
    }

    return (
        <div className="absolute inset-0 z-20 flex flex-col h-[100dvh] overflow-hidden grid-pattern"
             style={{ backgroundColor: 'var(--background)' }}>
            {!activeChat ? (
                /* CHAT LIST VIEW */
                <div {...bindListSwipes()} className="flex flex-col h-full pt-14 px-4 pb-24 overflow-hidden animate-block">
                    <div className="terminal-header mb-6" style={{ borderRadius: '16px 16px 0 0' }}>
                        <span className="tech-label">COMMUNICATION LINKS</span>
                        <div className="terminal-controls">
                            <div className="terminal-dot"></div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-8">
                        {/* Global Channel */}
                        <div onClick={() => setActiveChat('global')}
                            className="group flex items-center justify-between p-4 card transition-all cursor-pointer"
                            style={{ backgroundColor: 'var(--background-elevated)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                                     style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}>
                                    🌐
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Global Node</h3>
                                    <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--foreground-dim)' }}>Public Channel</p>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2" style={{ color: 'var(--foreground-muted)' }}>→</div>
                        </div>

                        {/* Section Header */}
                        <p className="text-[8px] font-semibold uppercase tracking-wider ml-2 mt-2 mb-2" style={{ color: 'var(--foreground-dim)' }}>Private Links</p>

                        {/* Empty State */}
                        {friends.length === 0 && (
                            <p className="text-[9px] ml-2 italic" style={{ color: 'var(--foreground-dim)' }}>No active links.</p>
                        )}

                        {/* Friends List */}
                        {friends.map((f, i) => (
                            <div key={f}
                                onClick={() => setActiveChat(f)}
                                className="flex items-center justify-between p-4 card transition-all cursor-pointer animate-block"
                                style={{
                                    backgroundColor: 'var(--background-elevated)',
                                    animationDelay: `${i * 0.05}s`
                                }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm"
                                         style={{ 
                                             backgroundColor: 'var(--accent)', 
                                             color: 'var(--accent-text)' 
                                         }}>
                                        {f[0].toUpperCase()}
                                    </div>
                                    <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>@{f}</h3>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full"
                                     style={{
                                         backgroundColor: 'var(--success)',
                                         opacity: 0.6
                                     }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ACTIVE CHAT VIEW */
                <div className="flex flex-col h-full relative" style={{ backgroundColor: 'var(--background)' }}>
                    {/* Chat Header */}
                    <div className="pt-12 pb-4 px-4 flex items-center justify-between z-[2100]"
                         style={{
                             borderBottom: '1px solid var(--border-color)',
                             backgroundColor: 'var(--background-elevated)',
                             backdropFilter: 'blur(20px)'
                         }}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setActiveChat(null); setReplyTo(null); }}
                                className="w-10 h-10 card flex items-center justify-center press-effect"
                                style={{ color: 'var(--foreground-muted)' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm"
                                     style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                                    {activeChat[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>@{activeChat}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                                        <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => openChatClearActions(activeChat)}
                            className="w-10 h-10 card flex items-center justify-center press-effect"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar pb-44"
                        style={{ touchAction: 'pan-y' }}
                    >
                        {/* Loading Indicator */}
                        {isLoadingMore && (
                            <div className="flex justify-center py-2">
                                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                                     style={{
                                         borderColor: 'var(--border-color)',
                                         borderTopColor: 'var(--accent)'
                                     }}></div>
                            </div>
                        )}

                        {/* End of History */}
                        {!hasMoreMessages && currentMessages.length > 0 && (
                            <div className="text-center py-3">
                                <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--foreground-dim)' }}>End of history</p>
                            </div>
                        )}

                        <div ref={messagesStartRef} />

                        {currentMessages.map((m) => (
                            <MessageItem
                                key={m.id || m.tempId}
                                m={m}
                                user={user}
                                allMessages={chats}
                                messageRefs={messageRefs}
                                onReply={setReplyTo}
                                onMediaView={setViewingMedia}
                                scrollToMessage={scrollToMessage}
                                onActionRequest={openMessageActions}
                                highlightedMsg={highlightedMsg}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Preview */}
                    {replyTo && (
                        <div className="flex justify-between items-center card p-3 mx-4 mb-2 animate-block">
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[8px] uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                                    Replying to @{replyTo.sender}
                                </span>
                                <span className="text-[9px] truncate max-w-[200px]" style={{ color: 'var(--foreground-muted)' }}>{replyTo.text || 'Media node'}</span>
                            </div>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center press-effect"
                                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--foreground-muted)' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Message Input */}
                    <div className="absolute bottom-24 left-0 w-full px-4 flex flex-col z-50">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 flex items-center px-4 py-3 gap-2 min-h-[50px] transition-all card"
                                 style={{
                                     backgroundColor: 'var(--background-elevated)',
                                     backdropFilter: 'blur(20px)',
                                     borderRadius: '16px'
                                 }}>
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="p-1 transition-colors press-effect"
                                    style={{ color: 'var(--foreground-muted)' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                    </svg>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,audio/*" />

                                <input
                                    value={msgText}
                                    onChange={e => setMsgText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && msgText.trim().length > 0 && handleSendMsg()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent text-sm outline-none py-1"
                                    style={{
                                        color: 'var(--foreground)',
                                        '::placeholder': { color: 'var(--foreground-dim)' }
                                    }}
                                />
                            </div>

                            <button
                                onMouseDown={msgText.trim().length === 0 ? startRecording : null}
                                onMouseUp={msgText.trim().length === 0 ? stopRecording : null}
                                onTouchStart={msgText.trim().length === 0 ? startRecording : null}
                                onTouchEnd={msgText.trim().length === 0 ? stopRecording : null}
                                onClick={msgText.trim().length > 0 ? handleSendMsg : null}
                                className="w-[50px] h-[50px] rounded-xl flex items-center justify-center transition-all press-effect"
                                style={{
                                    backgroundColor: isRecording ? 'var(--accent)' : 'var(--accent)',
                                    color: 'var(--accent-text)',
                                    boxShadow: isRecording ? '0 4px 16px rgba(163, 255, 0, 0.4)' : 'none'
                                }}
                            >
                                {msgText.trim().length > 0 ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MediaViewer media={viewingMedia} onClose={() => setViewingMedia(null)} />
            <ActionSheet
                isOpen={actionMenu.isOpen}
                onClose={() => setActionMenu({ ...actionMenu, isOpen: false })}
                actions={actionMenu.actions || []}
                title={actionMenu.type === 'message' ? 'MESSAGE OPTIONS' : 'CLEAR HISTORY'}
            />
        </div>
    );
}
