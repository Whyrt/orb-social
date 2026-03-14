import "./globals.css";

export const metadata = {
  title: "ORB NETWORK",
  description: "NOT-SOCIAL NET",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Inline script to set theme before hydration (prevents flash of unstyled content)
// This runs BEFORE React hydrates, ensuring server/client match
const themeScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('orb_theme');
      var theme = savedTheme && ['dark', 'light', 'system'].includes(savedTheme) ? savedTheme : 'dark';
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      // Fallback to dark theme if localStorage unavailable
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
