'use client'

import { useState, useEffect } from 'react'
import {
  Rocket,
  Bot,
  Database,
  MessageSquare,
  Code2,
  Palette,
  Menu,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function DocsSidebar() {
  const { t } = useI18n()
  const [activeId, setActiveId] = useState('getting-started')
  const [sheetOpen, setSheetOpen] = useState(false)

  const sidebarItems = [
    { id: 'getting-started', label: t.docs.sidebar.gettingStarted, icon: Rocket },
    { id: 'bot-management', label: t.docs.sidebar.botManagement, icon: Bot },
    { id: 'knowledge-base', label: t.docs.sidebar.knowledgeBase, icon: Database },
    { id: 'chat-widget', label: t.docs.sidebar.chatWidget, icon: MessageSquare },
    { id: 'api-reference', label: t.docs.sidebar.apiReference, icon: Code2 },
    { id: 'customization', label: t.docs.sidebar.customization, icon: Palette },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    )

    for (const item of sidebarItems) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setSheetOpen(false)
  }

  const navItems = sidebarItems.map((item) => {
    const Icon = item.icon
    const isActive = activeId === item.id
    return (
      <button
        key={item.id}
        onClick={() => handleClick(item.id)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </button>
    )
  })

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:block sticky top-24 space-y-1">
        {navItems}
      </nav>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700" aria-label={t.docs.mobileNav}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">{t.docs.mobileNav}</SheetTitle>
            <nav className="mt-6 space-y-1">
              {navItems}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
