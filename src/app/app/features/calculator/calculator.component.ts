import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
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
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent {
  form!: FormGroup;
  result = signal<ReturnType<CalcService['compute']> | null>(null);

  constructor(private fb: FormBuilder, private calc: CalcService) {
    // inicjalizacja formularza W KONSTRUKTORZE (żeby nie używać this.fb przed inicjalizacją)
    this.form = this.fb.group({
      mode: ['total' as InputMode, Validators.required],
      consumptionTotal: [null as number | null],
      period: ['year', Validators.required],
      includeVat: [true],
      meters: this.fb.array<FormGroup<MeterForm>>([])
    });

    // startowo 2 liczniki
    this.addMeter('Pokój 1');
    this.addMeter('Pokój 2');

    // dynamiczna walidacja pola "consumptionTotal" zależnie od trybu
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

  get meters() {
    return this.form.get('meters') as FormArray<FormGroup<MeterForm>>;
  }

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
    // meters mode: lokalna weryfikacja
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
