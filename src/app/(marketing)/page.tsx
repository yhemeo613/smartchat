'use client';

import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { Pricing } from '@/components/marketing/pricing';
import { CTASection } from '@/components/marketing/cta-section';

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      <CTASection />
    </>
  );
}
