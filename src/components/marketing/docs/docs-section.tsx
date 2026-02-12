'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface DocsSectionProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function DocsSection({ id, title, description, children }: DocsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      className="scroll-mt-24"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
