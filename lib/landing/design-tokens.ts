/** Persisted design-system constants — the shared motion/color language. */
export const LANDING_COLORS = {
  void: '#04050A', surface: '#0B0D14', brand: '#2845E7',
  brandGlow: '#4F6BFF', gold: '#F5C24B', ink: '#F5F7FA', inkMuted: '#9AA3B2',
} as const;

/** Custom GSAP eases (registered once where used via CustomEase, or these cubic-beziers). */
export const EASES = {
  power: 'power4.out',
  expo: 'expo.inOut',
  drop: 'power3.inOut',
  reveal: 'power2.out',
} as const;

export const DURATIONS = { reveal: 1.1, stagger: 0.045, transition: 0.9 } as const;
