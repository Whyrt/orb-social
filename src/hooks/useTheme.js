import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { themeAtom } from '@/atoms';

/**
 * Theme management hook with localStorage persistence
 * Handles dark, light, and system theme modes
 */
export function useTheme() {
    const theme = useAtomValue(themeAtom);
    const setTheme = useSetAtom(themeAtom);

    // Apply theme to document whenever it changes
    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.setAttribute('data-theme', systemTheme);
        } else {
            root.setAttribute('data-theme', theme);
        }

        // Persist to localStorage
        localStorage.setItem('orb_theme', theme);
    }, [theme]);

    // Listen for system theme changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const systemTheme = mediaQuery.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setDarkMode = () => setTheme('dark');
    const setLightMode = () => setTheme('light');
    const setSystemMode = () => setTheme('system');

    return {
        theme,
        setTheme,
        setDarkMode,
        setLightMode,
        setSystemMode,
    };
}
