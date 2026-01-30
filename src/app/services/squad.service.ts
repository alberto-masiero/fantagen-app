import { Injectable, signal, computed } from '@angular/core';
import type { Player, Role } from '../models/player.model';

const LIMITS: Record<Role, number> = {
  GK: 3,
  DEF: 8,
  MID: 8,
  FWD: 6,
};

@Injectable({ providedIn: 'root' })
export class SquadService {
  private _selected = signal<Player[]>([]);

  // esponi come readonly
  selected = this._selected.asReadonly();

  countsByRole = computed(() => {
    const c: Record<Role, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of this._selected()) c[p.role]++;
    return c;
  });

  total = computed(() => this._selected().length);

  isCompleteSquad = computed(() => {
    const c = this.countsByRole();
    return (
      this.total() === 25 &&
      c.GK === 3 &&
      c.DEF === 8 &&
      c.MID === 8 &&
      c.FWD === 6
    );
  });

  clear() {
    this._selected.set([]);
  }

  isSelected(id: number) {
    return this._selected().some(p => p.id === id);
  }

  canAdd(p: Player): { ok: boolean; reason?: string } {
    if (this.isSelected(p.id)) return { ok: false, reason: 'Giocatore già selezionato' };
    if (this.total() >= 25) return { ok: false, reason: 'Hai già 25 giocatori' };

    const c = this.countsByRole();
    if (c[p.role] >= LIMITS[p.role]) {
      return { ok: false, reason: `Limite ${p.role} raggiunto (${LIMITS[p.role]})` };
    }
    return { ok: true };
  }

  add(p: Player): { ok: boolean; reason?: string } {
    const can = this.canAdd(p);
    if (!can.ok) return can;
    this._selected.update(list => [...list, p]);
    return { ok: true };
  }

  remove(id: number) {
    this._selected.update(list => list.filter(p => p.id !== id));
  }
}
