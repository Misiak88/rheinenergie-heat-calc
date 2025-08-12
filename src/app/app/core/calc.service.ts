import { Injectable } from '@angular/core';
import { CalcInput } from '../domain/calc-input.model';
import { CalcResult } from '../domain/calc-result.model';
import { Tariff } from '../domain/tariff.model';
import { TariffService } from './tariff.service';

@Injectable({ providedIn: 'root' })
export class CalcService {
  constructor(private tariffs: TariffService) {}

  private mixedApCtNet(t: Tariff): number {
    return t.apKesselCt * t.shareKessel + t.apBhkwCt * t.shareBhkw;
  }

  compute(input: CalcInput): CalcResult {
    const t = input.tariff ?? this.tariffs.getDefault();
    const period = input.period ?? 'year';
    const includeVat = input.includeVat ?? true;

    const apMixedCt = this.mixedApCtNet(t);
    const vatFactor = includeVat ? (1 + t.vat) : 1;

    const apMixedEur = (apMixedCt / 100) * vatFactor;
    const gpEurYear = t.gpNetYear * vatFactor;
    const gpEurForPeriod = period === 'month' ? gpEurYear / 12 : gpEurYear;

    const energyCostEur = input.consumptionKwh * apMixedEur;
    const totalCostEur = gpEurForPeriod + energyCostEur;

    return {
      apMixedCtNet: +apMixedCt.toFixed(2),
      apMixedEur: +apMixedEur.toFixed(4),
      gpEurForPeriod: +gpEurForPeriod.toFixed(2),
      energyCostEur: +energyCostEur.toFixed(2),
      totalCostEur: +totalCostEur.toFixed(2),
      totalConsumptionKwh: +input.consumptionKwh,
    };
  }
}
