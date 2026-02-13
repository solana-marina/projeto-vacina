import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../lib/constants';
import { clearAuth, getAccessToken, getRefreshToken, setAccessToken } from './sessionStorage';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let waitQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  waitQueue.forEach((resolve) => resolve(token));
  waitQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) => {
        waitQueue.push(resolve);
      });
      if (!newToken) {
        return Promise.reject(error);
      }
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess = refreshResponse.data.access as string;
      setAccessToken(newAccess);
      resolveQueue(newAccess);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuth();
      resolveQueue(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
