export type Role = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Trend = '+' | '-' | '=';

export interface Player {
  id: number;
  name: string;
  team: string;
  role: Role;

  /**
   * rating = KILLER SCORE (non più solo Fm)
   */
  rating: number;

  teamLogo?: string;

  // ===== colonne excel =====
  Pv: number;        // presenze
  Mv: number;        // media voto
  Fm: number;        // fantamedia
  FmP: number;       // fantavoto giornata precedente

  Gf: number;        // gol fatti
  Gs: number;        // gol subiti (solo portieri, 0 per altri)

  Rp: number;        // rigori parati
  Rc: number;        // rigori calciati
  Rplus: number;     // R+ rigori segnati
  Rminus: number;    // R- rigori sbagliati

  Ass: number;       // assist
  Amm: number;       // ammonizioni
  Esp: number;       // espulsioni
  Au: number;        // autogol

  trend: Trend;      // '+', '-', '='
  Tit?: number | 'I' | 'S'; // 0..100 oppure I/S
  Avversario: number; // difficoltà 1..5
}
