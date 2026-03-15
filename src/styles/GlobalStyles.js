import React from 'react';

const GlobalStyles = () => (
    <style jsx global>{`
        html, body {
            background-color: var(--background);
            color: var(--foreground);
            overflow: hidden;
            overscroll-behavior: none;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Mobile styles */
        @media (max-width: 767px) {
            body {
                font-size: 14px;
            }

            .mobile-full-height {
                height: 100dvh;
                height: -webkit-fill-available;
            }

            .mobile-no-scroll {
                overflow: hidden;
                position: fixed;
                width: 100%;
                height: 100dvh;
            }
        }

        /* Desktop styles */
        @media (min-width: 768px) {
            body {
                font-size: 16px;
            }

            .desktop-centered {
                max-width: 480px;
                margin: 0 auto;
                height: 100vh;
                border-left: 1px solid var(--border-color);
                border-right: 1px solid var(--border-color);
            }
        }

        /* Screen transition animation */
        @keyframes softSwitch {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }

        .animate-soft-switch {
            animation: softSwitch 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* Fade in animation */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .animate-fade-in {
            animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-down {
            animation: fadeInDown 0.3s ease forwards;
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease forwards;
        }

        @keyframes blockReveal {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate-block {
            animation: blockReveal 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* Press effect */
        .press-effect:active {
            transform: scale(0.96);
        }

        /* Scrollbar */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        /* Chat bubbles - using CSS variables for theme support */
        .chat-bubble-me {
            background: var(--message-me-bg) !important;
            color: var(--message-me-text) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 2px !important;
        }

        .chat-bubble-other {
            background: var(--message-other-bg) !important;
            color: var(--message-other-text) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 2px !important;
        }

        /* Inputs */
        .input-glass {
            background: var(--input-bg) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid var(--border-color) !important;
        }

        /* Cards */
        .modern-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
        }

        /* Glassmorphism */
        .glass-card {
            background: var(--input-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
        }

        /* Technical line */
        .tech-line {
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border-color), transparent);
        }

        /* Grid pattern */
        .grid-pattern {
            background-image:
                linear-gradient(var(--grid-color) 1px, transparent 1px),
                linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        /* Accent */
        .accent-text {
            color: var(--accent);
        }

        .accent-dim {
            color: var(--foreground-dim);
        }

        /* Monospace text */
        .mono {
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-size: 10px;
            letter-spacing: 0.05em;
        }

        /* Technical label */
        .tech-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--foreground-dim);
        }

        /* Terminal border */
        .terminal-border {
            border: 1px solid var(--border-color);
        }

        /* Pulse animation */
        @keyframes pulse-dot {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        .pulse-dot {
            animation: pulse-dot 2s ease-in-out infinite;
        }

        /* Responsive text sizes */
        @media (max-width: 767px) {
            .text-responsive-sm { font-size: 12px; }
            .text-responsive-base { font-size: 14px; }
            .text-responsive-lg { font-size: 18px; }
            .text-responsive-xl { font-size: 24px; }
            .padding-responsive { padding: 16px; }
        }

        @media (min-width: 768px) {
            .text-responsive-sm { font-size: 14px; }
            .text-responsive-base { font-size: 16px; }
            .text-responsive-lg { font-size: 20px; }
            .text-responsive-xl { font-size: 28px; }
            .padding-responsive { padding: 24px; }
        }
    `}</style>
);

export default GlobalStyles;