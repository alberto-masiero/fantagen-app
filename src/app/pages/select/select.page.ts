import { Component, OnInit, signal, computed } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Player } from '../../models/player.model';
import { PlayerService } from '../../services/player.service';
import { SquadService } from '../../services/squad.service';

type RoleFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';

// Estensione runtime (non serve toccare il model)
type PlayerWithKey = Player & { _k: string };

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './select.page.html',
  styleUrls: ['./select.page.scss'],
})
export class SelectPage implements OnInit {
  players = signal<PlayerWithKey[]>([]);
  loading = signal(true);

  /** query "debounced" */
  q = signal('');
  private qDraft = '';              // ultimo valore digitato
  private qTimer: any = null;       // debounce timer

  roleFilter = signal<RoleFilter>('ALL');

  // espongo gli stati dello squad service
  selected = this.squad.selected;
  counts = this.squad.countsByRole;
  total = this.squad.total;
  complete = this.squad.isCompleteSquad;

  /** filtro veloce: no toLowerCase per ogni player */
  filtered = computed(() => {
    const q = this.q().trim();              // già lowercase
    const rf = this.roleFilter();
    const list = this.players();

    // early exits = più veloce
    if (!q && rf === 'ALL') return list;

    return list.filter(p => {
      if (rf !== 'ALL' && p.role !== rf) return false;
      if (q && !p._k.includes(q)) return false;
      return true;
    });
  });

  constructor(
    private playerService: PlayerService,
    private squad: SquadService,
    private toast: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.playerService.loadPlayersFromExcel().subscribe({
      next: (list) => {
        // Precompute chiave di ricerca (1 volta sola)
        const enriched: PlayerWithKey[] = list.map(p => ({
          ...p,
          _k: `${p.name ?? ''} ${p.team ?? ''}`.toLowerCase()
        }));

        this.players.set(enriched);
        this.loading.set(false);
      },
      error: async () => {
        this.loading.set(false);
        const t = await this.toast.create({ message: 'Errore caricando players.xlsx', duration: 2200 });
        t.present();
      }
    });
  }

  /** debounce 150ms: evita filtraggio ad ogni tasto */
  onSearch(ev: any) {
    const raw = (ev?.detail?.value ?? '').toString();
    this.qDraft = raw.toLowerCase();

    if (this.qTimer) clearTimeout(this.qTimer);
    this.qTimer = setTimeout(() => {
      this.q.set(this.qDraft);
    }, 150);
  }

  onRoleChange(ev: any) {
    const value = ev?.detail?.value;
    if (value === 'ALL' || value === 'GK' || value === 'DEF' || value === 'MID' || value === 'FWD') {
      this.roleFilter.set(value);
    }
  }

  /** IMPORTANT: usa questa nel template per ngFor */
  trackById = (_: number, p: PlayerWithKey) => p.id;

  isSelected(p: Player) {
    return this.squad.isSelected(p.id);
  }

  async toggle(p: Player) {
    if (this.squad.isSelected(p.id)) {
      this.squad.remove(p.id);
      return;
    }
    const res = this.squad.add(p);
    if (!res.ok) {
      const t = await this.toast.create({ message: res.reason ?? 'Non puoi aggiungerlo', duration: 1800 });
      t.present();
    }
  }

  goFormation() {
    if (!this.squad.isCompleteSquad()) return;
    this.router.navigate(['/formation']);
  }

  reset() {
    this.squad.clear();
  }

  async randomSquad() {
    const all = this.players();
    if (!all.length) {
      const t = await this.toast.create({ message: 'Lista giocatori vuota', duration: 1600 });
      t.present();
      return;
    }

    const gk = all.filter(p => p.role === 'GK');
    const def = all.filter(p => p.role === 'DEF');
    const mid = all.filter(p => p.role === 'MID');
    const fwd = all.filter(p => p.role === 'FWD');

    if (gk.length < 3 || def.length < 8 || mid.length < 8 || fwd.length < 6) {
      const t = await this.toast.create({
        message: `Giocatori insufficienti: GK ${gk.length}/3, DEF ${def.length}/8, MID ${mid.length}/8, FWD ${fwd.length}/6`,
        duration: 2600
      });
      t.present();
      return;
    }

    const pickRandom = <T>(arr: T[], n: number): T[] => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a.slice(0, n);
    };

    const chosen = [
      ...pickRandom(gk, 3),
      ...pickRandom(def, 8),
      ...pickRandom(mid, 8),
      ...pickRandom(fwd, 6),
    ];

    this.squad.clear();
    for (const p of chosen) this.squad.add(p);

    const t = await this.toast.create({ message: 'Rosa random generata ✅', duration: 1400 });
    t.present();
  }
}
