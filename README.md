# Oscillator

A new tab page that behaves like a measuring instrument.

Built for the Hack Club **"Give your website a pulse"** mission.
The idea was pretty simple: instead of having animations that just sit there and look nice, I wanted the page to actually react to what's happening on it.

The waveform in the middle is generated from real data: your tasks, the weather, the time, typing, clicks, and so on. So the page basically has its own pulse.

Live: https://oscilla.alessio.hackclub.app
Repo: https://github.com/AlessioFerrari8/Oscillator


## How it works

Each part of the page contribute something to the pulse.

The most important one:
- more tasks due today -> faster waveform
- stronger wind -> bigger waveform
- rain -> more noise
- typing or clicking -> a little spike that fades away

The widgets don't actually draw anything themselves. They just send their contribution to a small `PulseBus`, and the waveform code combines everything and draws it on the canvas.


## Features

### Oscilloscope
The main waveform is generated on a <canvas>

There is no Math.random() involved. The noise is generated from the position and time, which keeps the animation consistent between frames and makes the waveform easier to test.

### Fast startup
One thing I really didn't like about normal Angular new-tab pages was the empty screen while the app was loading.

public/boot.js starts the waveform before Angular even loads. Once Angular is ready, ScopeComponent takes over the existing canvas instead of starting everything again.

So opening the page doesn't start with a blank screen and then suddenly turn into the actual app.

### Weather 
Weather data comes from Open-Meteo, so there is no API key.

The page tries to use your location automatically, but you can also enter a location manually. Weather data is cached in 'localStorage' for 10 minutes, mainly so repeatedly opening a new tab doesn't spam the API.

### Tasks
You can add tasks with optional due dates.

Overdue tasks and tasks due today are highlighted, and they're also part of what drives the waveform.

### Search
The search bar supports:

- DuckDuckGo
- Google
- Wikipedia
- YouTube
- GitHub

You can also use a prefix for a single search, for example:

g angular signals

This searches Google without changing your default search engine

### Command Palette
`Ctrl/Cmd + K` opens a small command palette.

From there you can change the phosphor, export settings, clear completed tasks, and other actions.

### Panels 
The panels can be reordered by dragging them around. They can also be moved with the keyboard using the arrow keys.

The order is saved, so it doesn't reset every time you open a new tab.

### Phosphors

There are three different looks:

- p1 - green
- p3 - amber
- cyan

They're all controlled through the same CSS variable.

### Settings 
Settings currently include:

- accent color
- default search engine
- manual location
- JSON export/import of the complete state

## Stack
- Angular 22
- standalone components
zoneless Angular
signals
httpResource
Tailwind CSS 4
custom CSS for the theme
self-hosted JetBrains Mono

There are no external runtime dependencies apart from Angular and no API keys.


## Running locally

```bash
cd website
npm install -g @angular/cli
ng serve
```

Then open `http://localhost:4200`.

For a production build:

```bash
ng build
```

Docker is also included:

```bash
cd website
docker compose up -d --build
```

The Docker image builds the Angular app with Node and then serves the static files using an unprivileged nginx container.

## Project structure

Most of the interesting stuff lives here:

website/src/app/
├── core/
│   ├── bus.ts
│   ├── waveform.ts
│   ├── state.ts
│   ├── store.ts
│   └── layout.ts
├── scope/
├── services/
└── widgets/

website/public/
├── boot.js
└── fonts/

`localStorage` uses `oscilla:v1` and the stored state has a version number, so changes to the saved structure can be migrated later without breaking existing layouts.

There are also two files worth checking if you want to know more about the project:

[IMPLEMENTATION-CHOISES.md](/IMPLEMENTATION-CHOISES.md) contains some of the decisions I made during the development, so check it out for further details.
