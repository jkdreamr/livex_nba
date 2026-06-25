import { ACT_KEYFRAMES, type ActKeyframe } from './landing.config';

export interface LebronPose {
  rotationY: number;
  position: [number, number, number];
  scale: number;
  intensity: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
// smooth ease so transitions between acts are never linear/abrupt
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function poseAtProgress(progress: number, keys: ActKeyframe[] = ACT_KEYFRAMES): LebronPose {
  const p = clamp01(progress);
  let lo = keys[0]!;
  let hi = keys[keys.length - 1]!;
  for (let i = 0; i < keys.length - 1; i++) {
    if (p >= keys[i]!.at && p <= keys[i + 1]!.at) { lo = keys[i]!; hi = keys[i + 1]!; break; }
  }
  const span = hi.at - lo.at || 1;
  const t = ease(clamp01((p - lo.at) / span));
  return {
    rotationY: lerp(lo.rotationY, hi.rotationY, t),
    position: [
      lerp(lo.position[0], hi.position[0], t),
      lerp(lo.position[1], hi.position[1], t),
      lerp(lo.position[2], hi.position[2], t),
    ],
    scale: lerp(lo.scale, hi.scale, t),
    intensity: lerp(lo.intensity, hi.intensity, t),
  };
}
