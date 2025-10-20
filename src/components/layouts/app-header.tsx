'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Home, LayoutDashboard, Activity } from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-24 items-center justify-between px-8">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/whalelogo.png"
            alt="ChainWhale Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
          <span className="text-3xl font-bold">ChainWhale</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Button
            variant={pathname === '/' ? 'default' : 'ghost'}
            size="lg"
            asChild
          >
            <Link href="/" className="flex items-center gap-2 text-base">
              <Home className="h-5 w-5" />
              Home
            </Link>
          </Button>
          <Button
            variant={pathname === '/dashboard' ? 'default' : 'ghost'}
            size="lg"
            asChild
          >
            <Link href="/dashboard" className="flex items-center gap-2 text-base">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant={pathname === '/whales' ? 'default' : 'ghost'}
            size="lg"
            asChild
          >
            <Link href="/whales" className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Whale Tracker
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation + Theme Toggle */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant={pathname === '/' ? 'default' : 'ghost'}
              size="icon"
              asChild
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant={pathname === '/dashboard' ? 'default' : 'ghost'}
              size="icon"
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant={pathname === '/whales' ? 'default' : 'ghost'}
              size="icon"
              asChild
            >
              <Link href="/whales">
                <Activity className="h-5 w-5" />
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
