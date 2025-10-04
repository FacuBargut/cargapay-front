import axios from 'axios';

// Creamos una instancia de Axios con la URL base de tu API
const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor para las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para las respuestas
api.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, no hacemos nada
  (error) => {
    // Si la respuesta es un error 401 (token vencido o inválido)
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // Borramos el token viejo
      // Usamos window.location para forzar la recarga y redirigir al login
      window.location.href = '/'; 
    }
    return Promise.reject(error); // Rechazamos la promesa para que el .catch() del componente también se active si es necesario
  }
);

export default api;