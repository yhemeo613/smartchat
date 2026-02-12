'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Brain,
  Palette,
  Code2,
  BarChart3,
  Languages,
  Shield,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const featureIcons = [Brain, Palette, Code2, BarChart3, Languages, Shield];
const featureKeys = [
  'rag',
  'customization',
  'embed',
  'analytics',
  'multilingual',
  'security',
] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export function Features() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-r from-blue-600/5 to-transparent rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-violet-600/5 to-transparent rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.features.subtitle}
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[i];
            const feature = t.features.items[key];
            return (
              <motion.div
                key={key}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={cardVariants}
                className="group relative rounded-2xl border bg-background/50 backdrop-blur-sm p-6 hover:border-blue-600/30 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300"
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-transparent to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 group-hover:from-blue-600/20 group-hover:to-violet-600/20 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
