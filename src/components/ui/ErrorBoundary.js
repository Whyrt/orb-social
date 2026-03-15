"use client"
import React from 'react';

/**
 * Error Boundary Component
 * Ловит ошибки React компонентов и показывает fallback UI
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Здесь можно отправить ошибку в сервис мониторинга
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-95">
                    <div className="terminal-window p-8 max-w-md mx-4" style={{
                        backgroundColor: 'var(--background-elevated)',
                        border: '1px solid var(--error)',
                        borderRadius: '16px'
                    }}>
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                             style={{ backgroundColor: 'var(--error-bg)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                 fill="none" stroke="var(--error)" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>

                        {/* Title */}
                        <h2 className="text-center text-lg font-semibold mb-2" style={{ color: 'var(--error)' }}>
                            Ошибка приложения
                        </h2>

                        {/* Description */}
                        <p className="text-center text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
                            Произошла критическая ошибка. Попробуйте перезагрузить страницу.
                        </p>

                        {/* Error Details (dev mode) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }}>
                                <p className="text-xs font-mono" style={{ color: 'var(--error)' }}>
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Reset Button */}
                        <button
                            onClick={this.handleReset}
                            className="w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider press-effect transition-all"
                            style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-text)'
                            }}
                        >
                            Перезагрузить
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
