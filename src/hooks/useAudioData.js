import { useRef, useState, useEffect } from 'react';

// Глобальные переменные для AudioContext
let globalAudioContext = null;
let globalAnalyser = null;
const audioSourceCache = new WeakMap();

function useAudioData(audioRef, isPlaying) {
    const [data, setData] = useState(new Uint8Array(128).fill(0));
    const frameRef = useRef(null);
    const isConnectedRef = useRef(false);

    useEffect(() => {
        if (!audioRef.current) return;

        // Инициализируем AudioContext один раз
        if (!globalAudioContext) {
            globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const context = globalAudioContext;

        // Разблокировка аудио для мобильных/Safari
        const resume = () => {
            if (context.state === 'suspended') {
                context.resume().catch(() => {});
            }
        };
        
        window.addEventListener('click', resume, { once: true, capture: true });
        window.addEventListener('touchstart', resume, { once: true, capture: true });

        // Создаём анализатор один раз
        if (!globalAnalyser) {
            globalAnalyser = context.createAnalyser();
            globalAnalyser.fftSize = 256;
        }

        const analyser = globalAnalyser;

        // Кэшируем SourceNode для конкретного элемента <audio>
        let sourceNode;
        if (audioSourceCache.has(audioRef.current)) {
            sourceNode = audioSourceCache.get(audioRef.current);
        } else {
            try {
                sourceNode = context.createMediaElementSource(audioRef.current);
                audioSourceCache.set(audioRef.current, sourceNode);
            } catch (e) {
                // Audio connection skipped
                return;
            }
        }

        // Подключаем только один раз
        if (!isConnectedRef.current) {
            sourceNode.connect(analyser);
            analyser.connect(context.destination);
            isConnectedRef.current = true;
        }

        // Цикл обновления данных
        const freqData = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
            if (isPlaying) {
                analyser.getByteFrequencyData(freqData);
                setData(new Uint8Array(freqData));
            } else {
                // Возвращаем к нулю когда пауза
                setData(new Uint8Array(128).fill(0));
            }
            frameRef.current = requestAnimationFrame(update);
        };

        update();

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            // НЕ отключаем узлы - они переиспользуются
        };
    }, [audioRef, isPlaying]);

    // Глобальная очистка при размонтировании приложения
    useEffect(() => {
        return () => {
            // Очищаем только при полном размонтировании
            if (globalAudioContext && globalAudioContext.state !== 'closed') {
                globalAudioContext.close().catch(() => {});
                globalAudioContext = null;
                globalAnalyser = null;
            }
        };
    }, []);

    return data;
}

export default useAudioData;
