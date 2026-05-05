import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:4000/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const createBooking = (data: object) => API.post('/bookings', data);
export const getFleet = () => API.get('/fleet/vehicles');
export const getRoutes = () => API.get('/fleet/routes');
export default API;