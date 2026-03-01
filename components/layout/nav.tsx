'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/today', label: 'Сегодня', icon: LayoutDashboard },
  { href: '/diary', label: 'Дневник', icon: Calendar },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-14 items-center px-4">
          <Link
            href="/today"
            className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            <span className="text-xl">BodyLog</span>
          </Link>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 backdrop-blur-xl sm:relative sm:bottom-auto sm:border-t-0 sm:border-b">
        <div className="container flex h-14 items-center justify-around gap-1 px-2 sm:justify-start sm:gap-6 sm:px-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 sm:flex-row sm:gap-2',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
