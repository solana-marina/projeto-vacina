import { TestBed } from '@angular/core/testing';

import { TokenStorageService } from './token-storage';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [TokenStorageService],
    });
    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads tokens/session', () => {
    service.save('acc', 'ref', {
      userId: 1,
      fullName: 'User',
      email: 'u@test',
      role: 'ADMIN',
      schoolId: null,
    });

    expect(service.getAccessToken()).toBe('acc');
    expect(service.getRefreshToken()).toBe('ref');
    expect(service.getSession()?.userId).toBe(1);
  });

  it('clears stored values', () => {
    service.save('acc', 'ref', {
      userId: 1,
      fullName: 'User',
      email: 'u@test',
      role: 'ADMIN',
      schoolId: null,
    });

    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getSession()).toBeNull();
  });
});
