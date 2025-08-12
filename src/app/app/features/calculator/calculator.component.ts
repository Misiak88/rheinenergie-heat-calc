import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalcService } from '../../core/calc.service';

type InputMode = 'total' | 'meters';

interface MeterForm {
  name: FormControl<string>;
  start: FormControl<number | null>;
  end: FormControl<number | null>;
}

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <form [formGroup]="form" (ngSubmit)="onCalc()" class="stack">
    <fieldset>
      <legend>Wejście</legend>
      <label><input type="radio" value="total" formControlName="mode"> Zużycie łączne (kWh)</label>
      <label><input type="radio" value="meters" formControlName="mode"> Z liczników (pokoje)</label>
    </fieldset>

    <ng-container *ngIf="form.value.mode === 'total'; else metersTpl">
      <label>
        Zużycie roczne [kWh]
        <input type="number" formControlName="consumptionTotal" min="0" />
      </label>
    </ng-container>

    <ng-template #metersTpl>
      <div formArrayName="meters" class="meters">
        <div *ngFor="let m of meters.controls; let i = index" [formGroupName]="i" class="meter">
          <input type="text" formControlName="name" placeholder="Nazwa (np. Pokój 1)" />
          <input type="number" formControlName="start" placeholder="Odczyt start" />
          <input type="number" formControlName="end" placeholder="Odczyt koniec" />
          <button type="button" (click)="removeMeter(i)">Usuń</button>
          <small *ngIf="meterError(i)" class="err">{{ meterError(i) }}</small>
        </div>
      </div>
      <button type="button" (click)="addMeter()">+ Dodaj licznik</button>

      <p><strong>Suma zużycia z liczników:</strong> {{ metersConsumption() | number:'1.0-2' }} kWh</p>
    </ng-template>

    <label>
      Okres
      <select formControlName="period">
        <option value="year">Rok</option>
        <option value="month">Miesiąc</option>
      </select>
    </label>

    <label>
      <input type="checkbox" formControlName="includeVat" />
      Uwzględnij VAT (19%)
    </label>

    <button type="submit" [disabled]="formInvalid()">Oblicz</button>
  </form>

  <ng-container *ngIf="result() as r">
    <hr />
    <h3>Wynik</h3>
    <p>AP (mix) netto: <strong>{{ r.apMixedCtNet | number:'1.2-2' }}</strong> ct/kWh</p>
    <p>AP ({{ form.value.includeVat ? 'brutto' : 'netto' }}): <strong>{{ r.apMixedEur | number:'1.4-4' }}</strong> €/kWh</p>
    <p>GP za okres: <strong>{{ r.gpEurForPeriod | number:'1.2-2' }}</strong> €</p>
    <p>Koszt energii ({{ r.totalConsumptionKwh | number:'1.0-0' }} kWh): <strong>{{ r.energyCostEur | number:'1.2-2' }}</strong> €</p>
    <h2>Suma: {{ r.totalCostEur | number:'1.2-2' }} €</h2>
  </ng-container>
  `,
  styles: [`
    .stack { display:grid; gap:.75rem; max-width:720px; padding:1rem; }
    fieldset { border:1px solid #ddd; border-radius:8px; padding:.5rem .75rem; }
    input, select, button { padding:.5rem; }
    .meters { display:grid; gap:.5rem; }
    .meter { display:grid; grid-template-columns: 1.4fr 1fr 1fr auto; gap:.5rem; align-items:center; }
    .err { color:#b00020; }
  `]
})
export class CalculatorComponent {
  form = this.fb.group({
    mode: ['total' as InputMode, Validators.required],
    consumptionTotal: [null as number | null],
    period: ['year', Validators.required],
    includeVat: [true],
    meters: this.fb.array<FormGroup<MeterForm>>([])
  });

  result = signal<ReturnType<CalcService['compute']> | null>(null);

  constructor(private fb: FormBuilder, private calc: CalcService) {
    this.addMeter('Pokój 1');
    this.addMeter('Pokój 2');

    // dynamiczna walidacja dla trybu "total"
    effect(() => {
      const control = this.form.get('consumptionTotal');
      if (this.form.value.mode === 'total') {
        control?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        control?.clearValidators();
        control?.setValue(null);
      }
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get meters() { return this.form.get('meters') as FormArray<FormGroup<MeterForm>>; }

  addMeter(name = '') {
    const g = this.fb.group<MeterForm>({
      name: this.fb.control<string>(name, { nonNullable: true }),
      start: this.fb.control<number | null>(null),
      end: this.fb.control<number | null>(null),
    });
    this.meters.push(g);
  }

  removeMeter(i: number) {
    this.meters.removeAt(i);
  }

  meterError(i: number): string | null {
    const g = this.meters.at(i);
    const s = g.get('start')!.value;
    const e = g.get('end')!.value;
    if (s == null || e == null) return null;
    if (e < s) return 'Odczyt końcowy musi być ≥ początkowy';
    return null;
  }

  metersConsumption(): number {
    return this.meters.controls.reduce((sum, g) => {
      const s = g.get('start')!.value ?? 0;
      const e = g.get('end')!.value ?? 0;
      const diff = e - s;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
  }

  formInvalid(): boolean {
    if (this.form.value.mode === 'total') {
      const c = this.form.get('consumptionTotal')?.value ?? null;
      return this.form.invalid || c === null || c < 0;
    }
    // meters mode: sprawdź lokalne błędy
    const hasNeg = this.meters.controls.some(g => {
      const s = g.get('start')!.value ?? null;
      const e = g.get('end')!.value ?? null;
      return s !== null && e !== null && e < s;
    });
    return this.form.invalid || hasNeg;
  }

  onCalc() {
    if (this.formInvalid()) return;
    const v = this.form.value;
    const totalKwh = v.mode === 'total'
      ? Number(v.consumptionTotal ?? 0)
      : this.metersConsumption();

    this.result.set(this.calc.compute({
      consumptionKwh: totalKwh,
      period: (v.period as 'year' | 'month') ?? 'year',
      includeVat: !!v.includeVat,
    }));
  }
}
