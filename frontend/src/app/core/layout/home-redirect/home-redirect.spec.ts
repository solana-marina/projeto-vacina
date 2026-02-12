import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';
import { HomeRedirect } from './home-redirect';

describe('HomeRedirect', () => {
  let fixture: ComponentFixture<HomeRedirect>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentSession']);

    await TestBed.configureTestingModule({
      declarations: [HomeRedirect],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();
  });

  function createComponent(): HomeRedirect {
    fixture = TestBed.createComponent(HomeRedirect);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  it('redirects to login when there is no session', () => {
    authSpy.getCurrentSession.and.returnValue(null);

    createComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('redirects admin to /admin', () => {
    authSpy.getCurrentSession.and.returnValue({
      userId: 1,
      fullName: 'Admin',
      email: 'admin@test.local',
      role: 'ADMIN',
      schoolId: null,
    });

    createComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('redirects school roles to /school', () => {
    authSpy.getCurrentSession.and.returnValue({
      userId: 2,
      fullName: 'Manager',
      email: 'manager@test.local',
      role: 'SCHOOL_MANAGER',
      schoolId: 1,
    });

    createComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/school']);
  });

  it('redirects health roles to /health', () => {
    authSpy.getCurrentSession.and.returnValue({
      userId: 3,
      fullName: 'Health',
      email: 'health@test.local',
      role: 'HEALTH_PRO',
      schoolId: null,
    });

    createComponent();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/health']);
  });
});
