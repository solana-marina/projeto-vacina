import { Injectable } from '@angular/core';

import { UserSession } from '../../shared/models/api.models';

const ACCESS_KEY = 'vacina_access';
const REFRESH_KEY = 'vacina_refresh';
const SESSION_KEY = 'vacina_session';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  save(access: string, refresh: string, session: UserSession): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  getSession(): UserSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  }
}
