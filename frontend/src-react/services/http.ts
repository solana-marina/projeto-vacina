import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../lib/constants';
import { clearAuth, getAccessToken, getRefreshToken, setAccessToken } from './sessionStorage';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let waitQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  waitQueue.forEach((resolve) => resolve(token));
  waitQueue = [];
}

function isAuthEndpoint(url?: string) {
  if (!url) {
    return false;
  }
  return url.includes('/auth/token/');
}

function parseJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    const json = JSON.parse(decoded) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const exp = parseJwtExp(token);
  if (!exp) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowSeconds + skewSeconds;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuth();
    return null;
  }

  if (isRefreshing) {
    return new Promise<string | null>((resolve) => {
      waitQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: refreshToken,
    });
    const newAccess = refreshResponse.data.access as string;
    setAccessToken(newAccess);
    resolveQueue(newAccess);
    return newAccess;
  } catch {
    clearAuth();
    resolveQueue(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

apiClient.interceptors.request.use(async (config) => {
  if (isAuthEndpoint(config.url)) {
    return config;
  }

  let token = getAccessToken();
  const refreshToken = getRefreshToken();

  if ((!token || isTokenExpired(token)) && refreshToken) {
    token = await refreshAccessToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newToken = await refreshAccessToken();
    if (!newToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(originalRequest);
  },
);
