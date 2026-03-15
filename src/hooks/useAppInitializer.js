// /src/hooks/useAppInitializer.js
import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { supabase } from '../lib/supabase';
import { userAtom, activeChatAtom, connectionStatusAtom } from '@/atoms';
import { useActions } from '@/lib/actions';

export function useAppInitializer() {
    const user = useAtomValue(userAtom);
    const activeChat = useAtomValue(activeChatAtom);
    const setConnectionStatus = useSetAtom(connectionStatusAtom);

    const { loadUserData, loadChatHistory, addMessageToChat } = useActions();

    const channelRef = useRef(null);
    const loadChatRef = useRef(null);
    const realtimeSubscribedRef = useRef(false);

    const loadChatWithCancel = useCallback((targetUser, targetChat) => {
        if (loadChatRef.current) {
            loadChatRef.current.abort();
        }

        const controller = new AbortController();
        loadChatRef.current = controller;

        loadChatHistory(targetUser, targetChat, 0);

        return () => {
            controller.abort();
        };
    }, [loadChatHistory]);

    // Supabase Realtime - подключаем только после успешной загрузки данных
    useEffect(() => {
        if (!user) {
            setConnectionStatus('connecting');
            return;
        }

        // Не подключаем realtime повторно
        if (realtimeSubscribedRef.current) {
            return;
        }

        // Подключаемся с задержкой чтобы не блокировать инициализацию
        const timeoutId = setTimeout(() => {
            channelRef.current = supabase.channel('global_updates', {
                config: { broadcast: { self: true }, presence: { key: user } }
            })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, (payload) => {
                    addMessageToChat(payload.new);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'members'
                }, () => {
                    loadUserData(user);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        realtimeSubscribedRef.current = true;
                        setConnectionStatus('connected');
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        setConnectionStatus('error');
                    } else if (status === 'RECONNECTING') {
                        setConnectionStatus('reconnecting');
                    }
                });
        }, 500); // Задержка 500мс

        return () => {
            clearTimeout(timeoutId);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
                realtimeSubscribedRef.current = false;
            }
        };
    }, [user, setConnectionStatus, loadUserData, addMessageToChat]);

    // Загрузка истории чата
    useEffect(() => {
        if (user && activeChat) {
            loadChatWithCancel(user, activeChat);
        }

        return () => {
            if (loadChatRef.current) {
                loadChatRef.current.abort();
            }
        };
    }, [user, activeChat, loadChatWithCancel]);

    // Обработка потери соединения
    useEffect(() => {
        const handleOnline = () => {
            setConnectionStatus('connecting');
            if (user) {
                loadUserData(user, 1);
            }
        };

        const handleOffline = () => {
            setConnectionStatus('error');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user, setConnectionStatus, loadUserData]);
}
