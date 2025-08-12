export interface CalcResult {
  apMixedCtNet: number;       // ct/kWh netto
  apMixedEur: number;         // €/kWh brutto/netto (wg includeVat)
  gpEurForPeriod: number;     // €
  energyCostEur: number;      // €
  totalCostEur: number;       // €
  totalConsumptionKwh: number;
}
