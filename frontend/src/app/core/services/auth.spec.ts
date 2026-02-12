import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth';
import { TokenStorageService } from './token-storage';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, TokenStorageService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores session after login', () => {
    service.login('admin@vacina.local', 'Admin@123').subscribe();

    const req = httpMock.expectOne('/api/auth/token/');
    expect(req.request.method).toBe('POST');
    req.flush({
      access: 'a-token',
      refresh: 'r-token',
      role: 'ADMIN',
      full_name: 'Admin',
      email: 'admin@vacina.local',
      school_id: null,
      user_id: 1,
    });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentSession()?.role).toBe('ADMIN');
  });

  it('supports role checks and logout', () => {
    service.login('admin@vacina.local', 'Admin@123').subscribe();

    const req = httpMock.expectOne('/api/auth/token/');
    req.flush({
      access: 'a-token',
      refresh: 'r-token',
      role: 'ADMIN',
      full_name: 'Admin',
      email: 'admin@vacina.local',
      school_id: null,
      user_id: 1,
    });

    expect(service.hasAnyRole(['ADMIN'])).toBeTrue();
    expect(service.hasAnyRole(['HEALTH_PRO'])).toBeFalse();
    expect(service.getAccessToken()).toBe('a-token');

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentSession()).toBeNull();
  });
});
