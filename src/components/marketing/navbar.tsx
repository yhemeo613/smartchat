'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, MessageSquare, Globe, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: t.nav.features, href: '/#features' },
    { label: t.nav.docs, href: '/docs' },
    { label: t.nav.donate, href: '/donate' },
  ];

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-md group-hover:shadow-lg transition-shadow">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            SmartChat
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          {!loading && (user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-3.5" />
                    {t.nav.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="size-3.5" />
                  {locale === 'en' ? 'Sign Out' : '退出登录'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t.nav.signIn}</Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-md hover:shadow-lg transition-all"
                asChild
              >
                <Link href="/signup">{t.nav.getStarted}</Link>
              </Button>
            </>
          ))}
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
          </button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-6 pt-8">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 text-base font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-3 px-4">
                  {!loading && (user ? (
                    <>
                      <div className="flex items-center gap-3 px-1 py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white" asChild>
                        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>{t.nav.dashboard}</Link>
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => { setMobileOpen(false); handleSignOut(); }}>
                        <LogOut className="size-3.5" />
                        {locale === 'en' ? 'Sign Out' : '退出登录'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/login">{t.nav.signIn}</Link>
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white" asChild>
                        <Link href="/signup">{t.nav.getStarted}</Link>
                      </Button>
                    </>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
