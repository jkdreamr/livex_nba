export type SectionKind = 'hero' | 'video' | 'content' | 'cta';
export type VideoMode = 'play' | 'scrub';

export interface LandingSection {
  id: string;
  kind: SectionKind;
  videoSrc?: string;
  poster?: string;
  videoMode?: VideoMode;
  headline?: string;
  body?: string;
  theme?: 'dark' | 'light';
}

export interface ActKeyframe {
  at: number; // scroll progress 0..1 where this pose is reached
  rotationY: number; // degrees
  position: [number, number, number];
  scale: number;
  intensity: number; // 0..1 light energy multiplier
}

/** Edit sections/order/video-slots HERE only. */
export const LANDING_SECTIONS: LandingSection[] = [
  { id: 'hero', kind: 'hero', headline: 'DESIGN YOUR DROP', body: 'NBA SUMMER LEAGUE · LAS VEGAS 2026' },
  { id: 'reel-1', kind: 'video', headline: 'BUILT FOR THE MOMENT', theme: 'dark' /* videoSrc: '/videos/reel-1.mp4' */ },
  { id: 'how', kind: 'content', headline: 'ANSWER A FEW QUESTIONS.', body: 'Get a hoodie made for you — designed in 3D, made for real.' },
  { id: 'reel-2', kind: 'video', headline: 'YOUR TEAM. YOUR CITY.', theme: 'dark' /* videoSrc: '/videos/reel-2.mp4' */ },
  { id: 'cta', kind: 'cta', headline: 'START DESIGNING', body: 'Your drop is one scroll away.' },
];

/** The LeBron choreography — keyframes across full-page scroll (0..720deg, lands front). */
export const ACT_KEYFRAMES: ActKeyframe[] = [
  { at: 0.00, rotationY: 0,   position: [0, 0, 0],      scale: 1.00, intensity: 1.0 },
  { at: 0.14, rotationY: 120, position: [0, 0, 0],      scale: 1.00, intensity: 1.0 },
  { at: 0.34, rotationY: 300, position: [-1.6, 0, 0],   scale: 0.82, intensity: 0.6 },
  { at: 0.60, rotationY: 480, position: [0.4, -0.1, 0], scale: 0.95, intensity: 1.0 },
  { at: 0.80, rotationY: 660, position: [1.6, 0, 0],    scale: 0.82, intensity: 0.7 },
  { at: 1.00, rotationY: 720, position: [0, 0.05, 0],   scale: 1.08, intensity: 1.2 },
];
