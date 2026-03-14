import { useState, useEffect, useMemo } from 'react';

/**
 * Safely reads Zustand state only after the component is mounted on the client.
 * Fixes SSR/CSR mismatch and "getServerSnapshot" errors.
 * @param {Function} storeHook - Zustand hook (e.g., useUserStore)
 * @returns {Object} Full store state (or null during SSR)
 */
export function useStoreHydration(storeHook) {
    const [isHydrated, setIsHydrated] = useState(false);

    // Mark component as hydrated after mount
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Memoize the store result, return null during SSR/hydration
    const storeState = useMemo(() => storeHook(), [storeHook]);

    // Return null during SSR (or on first render before hydration)
    if (!isHydrated) {
        return null;
    }

    // After hydration, return the memoized store state
    return storeState;
}