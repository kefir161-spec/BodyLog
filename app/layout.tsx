import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { Nav } from '@/components/layout/nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'BodyLog — Трекер веса и здоровья',
  description: 'Личный трекинг: вес, питание, дозировки, активность',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'BodyLog' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {/* SVG-фильтр пикселизации (как в https://stackoverflow.com/questions/56449309): ориг. картинка → пикселизация → анимация к чёткости */}
            <svg aria-hidden className="absolute w-0 h-0" focusable="false">
              <defs>
                <filter id="pixelate-hero" x="0" y="0" width="100%" height="100%">
                  <feFlood x="1" y="1" height="1" width="1" />
                  <feComposite id="pixelate-composite" in2="SourceGraphic" operator="in" width="6" height="6" />
                  <feTile result="tiled" />
                  <feComposite in="SourceGraphic" in2="tiled" operator="in" />
                  <feMorphology id="pixelate-morphology" operator="dilate" radius="3" />
                  <animate id="pixelate-anim-w" href="#pixelate-composite" attributeName="width" values="12;7;4" dur="0.7s" fill="freeze" begin="indefinite" />
                  <animate id="pixelate-anim-h" href="#pixelate-composite" attributeName="height" values="12;7;4" dur="0.7s" fill="freeze" begin="indefinite" />
                  <animate id="pixelate-anim-r" href="#pixelate-morphology" attributeName="radius" values="6;3.5;2" dur="0.7s" fill="freeze" begin="indefinite" />
                </filter>
              </defs>
            </svg>
            <div className="flex min-h-screen flex-col">
              <Nav />
              <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-6">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
