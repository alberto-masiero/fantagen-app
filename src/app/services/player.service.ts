import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { map, Observable } from 'rxjs';
import type { Player, Trend } from '../models/player.model';
import { TeamLogoService } from './teamLogo.service';

type Role = 'GK' | 'DEF' | 'MID' | 'FWD';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(private http: HttpClient, private teamLogos: TeamLogoService) {}

  loadPlayersFromExcel(assetPath = 'assets/players.xlsx'): Observable<Player[]> {
    return this.http.get(assetPath, { responseType: 'arraybuffer' }).pipe(
      map((buffer) => {
        const data = new Uint8Array(buffer);
        const wb = XLSX.read(data, { type: 'array' });

        const sheetName = wb.SheetNames.includes('Players') ? 'Players' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) return [];

        // 1) Trova la riga intestazione (quella che contiene "Id", "Nome", "Squadra", "Rm")
        const headerRowIdx0 = this.findHeaderRow(ws); // 0-based
        // range = headerRowIdx0 => sheet_to_json usa quella riga come header
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          defval: '',
          range: headerRowIdx0,
        });

        // utils
        const toNumberIT = (v: unknown): number => {
          if (typeof v === 'number') return v;
          const s = String(v ?? '').trim();
          if (!s) return 0;
          // "6,34" -> 6.34 ; supporta anche "6.34"
          const normalized = s.replace(/\./g, '').replace(',', '.');
          const n = Number(normalized);
          return Number.isFinite(n) ? n : 0;
        };
        const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

        const parseTrend = (v: unknown): Trend => {
          const s = String(v ?? '').trim();
          if (s === '+' || s === '-' || s === '=') return s as Trend;
          // a volte si trova "↑" "↓" ecc.
          if (s === '↑') return '+';
          if (s === '↓') return '-';
          return '=';
        };

   const parseTit = (v: unknown): number | 'I' | 'S' | undefined => {
  if (v === null || v === undefined) return undefined;

  // se arriva già come numero (XLSX spesso fa così)
  if (typeof v === 'number') {
    let n = v;

    // se è in formato 0.7992 (percentuale excel) => 79.92
    if (n > 0 && n <= 1) n = n * 100;

    // se per qualche motivo è 7992 (errore pregresso o formattazioni strane) => 79.92
    if (n > 100 && n <= 10000) n = n / 100;

    n = Math.max(0, Math.min(100, Math.round(n)));
    return n;
  }

  // stringhe
  let s = String(v).trim().toUpperCase();
  if (!s) return undefined;

  if (s === 'I' || s === 'S') return s as 'I' | 'S';

  // "79.92%" o "79,92%"
  if (s.endsWith('%')) s = s.slice(0, -1).trim();

  // converti virgola in punto, senza togliere i punti (che qui sono decimali)
  const n0 = Number(s.replace(',', '.'));
  if (!Number.isFinite(n0)) return undefined;

  let n = n0;
  if (n > 0 && n <= 1) n = n * 100;
  if (n > 100 && n <= 10000) n = n / 100;

  n = Math.max(0, Math.min(100, Math.round(n)));
  return n;
};


       type Role = 'GK' | 'DEF' | 'MID' | 'FWD';

const mapRole = (rVal: unknown, rmVal: unknown): Role | null => {
  const r = String(rVal ?? '').trim().toUpperCase();      // P/D/C/A
  const rm = String(rmVal ?? '').trim().toLowerCase();    // por, dd, ds, dc, e, m, c, t, w, a, pc...

  // 1) Prima prova con colonna R (più affidabile)
  if (r === 'P') return 'GK';
  if (r === 'D') return 'DEF';
  if (r === 'C') return 'MID';
  if (r === 'A') return 'FWD';

  // 2) Fallback con colonna Rm (sottoruoli)
  if (rm === 'por' || rm.startsWith('por')) return 'GK';

  // difensori: dif / dd / ds / dc
  if (rm === 'dif' || rm === 'dd' || rm === 'ds' || rm === 'dc') return 'DEF';

  // centrocampisti: cen / e / m / c / t
  if (rm === 'cen' || rm === 'e' || rm === 'm' || rm === 'c' || rm === 't') return 'MID';

  // attaccanti: att / w / a / pc
  if (rm === 'att' || rm === 'w' || rm === 'a' || rm === 'pc') return 'FWD';

  return null;
};


        const get = (r: Record<string, any>, ...keys: string[]) => {
          for (const k of keys) {
            const val = r[k];
            if (val !== undefined && val !== null && String(val).trim() !== '') return val;
          }
          return '';
        };

        const players: Player[] = rows
          .map((r) => {
            // intestazioni come nel tuo file: Id, Nome, Squadra, Rm, Fm, Mv, Pv...
            const id = Number(get(r, 'Id', 'ID', 'id'));
            const name = String(get(r, 'Nome', 'nome')).trim();
            const team = String(get(r, 'Squadra', 'squadra')).trim();

           const role = mapRole(get(r, 'R', 'r'), get(r, 'Rm', 'RM', 'rm'));
if (!role) return null;

            // rating: preferisci Fm (fantamedia), fallback Mv
            const fm = toNumberIT(get(r, 'Fm', 'FM', 'fm'));
            const mv = toNumberIT(get(r, 'Mv', 'MV', 'mv'));
            const rating = fm > 0 ? fm : mv;
const teamLogo = this.teamLogos.getLogoPath(team) ?? undefined;
  const trend = parseTrend(get(r, 'trend', 'Trend', 'TREND'));
            const Tit = parseTit(get(r, 'Tit', 'TIT', 'tit'));
            if (!id || !name) return null;

            const p: Player = { id, name, team, role, rating, teamLogo, trend, Tit };
            return p;
          })
          .filter((p): p is Player => !!p);

        players.sort((a, b) => a.role.localeCompare(b.role) || b.rating - a.rating);
        return players;
      })
    );
  }

  /**
   * Cerca nelle prime righe un header che contenga almeno:
   * "Id", "Nome", "Squadra", "Rm"
   */
  private findHeaderRow(ws: XLSX.WorkSheet): number {
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1');
    const maxScan = Math.min(range.e.r, 30); // scansiona max prime 31 righe

    const cellValue = (r: number, c: number) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      return String(cell?.v ?? '').trim();
    };

    for (let r = range.s.r; r <= maxScan; r++) {
      // controlla prime ~10 colonne
      const rowVals = [];
      for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 12); c++) {
        rowVals.push(cellValue(r, c));
      }

      const hasId = rowVals.some(v => v.toLowerCase() === 'id');
      const hasNome = rowVals.some(v => v.toLowerCase() === 'nome');
      const hasSquadra = rowVals.some(v => v.toLowerCase() === 'squadra');
      const hasRm = rowVals.some(v => v.toLowerCase() === 'rm');

      if (hasId && hasNome && hasSquadra && hasRm) {
        return r; // 0-based
      }
    }

    // fallback: 0 (prima riga)
    return 0;
  }
}
