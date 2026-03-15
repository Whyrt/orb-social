import { useSetAtom, useAtomValue } from 'jotai';
import { supabase } from './supabase';

import {
    userAtom, userStatsAtom, friendsAtom, loadingAtom,
    viewAtom, toastsAtom, activeChatAtom, globalPlayerAtom, chatsAtom,
    signalStakeAtom, signalMultiplierAtom, signalCrashPointAtom, signalStateAtom, signalCashoutAmountAtom, signalCurrentBetAtom,
    hiddenMessagesAtom, isInitializingAtom, connectionStatusAtom, loadAttemptsAtom,
    chatPageAtom, hasMoreMessagesAtom, lastActionTimeAtom
} from '@/atoms';

// Constants for debounce (in milliseconds)
const DEBOUNCE_DELAYS = {
    sendMsg: 300,
    addFriend: 1000,
    buyInvite: 2000,
    signalStart: 500,
};

// Maximum load attempts
const MAX_LOAD_ATTEMPTS = 5;

// Simple UUID-like ID generator for client-side use
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function useActions() {
    const setUser = useSetAtom(userAtom);
    const setStats = useSetAtom(userStatsAtom);
    const setFriends = useSetAtom(friendsAtom);
    const setLoading = useSetAtom(loadingAtom);
    const setView = useSetAtom(viewAtom);
    const setToasts = useSetAtom(toastsAtom);
    const setActiveChat = useSetAtom(activeChatAtom);
    const setGlobalPlayer = useSetAtom(globalPlayerAtom);
    const setChats = useSetAtom(chatsAtom);
    const setHiddenMessages = useSetAtom(hiddenMessagesAtom);
    const setIsInitializing = useSetAtom(isInitializingAtom);
    const setConnectionStatus = useSetAtom(connectionStatusAtom);
    const setLoadAttempts = useSetAtom(loadAttemptsAtom);
    const setChatPage = useSetAtom(chatPageAtom);
    const setHasMoreMessages = useSetAtom(hasMoreMessagesAtom);
    const setLastActionTime = useSetAtom(lastActionTimeAtom);

    const setSignalStake = useSetAtom(signalStakeAtom);
    const setSignalState = useSetAtom(signalStateAtom);
    const setSignalMultiplier = useSetAtom(signalMultiplierAtom);
    const setSignalCrashPoint = useSetAtom(signalCrashPointAtom);
    const setSignalCashoutAmount = useSetAtom(signalCashoutAmountAtom);
    const setSignalCurrentBet = useSetAtom(signalCurrentBetAtom);

    const user = useAtomValue(userAtom);
    const stats = useAtomValue(userStatsAtom);
    const loading = useAtomValue(loadingAtom);
    const activeChat = useAtomValue(activeChatAtom);
    const signalCurrentBet = useAtomValue(signalCurrentBetAtom);
    const signalState = useAtomValue(signalStateAtom);
    const signalMultiplier = useAtomValue(signalMultiplierAtom);
    const signalCashoutAmount = useAtomValue(signalCashoutAmountAtom);
    const chats = useAtomValue(chatsAtom);
    const isInitializing = useAtomValue(isInitializingAtom);
    const connectionStatus = useAtomValue(connectionStatusAtom);
    const lastActionTime = useAtomValue(lastActionTimeAtom);

    // === UTILS ===
    const showToast = (text, type = 'success') => {
        const id = generateId();
        setToasts(prev => [...prev, { id, text, type }]);
        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(10);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const setGlobalPlayerState = (update) => setGlobalPlayer(prev => ({ ...prev, ...update }));

    // === DEBOUNCE CHECK ===
    const canPerformAction = (actionName) => {
        const now = Date.now();
        const lastTime = lastActionTime[actionName] || 0;
        const minDelay = DEBOUNCE_DELAYS[actionName] || 500;
        
        if (now - lastTime < minDelay) {
            return false;
        }
        setLastActionTime(prev => ({ ...prev, [actionName]: now }));
        return true;
    };

    // === USER DATA LOADING WITH ERROR HANDLING ===
    const loadUserData = async (nickname, attempt = 1) => {
        if (!nickname) return Promise.resolve();

        try {
            setConnectionStatus('connecting');

            // Load from friends_old_backup table for proper chat functionality
            const [memberRes, friendsRes, invitesRes] = await Promise.all([
                supabase.from('members').select('*').eq('nickname', nickname).single(),
                supabase.from('friends_old_backup').select('*').or(`user1_nickname.eq.${nickname},user2_nickname.eq.${nickname}`),
                supabase.from('invites').select('*').eq('generated_by_nickname', nickname).order('created_at', { ascending: false })
            ]);

            // Проверка на ошибки
            if (memberRes.error) {
                throw new Error(`Failed to load user data: ${memberRes.error.message}`);
            }

            if (memberRes.data) {
                setStats(prev => ({
                    ...prev,
                    balance: memberRes.data.balance,
                    code: memberRes.data.friend_code,
                    badges: memberRes.data.badges || []
                }));
            }

            // Load friends from old backup table - extract the other user's nickname
            if (friendsRes.data) {
                const friendsList = friendsRes.data.map(f =>
                    f.user1_nickname === nickname ? f.user2_nickname : f.user1_nickname
                );
                setFriends(friendsList);
            }

            if (invitesRes.data) {
                setStats(prev => ({ ...prev, invites: invitesRes.data }));
            }

            setConnectionStatus('connected');
            setLoadAttempts(0); // Сброс счётчика ошибок

        } catch (error) {
            if (attempt < MAX_LOAD_ATTEMPTS) {
                // Экспоненциальная задержка перед повторной попыткой
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                setLoadAttempts(attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
                return loadUserData(nickname, attempt + 1);
            } else {
                setConnectionStatus('error');
                showToast('Connection failed. Please refresh.', 'error');
            }
        }
    };

    const updateBalance = async (newBalance) => {
        if (!user) return;
        const { error } = await supabase.from('members').update({ balance: newBalance }).eq('nickname', user);
        if (!error) {
            setStats(prev => ({ ...prev, balance: newBalance }));
        }
        return !error;
    };

    // === SESSION MANAGEMENT WITH ASYNC ===
    const checkSession = async () => {
        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
            setIsInitializing(true);
            setUser(savedUser);
            try {
                await loadUserData(savedUser);
            } catch (error) {
                console.error('Session check failed:', error);
                // При ошибке загрузки данных - очищаем сессию
                localStorage.removeItem('app_user');
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        } else {
            // Если нет сохранённого пользователя - сразу завершаем инициализацию
            setIsInitializing(false);
        }
    };

    const login = async (nick, pass) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('members').select('*').eq('nickname', nick).eq('password', pass).single();
            
            if (error || !data) {
                showToast('Access Denied', 'error');
                setLoading(false);
                return;
            }

            localStorage.setItem('app_user', nick);
            setUser(nick);
            await loadUserData(nick);
            showToast(`Welcome, ${nick}`);
            setView('menu');
        } catch (error) {
            showToast('Network error', 'error');
        }
        setLoading(false);
    };

    const register = async (nick, pass, code) => {
        setLoading(true);
        try {
            // Validate inputs
            if (!nick || !pass || !code) {
                showToast('All fields required', 'error');
                return;
            }

            if (nick.length < 3) {
                showToast('Nickname too short (min 3 chars)', 'error');
                return;
            }

            if (pass.length < 4) {
                showToast('Password too short (min 4 chars)', 'error');
                return;
            }

            const { data: inv, error: inviteError } = await supabase.from('invites')
                .select('*')
                .eq('code', code.trim().toUpperCase())
                .eq('is_used', false)
                .single();

            if (inviteError || !inv) {
                showToast('Invalid Key', 'error');
                return;
            }

            const { error: insertError } = await supabase.from('members').insert([{
                nickname: nick,
                password: pass,
                balance: 100
            }]);

            if (insertError) {
                showToast('Nickname taken', 'error');
                return;
            }

            await supabase.from('invites').update({
                is_used: true,
                used_by_nickname: nick
            }).eq('code', code);

            if (inv.generated_by_nickname) {
                await supabase.from('friends_old_backup').insert([{
                    user1_nickname: nick,
                    user2_nickname: inv.generated_by_nickname
                }]);
            }

            localStorage.setItem('app_user', nick);
            setUser(nick);
            await loadUserData(nick);
            showToast('Node Created');
            setView('menu');
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    // === LOGOUT WITH FULL STATE CLEANUP ===
    const logout = () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(30);
        localStorage.removeItem('app_user');
        
        // Полная очистка всех состояний
        setUser(null);
        setFriends([]);
        setStats({ balance: 0, code: null, invites: [], badges: [] });
        setChats([]);
        setHiddenMessages([]);
        setToasts([]);
        setActiveChat(null);
        setView('menu');
        setChatPage(0);
        setHasMoreMessages(true);
        setSignalState('idle');
        setSignalMultiplier(1.00);
        setSignalCrashPoint(null);
        setSignalCashoutAmount(0);
        setSignalCurrentBet(null);
        setGlobalPlayer({
            isPlaying: false,
            src: null,
            title: 'Unknown Node',
            artist: 'System',
            isMusicNode: true,
            sourceKey: 0,
        });
    };

    const genCode = async () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase.from('members').update({ friend_code: newCode }).eq('nickname', user);
        if (!error) { 
            setStats(prev => ({ ...prev, code: newCode })); 
            showToast('Code updated'); 
        }
    };

    // === FRIENDS WITH DEBOUNCE - Using friends_old_backup table ===
    const addFriend = async (code) => {
        if (!canPerformAction('addFriend')) {
            showToast('Please wait...', 'error');
            return;
        }

        try {
            // Find target user by friend code
            const { data: target, error: fetchError } = await supabase.from('members')
                .select('nickname')
                .eq('friend_code', code)
                .single();

            if (fetchError || !target || target.nickname === user) {
                showToast('Code not found', 'error');
                return;
            }

            // Check if already friends (prevent duplicates)
            const { data: existing } = await supabase.from('friends_old_backup')
                .select('*')
                .or(`and(user1_nickname.eq.${user},user2_nickname.eq.${target.nickname}),and(user1_nickname.eq.${target.nickname},user2_nickname.eq.${user})`)
                .single();

            if (existing) {
                showToast('Already connected', 'error');
                return;
            }

            // Insert into friends_old_backup table
            const { error: insertError } = await supabase.from('friends_old_backup').insert([{
                user1_nickname: user,
                user2_nickname: target.nickname
            }]);

            if (insertError) {
                showToast('Failed to add friend', 'error');
            } else {
                await loadUserData(user);
                showToast('Friend added!');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    };

    const removeFriend = async (target) => {
        // Delete from friends_old_backup table
        await supabase.from('friends_old_backup').delete().or(
            `and(user1_nickname.eq.${user},user2_nickname.eq.${target}),and(user1_nickname.eq.${target},user2_nickname.eq.${user})`
        );
        await loadUserData(user);
    };

    const buyInvite = async () => {
        if (!canPerformAction('buyInvite')) {
            showToast('Please wait...', 'error');
            return;
        }

        if (stats.balance < 100) {
            showToast('Insufficient ORB', 'error');
            return;
        }

        const newCode = 'ORB-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const success = await updateBalance(stats.balance - 100);
        
        if (success) {
            await supabase.from('invites').insert([{ code: newCode, generated_by_nickname: user }]);
            await loadUserData(user);
            showToast('Key created');
        }
    };

    // === CHAT WITH PAGINATION AND OPTIMISTIC UPDATES ===
    const loadChatHistory = async (targetUser, targetChat, page = 0) => {
        if (!targetUser || !targetChat) return;
        
        const room = targetChat === 'global' ? 'global' : [targetUser, targetChat].sort().join('_');
        const limit = 50;
        const offset = page * limit;

        try {
            const { data: msgs, error } = await supabase
                .from('messages')
                .select('*')
                .eq('room', room)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                return;
            }

            if (msgs) {
                const sorted = msgs.reverse();
                setChats(prev => {
                    // Фильтруем дубликаты
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMsgs = sorted.filter(m => !existingIds.has(m.id));
                    return page === 0 ? sorted : [...newMsgs, ...prev];
                });

                setHasMoreMessages(msgs.length === limit);
                setChatPage(page);
            }
        } catch (error) {
        }
    };

    const addMessageToChat = (message) => {
        setChats(prev => {
            if (prev.find(m => m.id === message.id)) return prev;
            return [...prev, message];
        });
    };

    const deleteMessage = async (msgId, forAll) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(20);
        
        try {
            if (forAll) {
                await supabase.from('messages').delete().eq('id', msgId);
            } else {
                setHiddenMessages(prev => {
                    if (!prev.includes(msgId)) return [...prev, msgId];
                    return prev;
                });
            }
            setChats(prev => prev.filter(m => m.id !== msgId && m.tempId !== msgId));
            showToast('Node Purged');
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const clearChat = async (target, forBoth) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
        
        const room = target === 'global' ? 'global' : [user, target].sort().join('_');
        
        try {
            if (forBoth) {
                await supabase.from('messages').delete().eq('room', room);
            } else {
                const currentIds = chats.filter(m => m.room === room).map(m => m.id);
                setHiddenMessages(prev => {
                    const newHidden = [...new Set([...prev, ...currentIds])];
                    return newHidden;
                });
            }
            setChats(prev => prev.filter(m => m.room !== room));
            showToast('Channel Cleared');
        } catch (error) {
            showToast('Failed to clear', 'error');
        }
    };

    const deleteChat = async (target, forBoth) => {
        await clearChat(target, forBoth);
        await removeFriend(target);
        setActiveChat(null);
    };

    // === SEND MESSAGE WITH OPTIMISTIC UPDATE ===
    const sendMsg = async (roomTarget, text, replyToMsg, type = 'text', media_url = null) => {
        if (!text.trim() && !media_url) return;

        if (!canPerformAction('sendMsg')) {
            showToast('Please wait...', 'error');
            return;
        }

        const room = roomTarget === 'global' ? 'global' : [user, roomTarget].sort().join('_');
        const tempId = generateId();
        
        // Оптимистичное добавление сообщения
        const optimisticMessage = {
            id: tempId,
            tempId,
            sender: user,
            text,
            room,
            type,
            media_url,
            reply_to: replyToMsg?.id || replyToMsg?.tempId,
            created_at: new Date().toISOString(),
        };

        // Сразу добавляем в UI
        addMessageToChat(optimisticMessage);

        try {
            const { error } = await supabase.from('messages').insert([{
                sender: user,
                text,
                room,
                tempId,
                type,
                media_url,
                reply_to: replyToMsg?.id || replyToMsg?.tempId
            }]);
            
            if (error) {
                // Откат при ошибке
                setChats(prev => prev.filter(m => m.tempId !== tempId));
                showToast('Failed to send', 'error');
            }
        } catch (error) {
            setChats(prev => prev.filter(m => m.tempId !== tempId));
            showToast('Network error', 'error');
        }
    };

    const sendMedia = async (roomTarget, file, type) => {
        const fileName = generateId();
        
        try {
            const { error: upErr } = await supabase.storage.from('chat-media').upload(fileName, file);
            if (upErr) {
                showToast('Upload failed', 'error');
                return;
            }
            
            const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
            sendMsg(roomTarget, type === 'image' ? 'Image' : 'Audio', null, type, publicUrl);
        } catch (error) {
            showToast('Failed to send media', 'error');
        }
    };

    // === GAME LOGIC WITH RACE CONDITION FIX ===
    const generateCrashPoint = () => {
        if (Math.random() < 0.03) {
            return 1.00;
        }

        const r = Math.random() * 0.99;
        const crash = 1 / (1 - r);

        if (Math.random() < 0.01) {
            return 100 + Math.random() * 900;
        }

        return parseFloat(crash.toFixed(2));
    };

    const handleSignalStart = async (amountStr) => {
        if (!canPerformAction('signalStart')) {
            showToast('Please wait...', 'error');
            return;
        }

        const amount = parseInt(amountStr);
        
        if (loading || amount <= 0) {
            return showToast('Invalid Stake', 'error');
        }

        // Проверка баланса ПЕРЕД транзакцией
        if (stats.balance < amount) {
            return showToast('Insufficient ORB', 'error');
        }

        setLoading(true);
        
        try {
            // Сначала списываем баланс
            const success = await updateBalance(stats.balance - amount);
            
            if (!success) {
                setLoading(false);
                showToast('Failed to place bet', 'error');
                return;
            }

            const crashPoint = generateCrashPoint();

            setSignalCrashPoint(crashPoint);
            setSignalCurrentBet({ amount, startTime: Date.now() });
            setSignalMultiplier(1.00);
            setSignalCashoutAmount(0);
            setSignalState('running');
            showToast(`Bet placed: -${amount} ORB. Good luck!`);
        } catch (error) {
            showToast('Failed to start game', 'error');
        }
        setLoading(false);
    };

    const handleSignalCashout = async () => {
        if (signalState !== 'running' || signalCashoutAmount > 0) return;

        const cashoutMult = signalMultiplier;
        const betAmount = signalCurrentBet?.amount;
        
        if (!betAmount) return;
        
        const winAmount = Math.floor(betAmount * cashoutMult);

        setSignalCashoutAmount(winAmount);
        setSignalState('crashed');

        showToast(`Cashed out @${cashoutMult.toFixed(2)}x! +${winAmount} ORB`, 'success');

        setLoading(true);
        
        try {
            await updateBalance(stats.balance + winAmount);
        } catch (error) {
        }

        setLoading(false);

        setTimeout(() => {
            setSignalState('idle');
            setSignalCurrentBet(null);
        }, 3000);
    };

    return {
        setUser, setStats, setFriends, setLoading, setView, setToasts, setActiveChat, setGlobalPlayer, setChats, setHiddenMessages,
        setSignalStake, setSignalState, setSignalMultiplier, setSignalCrashPoint, setSignalCashoutAmount, setSignalCurrentBet,
        setGlobalPlayerState, showToast, setIsInitializing, setConnectionStatus,
        loadUserData, updateBalance, checkSession, login, register, logout,
        genCode, addFriend, removeFriend, buyInvite,
        loadChatHistory, addMessageToChat, deleteMessage, clearChat, deleteChat, sendMsg, sendMedia,
        generateCrashPoint, handleSignalStart, handleSignalCashout,
        isInitializing, connectionStatus, canPerformAction
    };
}
