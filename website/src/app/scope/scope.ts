import { Component, effect, ElementRef, inject, OnDestroy, signal } from '@angular/core';
import { PulseBus } from '../core/bus';
import { sample } from '../core/waveform';

declare global {
  interface Window {
    __oscilla?: {
      canvas: HTMLCanvasElement;
      startedAt: number;
      stop(): void
    };
  }
}

/**
 * Draws the trace. It knows no widget, it only reads the bus aggregate
 *
 * It adopts the canvas public/boot.js already created instead of making a new
 * one, otherwise mounting would produce a visible jump
 */
@Component({
  selector: 'app-scope',
  imports: [],
  templateUrl: './scope.html'
})
export class Scope implements OnDestroy{
  private readonly bus = inject(PulseBus);
  private readonly host = inject(ElementRef<HTMLElement>)

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private startedAt = 0;
  private readonly still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly ready = signal(false);

  constructor() {
    effect((onCleanup) => {
      this.adopt();
      const onVisibility = () => (document.hidden ? this.pause() : this.resume());
      const onResize = () => this.resize();
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('resize', onResize);
      this.resume();
      onCleanup(() => {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('resize', onResize);
        this.pause();
      });
    });
  }

  /** Takes over boot.js's canvas, or creates one if it is missing. */
  private adopt(): void {
    const boot = window.__oscilla;
    if (boot) {
      boot.stop();
      this.canvas = boot.canvas;
      this.startedAt = boot.startedAt;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'scope-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      (document.getElementById('scope-host') ?? this.host.nativeElement).appendChild(this.canvas);
      this.startedAt = performance.now();
    }
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    this.ready.set(true);
  }

  private resize(): void {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
  }

  // with the tab in the background the loop stops: 0% CPU on a page opened 50 times a day
  private resume(): void {
    if (this.raf || this.still) {
      if (this.still) this.draw(performance.now());
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  }

  private pause(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private readonly frame = (now: number): void => {
    this.draw(now);
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(now: number): void {
    const { width: w, height: h } = this.canvas;
    const t = this.still ? 0 : now - this.startedAt;
    const agg = this.bus.aggregated();
    const transients = this.still ? [] : this.bus.activeTransients(now);

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.beginPath();
    for (let i = 0; i <= w; i++) {
      const v = sample(agg, transients, i / w, t);
      const y = h / 2 - v * h * 0.42;
      i === 0 ? this.ctx.moveTo(i, y) : this.ctx.lineTo(i, y);
    }
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#6ee7a8';
    this.ctx.strokeStyle = accent;
    this.ctx.lineWidth = Math.max(1, w / 900);
    this.ctx.shadowColor = accent;
    this.ctx.shadowBlur = this.still ? 0 : Math.max(2, w / 300);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  ngOnDestroy(): void {
    this.pause();
  }

}
