
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import type { Player } from '../../models/player.model';
import { Module } from 'src/app/services/formations.service';

type Spot = { top: number; left: number };

const SPOTS: Record<Module, Spot[]> = {
  // ordine: GK, DEF..., MID..., FWD...

  /* =========================
     4-4-2 (più aria tra linee)
     ========================= */
  '4-4-2': [
    { top: 88, left: 50 }, // GK (su di ~4)

    // DEF 4 (più larghi)
    { top: 66, left: 12 }, { top: 66, left: 37 }, { top: 66, left: 63 }, { top: 66, left: 88 },

    // MID 4 (più distanti dalla DEF)
    { top: 42, left: 12 }, { top: 42, left: 37 }, { top: 42, left: 63 }, { top: 42, left: 88 },

    // ATT 2 (più su e un po’ più distanti)
    { top: 20, left: 30 }, { top: 20, left: 70 },
  ],

  /* =========================
     4-3-3 (ali alte)
     ========================= */
  '4-3-3': [
    { top: 88, left: 50 },

    // DEF 4
    { top: 66, left: 12 }, { top: 66, left: 37 }, { top: 66, left: 63 }, { top: 66, left: 88 },

    // MID 3 (triangolo largo)
    { top: 44, left: 25 }, { top: 40, left: 50 }, { top: 44, left: 75 },

    // ATT 3 (ali più aperte ma safe)
    { top: 18, left: 18 }, { top: 16, left: 50 }, { top: 18, left: 82 },
  ],

  /* =========================
     4-5-1 (5 a centro: esterni un filo più bassi)
     ========================= */
  '4-5-1': [
    { top: 88, left: 50 },

    // DEF 4
    { top: 66, left: 12 }, { top: 66, left: 37 }, { top: 66, left: 63 }, { top: 66, left: 88 },

    // MID 5 (W shape)
    { top: 48, left: 12 }, { top: 42, left: 32 }, { top: 40, left: 50 }, { top: 42, left: 68 }, { top: 48, left: 88 },

    // ATT 1
    { top: 18, left: 50 },
  ],

  /* =========================
     3-4-3 (esterni larghi, centrali più su)
     ========================= */
  '3-4-3': [
    { top: 88, left: 50 },

    // DEF 3
    { top: 66, left: 18 }, { top: 66, left: 50 }, { top: 66, left: 82 },

    // MID 4
    { top: 42, left: 12 }, { top: 42, left: 37 }, { top: 42, left: 63 }, { top: 42, left: 88 },

    // ATT 3
    { top: 18, left: 18 }, { top: 16, left: 50 }, { top: 18, left: 82 },
  ],

  /* =========================
     3-5-2 (quinti più bassi, 3 centrali più su)
     ========================= */
  '3-5-2': [
    { top: 88, left: 50 },

    // DEF 3
    { top: 66, left: 22 }, { top: 66, left: 50 }, { top: 66, left: 78 },

    // MID 5
    { top: 48, left: 12 }, { top: 42, left: 32 }, { top: 40, left: 50 }, { top: 42, left: 68 }, { top: 48, left: 88 },

    // ATT 2
    { top: 20, left: 30 }, { top: 20, left: 70 },
  ],

  /* =========================
     5-3-2 (quinti larghi, 3 centrali stretti)
     ========================= */
  '5-3-2': [
    { top: 88, left: 50 },

    // DEF 5 (quinti larghi ma safe)
    { top: 68, left: 10 }, { top: 66, left: 30 }, { top: 66, left: 50 }, { top: 66, left: 70 }, { top: 68, left: 90 },

    // MID 3 (un filo più su e larghi)
    { top: 42, left: 25 }, { top: 40, left: 50 }, { top: 42, left: 75 },

    // ATT 2
    { top: 20, left: 40 }, { top: 20, left: 60 },
  ],

  /* =========================
     5-4-1 (linee ben staccate)
     ========================= */
  '5-4-1': [
    { top: 88, left: 50 },

    // DEF 5
    { top: 68, left: 10 }, { top: 66, left: 30 }, { top: 66, left: 50 }, { top: 66, left: 70 }, { top: 68, left: 90 },

    // MID 4
    { top: 44, left: 12 }, { top: 42, left: 37 }, { top: 42, left: 63 }, { top: 44, left: 88 },

    // ATT 1
    { top: 18, left: 50 },
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
