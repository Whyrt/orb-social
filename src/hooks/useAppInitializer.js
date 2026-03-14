// /src/hooks/useAppInitializer.js
// Refactored with proper cleanup and connection status tracking
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
    
    // Рефы для отслеживания подписок
    const channelRef = useRef(null);
    const loadChatRef = useRef(null);

    // Функция для загрузки чата с отменой предыдущего запроса
    const loadChatWithCancel = useCallback((targetUser, targetChat) => {
        // Отменяем предыдущий запрос если есть
        if (loadChatRef.current) {
            loadChatRef.current.abort();
        }
        
        // Создаём новый AbortController
        const controller = new AbortController();
        loadChatRef.current = controller;
        
        loadChatHistory(targetUser, targetChat, 0);
        
        return () => {
            controller.abort();
        };
    }, [loadChatHistory]);

    // 1. Supabase Realtime с правильной очисткой
    useEffect(() => {
        if (!user) {
            setConnectionStatus('connecting');
            return;
        }

        // Создаём канал
        channelRef.current = supabase.channel('global_updates', {
            config: { broadcast: { self: true }, presence: { key: user } }
        })
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages' 
            }, (payload) => {
                // Проверяем, не дубликат ли это
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
                    setConnectionStatus('connected');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setConnectionStatus('error');
                } else if (status === 'RECONNECTING') {
                    setConnectionStatus('reconnecting');
                }
            });

        // Очистка при размонтировании или изменении user
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user, setConnectionStatus, loadUserData, addMessageToChat]);

    // 2. Загрузка истории чата с правильной зависимостью
    useEffect(() => {
        if (user && activeChat) {
            loadChatWithCancel(user, activeChat);
        }
        
        // Очистка при смене чата
        return () => {
            if (loadChatRef.current) {
                loadChatRef.current.abort();
            }
        };
    }, [user, activeChat, loadChatWithCancel]);

    // 3. Обработка потери соединения
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
