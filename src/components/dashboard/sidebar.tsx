'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bot,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { key: 'bots' as const, href: '/dashboard/bots', icon: Bot },
  { key: 'analytics' as const, href: '/dashboard', icon: BarChart3 },
  { key: 'settings' as const, href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const labelMap: Record<string, string> = {
    bots: t.dashboard.bots,
    analytics: t.dashboard.analytics,
    settings: t.dashboard.settings,
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-slate-950 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn("flex h-14 items-center gap-2", collapsed ? "justify-center px-2" : "px-4")}>
        {!collapsed && (
          <>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
              <MessageSquare className="size-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              SmartChat
            </span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            'shrink-0 text-slate-400 hover:text-white hover:bg-slate-800',
            !collapsed && 'ml-auto'
          )}
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <Separator className="bg-slate-800" />

      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const label = labelMap[item.key];

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.key}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-800" />

      <div className="p-3">
        {!collapsed && (
          <div className="rounded-md bg-slate-800/60 px-3 py-2">
            <p className="text-xs text-slate-400">Free Plan</p>
          </div>
        )}
      </div>
    </aside>
  );
}
