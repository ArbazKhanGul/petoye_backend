import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('adminRefreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/refresh-token`,
            { refreshToken }
          );

          const { authToken, refreshToken: newRefreshToken } = response.data;
          
          // Update cookies
          Cookies.set('adminToken', authToken, { expires: 1/3 }); // 8 hours
          Cookies.set('adminRefreshToken', newRefreshToken, { expires: 7 });

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${authToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('adminToken');
        Cookies.remove('adminRefreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
