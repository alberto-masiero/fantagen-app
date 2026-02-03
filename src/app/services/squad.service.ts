import { Injectable, signal, computed } from '@angular/core';
import type { Player, Role } from '../models/player.model';

const LIMITS: Record<Role, number> = {
  GK: 3,
  DEF: 8,
  MID: 8,
  FWD: 6,
};

type SavedSquad = {
  v: 1;
  savedAt: number;
  selectedIds: number[];
};

const LS_KEY = 'fantagen:squad:v1';

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

  /* =========================
     PERSISTENZA (UNA SOLA ROSA)
     ========================= */

  /** Salva la rosa corrente (anche se non completa, se vuoi limitarla controlla isCompleteSquad()) */
  saveToLocal() {
    const payload: SavedSquad = {
      v: 1,
      savedAt: Date.now(),
      selectedIds: this._selected().map(p => p.id),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }

  /**
   * Carica la rosa salvata ricostruendo i Player dalla lista completa (excel).
   * Ritorna true se ha caricato qualcosa.
   */
  loadFromLocal(allPlayers: Player[]): boolean {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw) as SavedSquad;
      if (!data?.selectedIds?.length) return false;

      const map = new Map<number, Player>(allPlayers.map(p => [p.id, p]));
      const list = data.selectedIds.map(id => map.get(id)).filter(Boolean) as Player[];

      // se alcuni id non esistono più nel file, li scarta
      this._selected.set(list);
      return true;
    } catch {
      return false;
    }
  }

  hasSaved(): boolean {
    return !!localStorage.getItem(LS_KEY);
  }

  getSavedAt(): number | null {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SavedSquad;
      return data?.savedAt ?? null;
    } catch {
      return null;
    }
  }

  deleteSaved() {
    localStorage.removeItem(LS_KEY);
  }
}
