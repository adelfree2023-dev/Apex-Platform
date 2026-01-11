import axios from 'axios';
// نفترض أن الـ API تعمل على نفس السيرفر بورت 3000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Add auth token if available
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

  return response.data;
};

export const login = async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const register = async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};
