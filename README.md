# Oscillator

A new tab page that behaves like a measuring instrument.

Built for the Hack Club **"Give your website a pulse"** mission.
The page does not animate for decoration: at the center there is a
waveform on a `<canvas>` fed by the **real data of the page** — open
tasks, wind and rain from the weather, the clock, your keystrokes.
That is the pulse, taken literally.

Live: https://oscilla.alessio.hackclub.app
Repo: https://github.com/AlessioFerrari8/Oscillator


## The idea

Every widget on the page declares how it wants the signal to behave —
`{ freq, amp, noise }` — and then forgets about it. No widget ever draws
anything. The canvas only reads the aggregate of those contributions and
has no idea that tasks or weather exist.

    tasks    ─┐
    weather  ─┤──> PulseBus ──> waveform.ts (pure) ──> <canvas>
    search   ─┤
    clock    ─┘

- more tasks due today  -> faster trace
- stronger wind         -> higher amplitude
- rain                  -> more noise on the line
- typing / clicking     -> a transient spike that decays in ~450 ms


## Features

- **Oscilloscope trace** — deterministic waveform, no `Math.random()`:
  the noise is a hash of (x, t), so two consecutive frames are related
  and the whole thing is testable without a DOM.
- **Two-stage boot** — `public/boot.js` starts the trace *before* Angular
  is parsed, and `ScopeComponent` adopts the canvas and the running loop
  instead of recreating them. On a tab you open 50 times a day the
  framework never leaves the page blank, and there is no visual jump.
- **Weather** (Open-Meteo, keyless) — geolocation with manual fallback,
  cached in `localStorage` for 10 minutes so reopening the tab five times
  in a minute does not fire five requests.
- **Tasks** — with an optional due date; overdue and due-today items are
  highlighted and are what actually drives the beat.
- **Search bar** — 5 engines (DuckDuckGo, Google, Wikipedia, YouTube,
  GitHub) with per-query prefixes: `g angular` searches Google once
  without changing your saved default.
- **Command palette** — `Ctrl/Cmd + K`: switch phosphor, export settings,
  clear completed tasks.
- **Editable bookmarks**.
- **Reorderable panels** — drag and drop by the grip, or focus it and use
  the arrow keys. The order is persisted.
- **Three phosphors** — `p1` green, `p3` amber, `cyan`, all driven by a
  single CSS variable.
- **Settings** — accent, default engine, manual location, JSON
  export/import of the whole state.


## Accessibility & behaviour

- `prefers-reduced-motion: reduce` freezes the trace (both in `boot.js`
  and in the scope component).
- The drawing loop pauses on `visibilitychange`: a background tab burns
  no CPU.
- Every control is reachable from the keyboard; the panel grips expose
  their position through `aria-label`.
- `/` focuses the search field unless you are already typing somewhere.


## Stack

- **Angular 22**, standalone + zoneless, signals-first (`httpResource`
  instead of `subscribe`).
- **Tailwind CSS 4** for layout, hand-written CSS in `src/styles.css`
  for the theme.
- **JetBrains Mono**, self-hosted (no request to Google Fonts).
- No runtime dependency beyond Angular. No API key anywhere.


## Run it

    cd website
    npm install -g @angular/cli
    ng serve            # http://localhost:4200

Build:

    ng build        # -> dist/<outputPath>/browser

Docker:

    cd website
    docker compose up -d --build     # http://localhost:4200

The image is a two-stage build: Node for the build, unprivileged nginx
to serve the static output.


## Project layout

    website/src/app/
      core/
        bus.ts        registry of every contribution to the signal
        waveform.ts   pure, deterministic sampling of the trace
        state.ts      persisted state: types, defaults, migration
        store.ts      single owner of the state, debounced localStorage
        layout.ts     panel order (pure, no DOM)
      scope/          the canvas that samples the waveform
      services/       geo, weather, forecast (Open-Meteo)
      widgets/        boot, search, palette, tasks, weather, links, settings
    website/public/
      boot.js         starts the trace before Angular loads
      fonts/          self-hosted JetBrains Mono

State lives in `localStorage` under `oscilla:v1`, with a version field
and a migration path so an old saved layout never loses a panel added
later.

See `IMPLEMENTATION-CHOISES.md` for every decision that departs from the
guide, and `devlogs.md` for the build log.


