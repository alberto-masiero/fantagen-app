import { Component, OnInit, signal, computed } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Player } from '../../models/player.model';
import { PlayerService } from '../../services/player.service';
import { SquadService } from '../../services/squad.service';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './select.page.html',
  styleUrls: ['./select.page.scss'],
})
export class SelectPage implements OnInit {
  players = signal<Player[]>([]);
  loading = signal(true);
  q = signal('');
  roleFilter = signal<'ALL'|'GK'|'DEF'|'MID'|'FWD'>('ALL');
onSearch(ev: any) {
  this.q.set(ev.detail.value ?? '');
}
onRoleChange(ev: any) {
  const value = ev.detail.value;
  if (['ALL','GK','DEF','MID','FWD'].includes(value)) {
    this.roleFilter.set(value);
  }
}
  selected = this.squad.selected;
counts = this.squad.countsByRole;
total = this.squad.total;
complete = this.squad.isCompleteSquad;

  filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    const rf = this.roleFilter();
    return this.players().filter(p => {
      const okRole = rf === 'ALL' ? true : p.role === rf;
      const okQ = !q ? true : (p.name.toLowerCase().includes(q) || (p.team ?? '').toLowerCase().includes(q));
      return okRole && okQ;
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
        this.players.set(list);
        this.loading.set(false);
      },
      error: async () => {
        this.loading.set(false);
        const t = await this.toast.create({ message: 'Errore caricando players.xlsx', duration: 2200 });
        t.present();
      }
    });
  }

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

  // Controllo disponibilità
  if (gk.length < 3 || def.length < 8 || mid.length < 8 || fwd.length < 6) {
    const t = await this.toast.create({
      message: `Giocatori insufficienti: GK ${gk.length}/3, DEF ${def.length}/8, MID ${mid.length}/8, FWD ${fwd.length}/6`,
      duration: 2600
    });
    t.present();
    return;
  }

  const pickRandom = <T>(arr: T[], n: number): T[] => {
    // shuffle copia
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

  // Applica selezione
  this.squad.clear();
  for (const p of chosen) {
    this.squad.add(p); // non dovrebbe mai fallire perché rispettiamo i limiti
  }

  const t = await this.toast.create({ message: 'Rosa random generata ✅', duration: 1400 });
  t.present();
}

}
