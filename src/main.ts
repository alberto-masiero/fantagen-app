import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { provideIonicAngular } from '@ionic/angular/standalone';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideIonicAngular(),
    ...(appConfig.providers ?? []),
  ],
}).catch(console.error);
