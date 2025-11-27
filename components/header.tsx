'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, User, History, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * ヘッダーコンポーネント
 * アプリケーション全体のナビゲーション
 */
export function Header() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'ホーム',
      icon: Home,
    },
    {
      href: '/equipment',
      label: '備品一覧',
      icon: Package,
    },
    {
      href: '/loans/my-loans',
      label: 'マイページ',
      icon: User,
    },
    {
      href: '/loans',
      label: '貸出履歴',
      icon: History,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Package className="size-6" />
            <span className="hidden font-bold sm:inline-block">
              備品管理システム
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.href}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2',
                    isActive && 'font-semibold'
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
