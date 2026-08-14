import { WeatherPrefs } from './core/state';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Scope } from './scope/scope';
import { Search } from './widgets/search/search';
import { Palette } from './widgets/palette/palette';
import { Tasks } from './widgets/tasks/tasks';
import { Links } from './widgets/links/links';
import { Settings } from './widgets/settings/settings';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Scope, Search, Palette, Tasks, Links, Settings],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('website');
}
