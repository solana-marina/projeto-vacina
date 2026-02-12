import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { RoleGuard } from './role-guard';
import { AuthService } from '../services/auth';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasAnyRole']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(RoleGuard);
  });

  it('allows when role matches', () => {
    authServiceSpy.hasAnyRole.and.returnValue(true);

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);

    expect(result).toBeTrue();
  });

  it('blocks when role does not match', () => {
    authServiceSpy.hasAnyRole.and.returnValue(false);

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });
});
