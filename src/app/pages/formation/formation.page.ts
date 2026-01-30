// import { Component, signal, computed } from '@angular/core';
// import { IonicModule } from '@ionic/angular';
// import { CommonModule } from '@angular/common';

// import { SquadService } from '../../services/squad.service';
// import { PitchComponent } from '../../components/pitch/pitch.component';
// import { FormationService, Module } from 'src/app/services/formations.service';

// @Component({
//   selector: 'app-formation',
//   standalone: true,
//   imports: [IonicModule, CommonModule, PitchComponent],
//   templateUrl: './formation.page.html',
//   styleUrls: ['./formation.page.scss'],
// })
// export class FormationPage {
//   module = signal<Module>('4-3-3');
// private readonly MODULES: Module[] = ['4-4-2','4-3-3','4-5-1','3-4-3','3-5-2','5-3-2','5-4-1'];


// onModuleChange(ev: CustomEvent) {
//   const v = (ev as any).detail?.value as string;
//   if (this.MODULES.includes(v as Module)) {
//     this.module.set(v as Module);
//   }
// }
//   // ✅ squadService.selected è un Signal<Player[]>
//   squad = this.squadService.selected;

//   // ✅ computed che dipende dal signal
//   formation = computed(() =>
//     this.formationService.buildBestFormation(this.squad(), this.module())
//   );

//   // opzionale: blocca pagina se non completa
//   complete = this.squadService.isCompleteSquad;

//   constructor(
//     private squadService: SquadService,
//     private formationService: FormationService
//   ) {}
// }

import { Component, signal, computed, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { SquadService } from '../../services/squad.service';
import { PitchComponent } from '../../components/pitch/pitch.component';
import type { Player, Role } from '../../models/player.model';
import { FormationService, Module } from 'src/app/services/formations.service';
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

   dragging = signal<Player | null>(null);
  dragOrigin = signal<DragOrigin>('bench');
  ghostX = signal(0);
  ghostY = signal(0);
  // reset automatico quando cambia modulo o rosa
  private _resetFx = effect(() => {
    const squad = this.squad();
    const mod = this.module();
    if (!squad.length) return;

    const f = this.formationService.buildBestFormation(squad, mod);
    this.starters.set(f.starters);
    this.bench.set(f.bench);
  });

    private pointerMove?: (e: PointerEvent) => void;
  private pointerUp?: (e: PointerEvent) => void;

  private readonly MODULES: Module[] = ['4-4-2','4-3-3','4-5-1','3-4-3','3-5-2','5-3-2','5-4-1'];
 startDrag(ev: PointerEvent, player: Player, origin: DragOrigin) {
    ev.preventDefault();

    this.dragging.set(player);
    this.markCompatibleSlots(player);
this.vibrate(12);
    this.dragOrigin.set(origin);

    // posiziona ghost sotto il puntatore
    this.ghostX.set(ev.clientX - 28);
    this.ghostY.set(ev.clientY - 28);

    this.pointerMove = (e: PointerEvent) => {
      this.ghostX.set(e.clientX - 28);
      this.ghostY.set(e.clientY - 28);
      this.updateHoverSlot(e.clientX, e.clientY);
    };

    this.pointerUp = (e: PointerEvent) => {
      this.finishDrag(e.clientX, e.clientY);
      this.cleanupDrag();
    };

    window.addEventListener('pointermove', this.pointerMove, { passive: false });
    window.addEventListener('pointerup', this.pointerUp, { passive: false });
  }

  private markCompatibleSlots(player: Player) {
  const slots = Array.from(document.querySelectorAll('.slot')) as HTMLElement[];
  for (const s of slots) {
    const idx = Number(s.getAttribute('data-slot'));
    s.classList.remove('drop-ok', 'drop-bad', 'drop-hover');
    if (!Number.isFinite(idx)) continue;

    if (this.canDropPlayerOnSlot(player, idx)) s.classList.add('drop-ok');
    else s.classList.add('drop-bad');
  }
}

  private cleanupDrag() {
    if (this.pointerMove) window.removeEventListener('pointermove', this.pointerMove);
    if (this.pointerUp) window.removeEventListener('pointerup', this.pointerUp);
    this.pointerMove = undefined;
    this.pointerUp = undefined;

    this.clearHover();
    this.clearAllSlotMarks();
this.dragging.set(null);
  }
  private clearAllSlotMarks() {
  document.querySelectorAll('.slot').forEach(n =>
    n.classList.remove('drop-ok', 'drop-bad', 'drop-hover')
  );
}

 private updateHoverSlot(x: number, y: number) {
  // rimuovi solo hover, non ok/bad
  document.querySelectorAll('.slot.drop-hover').forEach(n => n.classList.remove('drop-hover'));

  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const slot = el?.closest?.('.slot') as HTMLElement | null;
  if (!slot) return;

  slot.classList.add('drop-hover');
}


  private clearHover() {
    document.querySelectorAll('.slot.drop-hover').forEach(n => n.classList.remove('drop-hover'));
  }

 private finishDrag(x: number, y: number) {
  const p = this.dragging();
  if (!p) return;

  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const slotEl = el?.closest?.('.slot') as HTMLElement | null;
  if (!slotEl) return;

  const slotIndex = Number(slotEl.getAttribute('data-slot'));
  if (!Number.isFinite(slotIndex)) return;

  // ✅ blocca drop se ruolo non compatibile
  if (!this.canDropPlayerOnSlot(p, slotIndex)) {
    this.vibrate(35); // vibrazione più lunga = “errore”
    return;
  }

  this.swapIntoSlot(slotIndex, p);
  this.vibrate(18); // vibrazione breve = “ok”
}


  private swapIntoSlot(slotIndex: number, dragged: Player) {
    const starters = this.starters().slice();
    const bench = this.bench().slice();

    // se dragged era già tra i titolari, swap tra slot
    const fromSlot = starters.findIndex(p => p.id === dragged.id);
    if (fromSlot >= 0) {
      const tmp = starters[slotIndex];
      starters[slotIndex] = dragged;
      starters[fromSlot] = tmp;
      this.starters.set(starters);
      return;
    }

    // dragged viene dalla panca: sostituisce il titolare dello slot
    const replaced = starters[slotIndex];
    starters[slotIndex] = dragged;

    // rimuovi dragged dalla panchina
    const bIdx = bench.findIndex(p => p.id === dragged.id);
    if (bIdx >= 0) bench.splice(bIdx, 1);

    // il sostituito va in panca
    if (replaced && !bench.some(p => p.id === replaced.id)) {
      bench.unshift(replaced);
    }

    this.starters.set(starters);
    this.bench.set(bench);
  }

  private slotsSpec(mod: Module): { GK: number; DEF: number; MID: number; FWD: number } {
  switch (mod) {
    case '4-4-2': return { GK: 1, DEF: 4, MID: 4, FWD: 2 };
    case '4-3-3': return { GK: 1, DEF: 4, MID: 3, FWD: 3 };
    case '4-5-1': return { GK: 1, DEF: 4, MID: 5, FWD: 1 };
    case '3-4-3': return { GK: 1, DEF: 3, MID: 4, FWD: 3 };
    case '3-5-2': return { GK: 1, DEF: 3, MID: 5, FWD: 2 };
    case '5-3-2': return { GK: 1, DEF: 5, MID: 3, FWD: 2 };
    case '5-4-1': return { GK: 1, DEF: 5, MID: 4, FWD: 1 };
    default: return { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  }
}

private expectedRoleForSlot(mod: Module, slotIndex: number): Role | null {
  const spec = this.slotsSpec(mod);

  // Slot 0 è sempre il portiere
  if (slotIndex === 0) return 'GK';

  // Calcolo corretto delle zone
  const defStart = 1;
  const defEnd = defStart + spec.DEF - 1;

  const midStart = defEnd + 1;
  const midEnd = midStart + spec.MID - 1;

  const fwdStart = midEnd + 1;
  const fwdEnd = fwdStart + spec.FWD - 1;

  if (slotIndex >= defStart && slotIndex <= defEnd) return 'DEF';
  if (slotIndex >= midStart && slotIndex <= midEnd) return 'MID';
  if (slotIndex >= fwdStart && slotIndex <= fwdEnd) return 'FWD';

  return null;
}


private canDropPlayerOnSlot(player: Player, slotIndex: number): boolean {
  const expected = this.expectedRoleForSlot(this.module(), slotIndex);
  return expected ? player.role === expected : false;
}

private vibrate(ms: number) {
  try {
    if ('vibrate' in navigator) (navigator as any).vibrate(ms);
  } catch {}
}
  constructor(
    private squadService: SquadService,
    private formationService: FormationService
  ) {}

  onModuleChange(ev: CustomEvent) {
    const v = (ev as any).detail?.value as string;
    if (this.MODULES.includes(v as Module)) this.module.set(v as Module);
    const p = this.dragging();
if (p) this.markCompatibleSlots(p);
  }

  /** Drop dalla panchina o dal campo su uno slot del campo */
  onDropToSlot(slotIndex: number, dragged: Player) {
    const starters = this.starters().slice();
    const bench = this.bench().slice();

    // se il giocatore trascinato è già in campo, lo togliamo dalla sua vecchia posizione
    const fromSlot = starters.findIndex(p => p.id === dragged.id);
    if (fromSlot >= 0) starters[fromSlot] = starters[slotIndex];

    // swap slotIndex <-> dragged
    const replaced = starters[slotIndex] ?? null;
    starters[slotIndex] = dragged;

    // rimuovi dragged dalla panchina se presente
    const bIdx = bench.findIndex(p => p.id === dragged.id);
    if (bIdx >= 0) bench.splice(bIdx, 1);

    // metti il sostituito in panchina (se esiste e non è già lì)
    if (replaced && !bench.some(p => p.id === replaced.id)) {
      bench.unshift(replaced);
    }

    this.starters.set(starters);
    this.bench.set(bench);
  }

  /** Drop sul contenitore panchina: se trascini un titolare lo rimandi in panca */
  
}
