'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Home, LayoutDashboard, Activity } from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold">🐋 ChainWhale</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant={pathname === '/' ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button
            variant={pathname === '/dashboard' ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant={pathname === '/whales' ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link href="/whales" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Whale Tracker
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation + Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-1">
            <Button
              variant={pathname === '/' ? 'default' : 'ghost'}
              size="icon"
              asChild
            >
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant={pathname === '/dashboard' ? 'default' : 'ghost'}
              size="icon"
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant={pathname === '/whales' ? 'default' : 'ghost'}
              size="icon"
              asChild
            >
              <Link href="/whales">
                <Activity className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
