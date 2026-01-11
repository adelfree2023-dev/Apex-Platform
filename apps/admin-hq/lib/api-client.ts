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
    // console.log('🔐 Attaching Token:', token.substring(0, 10) + '...');
    config.headers.Authorization = 'Bearer ' + token;
  } else {
    console.warn('⚠️ No token found in localStorage!');
  }
  return config;
});

export const createCheckoutSession = async (priceId: string) => {
  // Dynamically determine the return URL based on where the user is currently accessing the app
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3003';

  const response = await apiClient.post('/stripe/checkout-session', {
    priceId,
    successUrl: `${origin}/billing?success=true`,
    cancelUrl: `${origin}/billing?canceled=true`,
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
