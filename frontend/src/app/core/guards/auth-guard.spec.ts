import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('allows authenticated user', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = guard.canActivate({} as ActivatedRouteSnapshot, { url: '/school' } as RouterStateSnapshot);

    expect(result).toBeTrue();
  });

  it('redirects unauthenticated user', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = guard.canActivate({} as ActivatedRouteSnapshot, { url: '/school' } as RouterStateSnapshot);

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });
});
