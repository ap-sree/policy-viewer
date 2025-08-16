import { TestBed } from '@angular/core/testing';

import { PolicyCompare } from './policy-compare';

describe('PolicyCompare', () => {
  let service: PolicyCompare;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolicyCompare);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
