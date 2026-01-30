import { ApplicationConfig } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // ✅ fondamentale per sbloccare page transitions in prod
    provideIonicAngular(),

    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    provideHttpClient(),
    provideRouter(routes),
  ],
};
