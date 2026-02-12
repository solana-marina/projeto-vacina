import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, UserRole, UserSession } from '../../shared/models/api.models';
import { TokenStorageService } from './token-storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly sessionSubject: BehaviorSubject<UserSession | null>;

  readonly session$: Observable<UserSession | null>;

  constructor(
    private http: HttpClient,
    private storage: TokenStorageService,
  ) {
    this.sessionSubject = new BehaviorSubject<UserSession | null>(this.storage.getSession());
    this.session$ = this.sessionSubject.asObservable();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/token/`, { email, password }).pipe(
      tap((response) => {
        const session: UserSession = {
          userId: response.user_id,
          fullName: response.full_name,
          email: response.email,
          role: response.role,
          schoolId: response.school_id,
        };
        this.storage.save(response.access, response.refresh, session);
        this.sessionSubject.next(session);
      }),
    );
  }

  logout(): void {
    this.storage.clear();
    this.sessionSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.storage.getAccessToken() && !!this.storage.getSession();
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const session = this.sessionSubject.value;
    if (!session) {
      return false;
    }
    return roles.includes(session.role);
  }

  getCurrentSession(): UserSession | null {
    return this.sessionSubject.value;
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }
}
