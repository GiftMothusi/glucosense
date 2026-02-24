import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const storage = {
  getString: async (key: string) => await SecureStore.getItemAsync(key),
  set: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
  clearAll: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },
};

const BASE_URL = __DEV__
  ? 'http://192.168.0.151:8000/api/v1'  // Your current laptop IP
  : 'https://api.glucosense.health/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add request logging for debugging
api.interceptors.request.use(async (config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url, 'Base URL:', BASE_URL);
  return config;
});

// ─── Request interceptor — attach token ───────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await storage.getString('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — auto refresh token ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await storage.getString('refresh_token');
      if (!refreshToken) {
        await storage.clearAll();
        // Navigate to login — handled by auth store listener
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        await storage.set('access_token', data.access_token);
        await storage.set('refresh_token', data.refresh_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        await storage.clearAll();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Token helpers ────────────────────────────────────────────────────────────
export const setTokens = async (accessToken: string, refreshToken: string) => {
  await storage.set('access_token', accessToken);
  await storage.set('refresh_token', refreshToken);
};

export const clearTokens = async () => {
  await storage.clearAll();
};

export const getAccessToken = async () => await storage.getString('access_token');

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, fullName: string) =>
    api.post('/auth/register', { email, password, full_name: fullName }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ─── Glucose endpoints ────────────────────────────────────────────────────────
export const glucoseApi = {
  log: (data: any) => api.post('/glucose', data),
  list: (days = 14, page = 1) => api.get('/glucose', { params: { days, page } }),
  latest: () => api.get('/glucose/latest'),
  stats: (days = 14) => api.get('/glucose/stats', { params: { days } }),
  patterns: (days = 30) => api.get('/glucose/patterns', { params: { days } }),
  hourlyProfile: (days = 30) => api.get('/glucose/hourly-profile', { params: { days } }),
  dailyAverages: (days = 30) => api.get('/glucose/daily-averages', { params: { days } }),
  delete: (id: number) => api.delete(`/glucose/${id}`),
};

// ─── Meal endpoints ───────────────────────────────────────────────────────────
export const mealApi = {
  log: (data: any) => api.post('/meals', data),
  list: (days = 7) => api.get('/meals', { params: { days } }),
  favourites: () => api.get('/meals/favourites'),
  delete: (id: number) => api.delete(`/meals/${id}`),
};

// ─── Insulin endpoints ────────────────────────────────────────────────────────
export const insulinApi = {
  log: (data: any) => api.post('/insulin', data),
  list: (days = 7) => api.get('/insulin', { params: { days } }),
  bolusCalculator: (data: any) => api.post('/insulin/bolus-calculator', data),
  delete: (id: number) => api.delete(`/insulin/${id}`),
};

// ─── Activity endpoints ───────────────────────────────────────────────────────
export const activityApi = {
  log: (data: any) => api.post('/activities', data),
  list: (days = 7) => api.get('/activities', { params: { days } }),
  delete: (id: number) => api.delete(`/activities/${id}`),
};

// ─── Analytics endpoints ──────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  weeklyReport: () => api.get('/analytics/weekly-report'),
  insights: () => api.get('/analytics/insights'),
};

// ─── Care endpoints ───────────────────────────────────────────────────────────
export const careApi = {
  getContacts: () => api.get('/care/emergency-contacts'),
  addContact: (data: any) => api.post('/care/emergency-contacts', data),
  deleteContact: (id: number) => api.delete(`/care/emergency-contacts/${id}`),
  getPortalLinks: () => api.get('/care/portal-links'),
  createPortalLink: (data: any) => api.post('/care/portal-links', data),
  revokePortalLink: (id: number) => api.delete(`/care/portal-links/${id}`),
  getMedications: () => api.get('/care/medications'),
  addMedication: (data: any) => api.post('/care/medications', data),
  deleteMedication: (id: number) => api.delete(`/care/medications/${id}`),
  getSupplies: () => api.get('/care/supplies'),
  addSupply: (data: any) => api.post('/care/supplies', data),
};

// ─── User endpoints ───────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me/profile', data),
  setDiabetesProfile: (data: any) => api.post('/users/me/diabetes-profile', data),
};
