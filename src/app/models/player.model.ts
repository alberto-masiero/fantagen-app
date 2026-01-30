export type Role = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: number;
  name: string;
  team?: string;
  role: Role;
  rating: number; // usato per selezionare i migliori
  teamLogo?: string
}
