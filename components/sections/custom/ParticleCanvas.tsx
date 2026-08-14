'use client';

import { useEffect, useRef } from 'react';

/** Parses a #RGB/#RRGGBB hex into [r,g,b]; null on anything else. */
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Drifting, twinkling particle field for the hero. The particle color is
 * resolved at mount from the `--color-fg` design token so the canvas rebrands
 * with the theme instead of hardcoding a color.
 */
export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext?.('2d');
    if (!ctx) return;

    const token = getComputedStyle(document.documentElement).getPropertyValue('--color-fg');
    const [r, g, b] = hexToRgb(token) ?? [255, 255, 255];
    const tint = (a: number) => `rgba(${r},${g},${b},${a.toFixed(3)})`;

    interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number; bright: boolean }
    let particles: P[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = [];
      const n = Math.floor((w * h) / 10000);
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          r: Math.random() * 1.7 + 0.5,
          a: Math.random() * 0.5 + 0.28,
          ph: Math.random() * Math.PI * 2,
          bright: Math.random() < 0.18,
        });
      }
    };

    setup();
    const start = performance.now();
    const loop = (t: number) => {
      const el = t - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x += w;
        if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        if (p.y > h) p.y -= h;
        const tw = 0.55 + 0.45 * Math.sin(el * 0.0009 + p.ph);
        const alpha = Math.min(1, p.a * tw);
        const glow = p.r * (p.bright ? 7 : 4.5);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
        grad.addColorStop(0, tint(alpha));
        grad.addColorStop(0.35, tint(alpha * 0.35));
        grad.addColorStop(1, tint(0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, glow, 0, 6.2832);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = tint(Math.min(1, alpha + 0.25));
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 z-0 h-full w-full"
    />
  );
}
