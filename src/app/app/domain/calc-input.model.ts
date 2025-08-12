import { Period, Tariff } from './tariff.model';

export interface CalcInput {
  consumptionKwh: number;
  period?: Period;       // 'year' | 'month' (domyślnie 'year')
  includeVat?: boolean;  // domyślnie true
  tariff?: Tariff;       // domyślnie 2023
}
