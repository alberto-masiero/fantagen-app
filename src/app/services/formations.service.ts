import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';

export type Module = '4-4-2' | '4-3-3' | '4-5-1' | '3-4-3' | '3-5-2' | '5-3-2' | '5-4-1';

export interface FormationResult {
  module: Module;
  starters: Player[];
  bench: Player[];
}

const MODULE_SLOTS: Record<Module, { DEF: number; MID: number; FWD: number }> = {
  '4-4-2': { DEF: 4, MID: 4, FWD: 2 },
  '4-3-3': { DEF: 4, MID: 3, FWD: 3 },
  '4-5-1': { DEF: 4, MID: 5, FWD: 1 },
  '3-4-3': { DEF: 3, MID: 4, FWD: 3 },
  '3-5-2': { DEF: 3, MID: 5, FWD: 2 },
  '5-3-2': { DEF: 5, MID: 3, FWD: 2 },
  '5-4-1': { DEF: 5, MID: 4, FWD: 1 },
};

@Injectable({ providedIn: 'root' })
export class FormationService {
  buildBestFormation(squad: Player[], module: Module): FormationResult {
    const gk  = squad.filter(p => p.role === 'GK').sort((a, b) => b.rating - a.rating);
    const def = squad.filter(p => p.role === 'DEF').sort((a, b) => b.rating - a.rating);
    const mid = squad.filter(p => p.role === 'MID').sort((a, b) => b.rating - a.rating);
    const fwd = squad.filter(p => p.role === 'FWD').sort((a, b) => b.rating - a.rating);

    const slots = MODULE_SLOTS[module];

    const starters: Player[] = [
      ...gk.slice(0, 1),
      ...def.slice(0, slots.DEF),
      ...mid.slice(0, slots.MID),
      ...fwd.slice(0, slots.FWD),
    ];

    const starterIds = new Set(starters.map(s => s.id));
    const roleOrder: Record<Player['role'], number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

    const bench = squad
      .filter(p => !starterIds.has(p.id))
      .sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || b.rating - a.rating);

    return { module, starters, bench };
    
  }
}
