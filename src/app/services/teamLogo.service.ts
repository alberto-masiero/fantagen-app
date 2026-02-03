import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeamLogoService {
  private norm(s?: string): string {
    return (s ?? '')
      .trim()
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}\s-]/gu, '');
  }

  // Gestisce celle strane tipo "Verona Torino" -> prova prima match esatto,
  // poi se contiene più parole prova a matchare per "contains"
  private resolveKey(team?: string): string | null {
    const k = this.norm(team);
    if (!k) return null;
    if (this.map[k]) return k;

    // tentativo "contains" (utile per valori sporchi tipo "Verona Torino")
    const candidates = Object.keys(this.map);
    const found = candidates.find(c => k.includes(c));
    return found ?? null;
  }

  // File che metterai in src/assets/teams/
  // (io consiglio SVG: leggeri, nitidi, perfetti nel badge)
  private map: Record<string, string> = {
    'milan': 'milan.svg',
    'roma': 'roma.svg',
    'atalanta': 'atalanta.svg',
    'napoli': 'napoli.svg',
    'como': 'como.svg',
    'lazio': 'lazio.svg',
    'juventus': 'juventus.svg',
    'lecce': 'lecce.svg',
    'cremonese': 'cremonese.svg',
    'inter': 'inter.svg',
    'cagliari': 'cagliari.svg',
    'sassuolo': 'sassuolo.svg',
    'fiorentina': 'fiorentina.svg',
    'parma': 'parma.svg',
    'udinese': 'udinese.svg',
    'genoa': 'genoa.svg',
    'pisa': 'pisa.svg',
    'verona': 'verona.svg',
    'torino': 'torino.svg',
    'bologna': 'bologna.svg',
    // alias utili (se nel file compaiono varianti)
    'hellas verona': 'verona.svg',
    'internazionale': 'inter.svg',
    'ac milan': 'milan.svg',
    'fc inter': 'inter.svg',
  };

  getLogoPath(team?: string): string | null {
    const key = this.resolveKey(team);
    if (!key) return null;
    return `assets/teams/${this.map[key]}`;
  }
}
