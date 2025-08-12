import { TestBed } from '@angular/core/testing';

import { Calc } from './calc';

describe('Calc', () => {
  let service: Calc;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Calc);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
