
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import type { Player } from '../../models/player.model';
import { Module } from 'src/app/services/formations.service';

type Spot = { top: number; left: number };

const SPOTS: Record<Module, Spot[]> = {
  // ordine: GK, DEF..., MID..., FWD...
  '4-4-2': [
    { top: 92, left: 50 },                 // GK
    { top: 75, left: 15 }, { top: 75, left: 38 }, { top: 75, left: 62 }, { top: 75, left: 85 }, // DEF 4
    { top: 52, left: 15 }, { top: 52, left: 38 }, { top: 52, left: 62 }, { top: 52, left: 85 }, // MID 4
    { top: 28, left: 38 }, { top: 28, left: 62 }, // FWD 2
  ],
  '4-3-3': [
    { top: 92, left: 50 },
    { top: 75, left: 15 }, { top: 75, left: 38 }, { top: 75, left: 62 }, { top: 75, left: 85 },
    { top: 52, left: 25 }, { top: 52, left: 50 }, { top: 52, left: 75 },
    { top: 28, left: 20 }, { top: 24, left: 50 }, { top: 28, left: 80 },
  ],
  '4-5-1': [
    { top: 92, left: 50 },
    { top: 75, left: 15 }, { top: 75, left: 38 }, { top: 75, left: 62 }, { top: 75, left: 85 },
    { top: 58, left: 15 }, { top: 52, left: 35 }, { top: 52, left: 50 }, { top: 52, left: 65 }, { top: 58, left: 85 },
    { top: 26, left: 50 },
  ],
  '3-4-3': [
    { top: 92, left: 50 },
    { top: 75, left: 25 }, { top: 75, left: 50 }, { top: 75, left: 75 },
    { top: 52, left: 15 }, { top: 52, left: 38 }, { top: 52, left: 62 }, { top: 52, left: 85 },
    { top: 28, left: 20 }, { top: 24, left: 50 }, { top: 28, left: 80 },
  ],
  '3-5-2': [
    { top: 92, left: 50 },
    { top: 75, left: 25 }, { top: 75, left: 50 }, { top: 75, left: 75 },
    { top: 58, left: 15 }, { top: 52, left: 35 }, { top: 52, left: 50 }, { top: 52, left: 65 }, { top: 58, left: 85 },
    { top: 28, left: 38 }, { top: 28, left: 62 },
  ],
    '5-3-2': [
    { top: 92, left: 50 }, // GK
    // DEF 5
    { top: 76, left: 10 }, { top: 76, left: 30 }, { top: 76, left: 50 }, { top: 76, left: 70 }, { top: 76, left: 90 },
    // MID 3
    { top: 52, left: 25 }, { top: 52, left: 50 }, { top: 52, left: 75 },
    // FWD 2
    { top: 28, left: 40 }, { top: 28, left: 60 },
  ],

  '5-4-1': [
    { top: 92, left: 50 }, // GK
    // DEF 5
    { top: 76, left: 10 }, { top: 76, left: 30 }, { top: 76, left: 50 }, { top: 76, left: 70 }, { top: 76, left: 90 },
    // MID 4
    { top: 54, left: 15 }, { top: 52, left: 38 }, { top: 52, left: 62 }, { top: 54, left: 85 },
    // FWD 1
    { top: 26, left: 50 },
  ],
};

@Component({
  selector: 'app-pitch',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './pitch.component.html',
  styleUrls: ['./pitch.component.scss'],
})
export class PitchComponent {
  @Input() module!: Module;
  @Input() starters: Player[] = [];
  // collegamenti drop-list (una lista panchina + tutte le slot)



  spots(): Spot[] {
    return SPOTS[this.module] ?? [];
  }

  playerAt(i: number): Player | null {
    return this.starters[i] ?? null;
  }



  slotId(i: number) {
    return `slot-${i}`;
  }
}
