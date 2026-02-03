
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
 // tipizza in modo super permissivo (zero errori)
trendArrow(t: any): string {
  const v = (t ?? '=').toString().trim();
  if (v === '+') return '↑';
  if (v === '-') return '↓';
  return '→';
}

private normalizeTit(v: any): number | 'I' | 'S' | null {
  if (v === null || v === undefined) return null;
  if (v === 'I' || v === 'S') return v;

  if (typeof v === 'number') {
    let n = v;
    if (n > 0 && n <= 1) n *= 100;
    if (n > 100 && n <= 10000) n /= 100;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  let s = String(v).trim().toUpperCase();
  if (!s) return null;
  if (s === 'I' || s === 'S') return s as 'I'|'S';
  if (s.endsWith('%')) s = s.slice(0, -1).trim();

  let n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n > 0 && n <= 1) n *= 100;
  if (n > 100 && n <= 10000) n /= 100;

  return Math.max(0, Math.min(100, Math.round(n)));
}


titType(p: any): 'num' | 'flag' | 'none' {
  const v = this.normalizeTit(p?.Tit);
  if (v === 'I' || v === 'S') return 'flag';
  if (typeof v === 'number') return 'num';
  return 'none';
}

titPercent(p: any): number {
  const v = this.normalizeTit(p?.Tit);
  return typeof v === 'number' ? v : 0;
}

titFlagVal(p: any): 'I'|'S' {
  const v = this.normalizeTit(p?.Tit);
  return v === 'S' ? 'S' : 'I';
}

titTier(v: number): 'low'|'mid'|'high' {
  if (v < 35) return 'low';
  if (v < 70) return 'mid';
  return 'high';
}

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
