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

+