import { useState, useEffect } from 'react';

export function useDevice() {
    const [device, setDevice] = useState({
        isMobile: true,
        isDesktop: false,
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isMobile = width < 768;
            
            setDevice({
                isMobile,
                isDesktop: !isMobile,
                width,
                height,
            });
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return device;
}
