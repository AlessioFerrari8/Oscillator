### Framework
Instead of using Vite, I decided to use Angular. That's because I'm more familiar with it, and it's perfect for this kind of job. The Angular SPA-filosofy perfectly adapts to the project requirements.

### Differences with Vite
In angular to install dependencies you have to run this command
```bash
npm install -g @angular/cli
```

And then to open the dev server, 
```bash
ng serve
```

The service will be running on `http://localhost:4200`

### Env
In the demo there's an env, with the nasa api key. We won't need an env, since the application we'll be creating will use a keyless api.

### Github pages
I will use the Nest vps, with my own domain.
I dockerized the app, since I like working with docker, and it makes things easier for me.


### Style
Instead of CSS I decided to use TailwindCSS. That's because I'm more confident with it, and I can stilify in a better way my app.
I used CSS only on the global app styles, in [styles.css](./website/src/styles.css)

### Developing
The app is not in just one html and one js file, it's created with components, as should be done in angular. 
To create a component, this is the way
```bash
ng g c component -s --skip-tests
```

`g` stays for `generate`, `c` stays for `component`
`-s` is for not creating the css file
`--skip-tests` is for not creating the spec.ts file

To create a service
```bash
ng g s service --skip-tests
```

### Components
The components I created are:
- boot
- links
- palette
- search
- settings
- tasks
- weather

### Services
This is one of the most important parts in this project, here are the one I created:
- forecast
- geo
- weather

### Core, raw ts files
- bus
- layout
- store
- state
- waveform

Component scope: It's the canvas that samples the waveform + public/boot.js -> here the page pulses for the first time