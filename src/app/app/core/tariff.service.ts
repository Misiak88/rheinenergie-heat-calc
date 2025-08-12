import { Injectable } from '@angular/core';
import { Tariff } from '../domain/tariff.model';

@Injectable({ providedIn: 'root' })
export class TariffService {
  readonly tariff2023: Tariff = {
    vat: 0.19,
    gpNetYear: 29100.89,
    apKesselCt: 19.30,
    apBhkwCt: 15.49,
    shareKessel: 0.6466,
    shareBhkw: 0.3534,
  };

  getDefault(): Tariff {
    return this.tariff2023;
  }
}
