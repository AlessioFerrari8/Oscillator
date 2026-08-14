import { Component, signal } from '@angular/core';


const LINES = [
  'oscilla v1 - signal acquisition unit',
  'calibrating trace ......... ok',
  'mounting local store ...... ok',
  'sourcing pulse inputs ..... ok',
];


@Component({
  selector: 'app-boot',
  imports: [],
  templateUrl: './boot.html',
  styles: ``,
})
export class Boot {
  protected readonly shown = signal<string[]>([]);
  protected readonly done = signal(false);

  constructor() {
    // Anyone who asked for less motion should not have to sit through a little show
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.done.set(true);
      return;
    }

    
    LINES.forEach((line, i) => {
      setTimeout(() => {
        this.shown.update((v) => [...v, line]);
        if (i === LINES.length - 1) setTimeout(() => this.done.set(true), 250);
      }, i * 180);
    });
  }
}
