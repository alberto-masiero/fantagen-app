import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule, RouterOutlet } from '@angular/router';
import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, IonRouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {}
