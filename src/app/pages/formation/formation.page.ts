import { Component, signal, computed, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { SquadService } from '../../services/squad.service';
import { PitchComponent } from '../../components/pitch/pitch.component';
import type { Player, Role } from '../../models/player.model';
import { FormationService, Module } from 'src/app/services/formations.service';
import { Router } from '@angular/router';
type DragOrigin = 'bench' | 'field';

@Component({
  selector: 'app-formation',
  standalone: true,
  imports: [IonicModule, CommonModule, PitchComponent],
  templateUrl: './formation.page.html',
  styleUrls: ['./formation.page.scss'],
})



export class FormationPage {
  module = signal<Module>('4-3-3');

  squad = this.squadService.selected;
  complete = this.squadService.isCompleteSquad;

  // stato “manuale”
  starters = signal<Player[]>([]);
  bench = signal<Player[]>([]);

 

  // reset automatico quando cambia modulo o rosa
  private _resetFx = effect(() => {
    const squad = this.squad();
    const mod = this.module();
    if (!squad.length) return;

    const f = this.formationService.buildBestFormation(squad, mod);
    this.starters.set(f.starters);
    this.bench.set(f.bench);
  });

    
  private readonly MODULES: Module[] = ['4-4-2','4-3-3','4-5-1','3-4-3','3-5-2','5-3-2','5-4-1'];

 
 

  constructor(
    private squadService: SquadService,
    private formationService: FormationService,
    private router: Router
  ) {}

  onModuleChange(ev: CustomEvent) {
    const v = (ev as any).detail?.value as string;
    if (this.MODULES.includes(v as Module)) this.module.set(v as Module);
 
  }

 goSelect() {
  this.router.navigate(['/select']);
}
  
}
