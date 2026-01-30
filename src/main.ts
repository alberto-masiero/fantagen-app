import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideRouter(routes, withHashLocation()),
    provideIonicAngular(),
    ...(appConfig.providers ?? []),
  ],
}).catch(console.error);
