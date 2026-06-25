'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DesignSpec } from '@/lib/catalog/types';
import { designSpecSchema } from '@/lib/engine/schema';
import { generate } from '@/lib/engine/generate';
import { DESIGN_SPEC_SESSION_KEY } from '@/lib/store/design-session';
import { LandingLink } from '@/components/navigation/LandingLink';

const MyLookViewer = dynamic<{ spec: DesignSpec }>(() => import('./MyLookViewer').then((m) => m.MyLookViewer), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center font-sans text-sm text-ink-muted">Loading viewer</div>,
});

const fallbackSpec = () =>
  generate({
    hoodieColor: 'black',
    teamsRanked: ['celtics'],
    density: 'balanced',
    vibe: 'vegas',
  });

function readSessionSpec() {
  try {
    const saved = window.sessionStorage.getItem(DESIGN_SPEC_SESSION_KEY);
    if (saved) {
      const parsed = designSpecSchema.safeParse(JSON.parse(saved));
      if (parsed.success) return parsed.data as DesignSpec;
    }
  } catch {
    // Invalid session data falls back to the sample spec.
  }
  return fallbackSpec();
}

export function MyLookExperience() {
  const [spec, setSpec] = useState<DesignSpec | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [status, setStatus] = useState('Camera off');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setSpec(readSessionSpec()), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const selectedSummary = useMemo(() => {
    if (!spec) return 'No hoodie loaded';
    return `${spec.hoodieColor} / ${spec.densityTier} / ${spec.patches.length} patches`;
  }, [spec]);

  const startCamera = useCallback(async () => {
    setError(null);
    setOpeningCamera(true);
    setStatus('Opening camera');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access needs HTTPS or localhost.');
      setStatus('Camera unavailable');
      setOpeningCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        void video.play().catch(() => undefined);
      }
      setCameraReady(true);
      setStatus('Line up your face in the hood');
    } catch {
      setCameraReady(false);
      setStatus('Camera blocked');
      setError('Camera permission is needed for My Look.');
    } finally {
      setOpeningCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setCameraReady(false);
    setStatus('Camera off');
    setError(null);
  }, []);

  if (!spec) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-ink">
        <p className="font-sans text-sm text-ink-muted">Loading My Look</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-ink lg:grid lg:grid-cols-[1.18fr_0.82fr]">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--lx-glow)' }} />
      <LandingLink />

      <section className="relative h-[58vh] min-h-[430px] overflow-hidden lg:h-dvh">
        <MyLookViewer spec={spec} />
        <div
          className={`absolute left-1/2 top-[7.8%] z-10 aspect-[0.72/1] w-[clamp(94px,25vw,132px)] -translate-x-1/2 overflow-hidden rounded-[48%] border border-white/25 bg-[#05060b] shadow-[0_18px_70px_rgba(0,0,0,0.55)] transition sm:top-[7%] sm:w-[clamp(104px,19vw,148px)] lg:top-[6.8%] lg:w-[clamp(104px,9.2vw,145px)] ${
            cameraReady ? 'opacity-100' : 'opacity-55'
          }`}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className={`h-full w-full scale-x-[-1] object-cover transition ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
          />
          {!cameraReady && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.08),rgba(0,0,0,0.88)_62%)]" />}
        </div>
      </section>

      <section className="relative flex min-h-[42vh] flex-col justify-center gap-5 px-5 py-8 sm:px-8 lg:min-h-dvh lg:px-10">
        <div className="pl-14 sm:pl-0">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-ink-muted">My Look</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">See the hoodie on you</h1>
          <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-ink-muted">
            Start the camera and place your face inside the hood opening.
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border border-line bg-surface/72 p-3 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cameraReady ? stopCamera : startCamera}
              disabled={openingCamera}
              className="rounded-full bg-brand px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {cameraReady ? 'Stop camera' : openingCamera ? 'Opening' : 'Start camera'}
            </button>
            <Link
              href="/design"
              className="rounded-full border border-line px-5 py-2.5 font-sans text-sm font-medium text-ink-muted transition hover:border-ink-muted hover:text-ink"
            >
              Edit hoodie
            </Link>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 font-sans text-xs text-ink-muted">
              <span>{status}</span>
              <span>{selectedSummary}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: cameraReady ? '100%' : '0%' }} />
            </div>
            {error && <p className="font-sans text-xs text-[#ffb4a8]">{error}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
          <LookStat label="View" value="Live" />
          <LookStat label="Camera" value={cameraReady ? 'On' : 'Off'} />
          <LookStat label="Data" value="Local" />
        </div>
      </section>
    </main>
  );
}

function LookStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-muted">{label}</p>
      <p className="mt-0.5 font-sans text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
