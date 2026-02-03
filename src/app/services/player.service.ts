import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { map, Observable } from 'rxjs';
import type { Player, Trend, Role } from '../models/player.model';
import { TeamLogoService } from './teamLogo.service';

type RoleP = 'P' | 'D' | 'C' | 'A';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(private http: HttpClient, private teamLogos: TeamLogoService) {}

  // =========================
  // KILLER SCORING (NO SOTTORUOLI)
  // =========================
  private readonly W = {
    P: { baseFm: 0.78, mv: 0.06, form: 0.10, upside: 0.00, pen: 0.00, dis: 0.08, gs: 0.24, rp: 0.10, trend: 0.02 },
    D: { baseFm: 0.60, mv: 0.12, form: 0.10, upside: 0.14, pen: 0.03, dis: 0.14, gs: 0.00, rp: 0.00, trend: 0.02 },
    C: { baseFm: 0.54, mv: 0.08, form: 0.14, upside: 0.18, pen: 0.07, dis: 0.11, gs: 0.00, rp: 0.00, trend: 0.02 },
    A: { baseFm: 0.50, mv: 0.06, form: 0.16, upside: 0.22, pen: 0.08, dis: 0.08, gs: 0.00, rp: 0.00, trend: 0.02 },
  } as const;

  private clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }
  private clamp01(n: number) {
    return this.clamp(n, 0, 1);
  }

  private shrink(avg: number, n: number, leagueAvg: number, k = 8) {
    const w = n / (n + k);
    return w * avg + (1 - w) * leagueAvg;
  }

  private formTerm(fmP: number, baseFm: number) {
    return Math.tanh((fmP - baseFm) / 2.0); // [-1..+1]
  }

  private trendBoostNum(tr: Trend) {
    return tr === '+' ? 1 : tr === '-' ? -1 : 0;
  }

  private titMultiplier(tit?: number | 'I' | 'S') {
    // gestione killer di I/S
    if (tit === 'I') return 0.15; // infortunato -> quasi fuori
    if (tit === 'S') return 0.05; // squalificato -> fuori
    const p = this.clamp01(((tit as number) ?? 100) / 100);
    return 0.25 + 0.75 * Math.pow(p, 1.6);
  }

  private oppFactor(diff1to5: number) {
    const d = this.clamp(diff1to5 || 3, 1, 5);
    const x = (3 - d) / 2;      // +1..-1
    return Math.tanh(x * 1.25); // [-1..+1]
  }

  private oppMultiplier(role: RoleP, diff: number) {
    const t = this.oppFactor(diff);
    const amp = role === 'A' ? 0.14 : role === 'C' ? 0.10 : role === 'D' ? 0.06 : 0.08;
    return 1 + amp * t;
  }

  private mapToRoleP(role: Role): RoleP {
    if (role === 'GK') return 'P';
    if (role === 'DEF') return 'D';
    if (role === 'MID') return 'C';
    return 'A';
  }

  private computeKillerScore(p: Player, leagueAvgFm: number, leagueAvgMv: number): number {
    const roleP = this.mapToRoleP(p.role);
    const w = this.W[roleP];

    const pv = p.Pv > 0 ? p.Pv : 0;
    if (!pv) return -999;

    const baseFm = this.shrink(p.Fm, pv, leagueAvgFm, 8);
    const baseMv = this.shrink(p.Mv, pv, leagueAvgMv, 8);

    const form = this.formTerm(p.FmP || baseFm, baseFm);
    const formScaled = 6 + 2 * form;

    const upsidePerMatch = (p.Gf * 3 + p.Ass) / pv;

    const disPerMatch = (p.Amm * 0.5 + p.Esp + p.Au * 2.0) / pv;

    const penPerMatch = ((p.Rplus * 3) + (p.Rminus * -3)) / pv;

    const gsPerMatch = roleP === 'P' ? (p.Gs / pv) : 0;
    const rpPerMatch = roleP === 'P' ? ((p.Rp * 3) / pv) : 0;

    let s =
      w.baseFm * baseFm +
      w.mv     * baseMv +
      w.form   * formScaled +
      w.upside * upsidePerMatch +
      w.pen    * penPerMatch +
      w.rp     * rpPerMatch -
      w.dis    * disPerMatch -
      w.gs     * gsPerMatch +
      w.trend  * this.trendBoostNum(p.trend);

    // matchup avversario + titolarità killer
    s *= this.oppMultiplier(roleP, p.Avversario);
    s *= this.titMultiplier(p.Tit);

    // reliability soft (poche presenze => piccolo freno)
    const rel = Math.tanh(pv / 8);
    s *= (0.90 + 0.10 * rel);

    return s;
  }

  // =========================
  // EXCEL LOADER
  // =========================
  loadPlayersFromExcel(assetPath = 'assets/players.xlsx'): Observable<Player[]> {
    return this.http.get(assetPath, { responseType: 'arraybuffer' }).pipe(
      map((buffer) => {
        const data = new Uint8Array(buffer);
        const wb = XLSX.read(data, { type: 'array' });

        const sheetName = wb.SheetNames.includes('Players') ? 'Players' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) return [];

        const headerRowIdx0 = this.findHeaderRow(ws);
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          defval: '',
          range: headerRowIdx0,
        });

        // --- utils parsing ---
        const toNumberIT = (v: unknown): number => {
          if (typeof v === 'number') return v;
          const s = String(v ?? '').trim();
          if (!s) return 0;
          const normalized = s.replace(/\./g, '').replace(',', '.'); // "6,34" -> 6.34
          const n = Number(normalized);
          return Number.isFinite(n) ? n : 0;
        };

        const parseTrend = (v: unknown): Trend => {
          const s = String(v ?? '').trim();
          if (s === '+' || s === '-' || s === '=') return s as Trend;
          if (s === '↑') return '+';
          if (s === '↓') return '-';
          return '=';
        };

        const parseTit = (v: unknown): number | 'I' | 'S' | undefined => {
          if (v === null || v === undefined) return undefined;

          if (typeof v === 'number') {
            let n = v;
            if (n > 0 && n <= 1) n = n * 100;
            if (n > 100 && n <= 10000) n = n / 100;
            n = Math.max(0, Math.min(100, Math.round(n)));
            return n;
          }

          let s = String(v).trim().toUpperCase();
          if (!s) return undefined;
          if (s === 'I' || s === 'S') return s as 'I' | 'S';

          if (s.endsWith('%')) s = s.slice(0, -1).trim();
          const n0 = Number(s.replace(',', '.'));
          if (!Number.isFinite(n0)) return undefined;

          let n = n0;
          if (n > 0 && n <= 1) n = n * 100;
          if (n > 100 && n <= 10000) n = n / 100;

          n = Math.max(0, Math.min(100, Math.round(n)));
          return n;
        };

        // SOLO RUOLO R (P/D/C/A) -> GK/DEF/MID/FWD
        const mapRole = (rVal: unknown): Role | null => {
          const r = String(rVal ?? '').trim().toUpperCase();
          if (r === 'P') return 'GK';
          if (r === 'D') return 'DEF';
          if (r === 'C') return 'MID';
          if (r === 'A') return 'FWD';
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
            const id = Number(get(r, 'Id', 'ID', 'id'));
            const name = String(get(r, 'Nome', 'nome')).trim();
            const team = String(get(r, 'Squadra', 'squadra')).trim();
            const role = mapRole(get(r, 'R', 'r'));

            if (!id || !name || !team || !role) return null;

            const Pv = Math.max(0, Math.round(toNumberIT(get(r, 'Pv', 'PV', 'pv'))));
            const Mv = toNumberIT(get(r, 'Mv', 'MV', 'mv'));
            const Fm = toNumberIT(get(r, 'Fm', 'FM', 'fm'));
            const FmP = toNumberIT(get(r, 'FmP', 'FMP', 'fmp'));

            const Gf = Math.max(0, Math.round(toNumberIT(get(r, 'Gf', 'GF', 'gf'))));
            const Gs = Math.max(0, Math.round(toNumberIT(get(r, 'Gs', 'GS', 'gs')))); // 0 per non P (ok)

            const Rp = Math.max(0, Math.round(toNumberIT(get(r, 'Rp', 'RP', 'rp'))));
            const Rc = Math.max(0, Math.round(toNumberIT(get(r, 'Rc', 'RC', 'rc'))));

            // nel tuo excel: "R+" e "R-"
            const Rplus = Math.max(0, Math.round(toNumberIT(get(r, 'R+', 'Rplus', 'r+'))));
            const Rminus = Math.max(0, Math.round(toNumberIT(get(r, 'R-', 'Rminus', 'r-'))));

            const Ass = Math.max(0, Math.round(toNumberIT(get(r, 'Ass', 'ASS', 'ass'))));
            const Amm = Math.max(0, Math.round(toNumberIT(get(r, 'Amm', 'AMM', 'amm'))));
            const Esp = Math.max(0, Math.round(toNumberIT(get(r, 'Esp', 'ESP', 'esp'))));
            const Au  = Math.max(0, Math.round(toNumberIT(get(r, 'Au', 'AU', 'au'))));

            const Avversario = this.clamp(Math.round(toNumberIT(get(r, 'Avversario', 'AVVERSARIO', 'avversario'))), 1, 5);

            const trend = parseTrend(get(r, 'trend', 'Trend', 'TREND'));
            const Tit = parseTit(get(r, 'Tit', 'TIT', 'tit'));

            const teamLogo = this.teamLogos.getLogoPath(team) ?? undefined;

            const p: Player = {
              id,
              name,
              team,
              role,
              rating: 0, // calcolato dopo
              teamLogo,

              Pv, Mv, Fm, FmP,
              Gf, Gs,
              Rp, Rc, Rplus, Rminus,
              Ass, Amm, Esp, Au,
              trend,
              Tit,
              Avversario,
            };

            return p;
          })
          .filter((p): p is Player => !!p);

        // medie lega (idealmente su dataset completo; qui ok per partire)
        const valid = players.filter(p => p.Pv > 0);
        const leagueAvgFm = valid.reduce((s, p) => s + p.Fm, 0) / Math.max(1, valid.length);
        const leagueAvgMv = valid.reduce((s, p) => s + p.Mv, 0) / Math.max(1, valid.length);

        // rating = killer score
        for (const p of players) {
          p.rating = this.computeKillerScore(p, leagueAvgFm, leagueAvgMv);
        }

        players.sort((a, b) => a.role.localeCompare(b.role) || b.rating - a.rating);
        return players;
      })
    );
  }

  /**
   * Header row: cerca Id + Nome + Squadra + Rm (nel tuo file c'è)
   */
  private findHeaderRow(ws: XLSX.WorkSheet): number {
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1');
    const maxScan = Math.min(range.e.r, 30);

    const cellValue = (r: number, c: number) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      return String(cell?.v ?? '').trim();
    };

    for (let r = range.s.r; r <= maxScan; r++) {
      const rowVals: string[] = [];
      for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 12); c++) {
        rowVals.push(cellValue(r, c));
      }

      const hasId = rowVals.some(v => v.toLowerCase() === 'id');
      const hasNome = rowVals.some(v => v.toLowerCase() === 'nome');
      const hasSquadra = rowVals.some(v => v.toLowerCase() === 'squadra');
      const hasRm = rowVals.some(v => v.toLowerCase() === 'rm');

      if (hasId && hasNome && hasSquadra && hasRm) return r;
    }
    return 0;
  }
}
