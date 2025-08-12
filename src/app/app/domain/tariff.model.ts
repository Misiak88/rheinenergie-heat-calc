export type Period = 'year' | 'month';

export interface Tariff {
  vat: number;         // np. 0.19
  gpNetYear: number;   // €/rok netto
  apKesselCt: number;  // ct/kWh netto
  apBhkwCt: number;    // ct/kWh netto
  shareKessel: number; // 0..1
  shareBhkw: number;   // 0..1
}
