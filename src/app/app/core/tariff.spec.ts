import { TestBed } from '@angular/core/testing';

import { Tariff } from './tariff';

describe('Tariff', () => {
  let service: Tariff;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tariff);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
