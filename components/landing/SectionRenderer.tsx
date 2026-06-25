'use client';
import type { LandingSection } from '@/lib/landing/landing.config';
import { HeroSection } from './sections/HeroSection';
import { ContentSection } from './sections/ContentSection';
import { CtaSection } from './sections/CtaSection';
import { ScrollVideo } from './ScrollVideo';
export function SectionRenderer({ section, onStart }: { section: LandingSection; onStart: () => void }) {
  switch (section.kind) {
    case 'hero': return <HeroSection section={section} />;
    case 'content': return <ContentSection section={section} />;
    case 'cta': return <CtaSection section={section} onStart={onStart} />;
    case 'video': return <ScrollVideo section={section} />;
  }
}
