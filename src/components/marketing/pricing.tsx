'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const planKeys = ['free', 'pro', 'enterprise'] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: 'easeOut' },
  }),
};

export function Pricing() {
  const { t } = useI18n();
  const [yearly, setYearly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.pricing.subtitle}
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border bg-background p-1">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-all',
                !yearly
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-all',
                yearly
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.pricing.yearly}
              <span className="ml-1.5 text-xs opacity-80">(-20%)</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {planKeys.map((key, i) => {
            const plan = t.pricing.plans[key];
            const isPopular = 'popular' in plan && plan.popular;
            const price =
              yearly && 'priceYearly' in plan ? plan.priceYearly : plan.price;

            return (
              <motion.div
                key={key}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={cardVariants}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 lg:p-8 transition-all duration-300',
                  isPopular
                    ? 'border-blue-600/50 bg-background shadow-xl shadow-blue-600/10 scale-[1.02] lg:scale-105'
                    : 'bg-background/60 backdrop-blur-sm hover:border-border/80 hover:shadow-lg'
                )}
              >
                {/* Glass effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-transparent to-white/30 dark:from-white/5 dark:to-white/[0.02] pointer-events-none" />

                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 px-4 py-1 shadow-md">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="relative">
                  {/* Plan name */}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {price}
                    </span>
                    {key !== 'free' && (
                      <span className="text-sm text-muted-foreground">
                        /{yearly ? 'yr' : 'mo'}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    className={cn(
                      'mt-6 w-full',
                      isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-md hover:shadow-lg'
                        : ''
                    )}
                    variant={isPopular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={key === 'enterprise' ? 'mailto:contact@smartchat.com' : '/signup'}>
                      {plan.cta}
                    </Link>
                  </Button>

                  {/* Features list */}
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm">
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0 mt-0.5',
                            isPopular
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-muted-foreground'
                          )}
                        />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
