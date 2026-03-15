"use client"
import React from 'react';
import { useAtomValue } from 'jotai';
import { isInitializingAtom } from '@/atoms';

export default function HydrationProvider({ children }) {
    // Get initialization state from atoms
    const isInitializing = useAtomValue(isInitializingAtom);

    if (!isInitializing) {
        // Minimal loader during session check
        return (
             <div className="fixed inset-0 bg-black flex items-center justify-center">
                 <div className="text-white text-lg font-mono">Initializing Node...</div>
             </div>
        );
    }

    // Once store is stabilized, render the application
    return <>{children}</>;
}