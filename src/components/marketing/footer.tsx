'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  const footerLinks = [
    {
      title: t.footer.product,
      links: [
        { label: t.nav.features, href: '/#features' },
        { label: t.nav.docs, href: '/docs' },
        { label: t.nav.donate, href: '/donate' },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.about, href: '#' },
        { label: t.footer.blog, href: '#' },
        { label: t.footer.careers, href: '#' },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.privacy, href: '#' },
        { label: t.footer.terms, href: '#' },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-md">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  SmartChat
                </span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
                {t.footer.description}
              </p>
            </div>

            {/* Link columns */}
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SmartChat. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              GitHub
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Discord"
            >
              Discord
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
