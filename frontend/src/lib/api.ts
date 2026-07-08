import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor — adaugă automat token-ul JWT la fiecare request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor — dacă primim 401 (Unauthorized/Token Expirat), redirecționăm la login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isUnauthorized = error.response?.status === 401;
        const isProfileDeleted = error.response?.status === 404 && error.config?.url?.includes('/profile');

        if (isUnauthorized || isProfileDeleted) {
            // Curățăm datele locale
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Curățăm cookie-ul ca să nu ne mai blocheze middleware-ul
            Cookies.remove('token', { path: '/' });
            
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- ENDPOINT-URI PENTRU FAVORITE ---
export const favoritesApi = {
    getFavorites: async () => (await api.get('/api/user/favorites')).data,
    checkFavorite: async (publicId: string) => (await api.get(`/api/user/favorites/${publicId}/check`)).data,
    addFavorite: async (publicId: string) => (await api.post(`/api/user/favorites/${publicId}`)).data,
    removeFavorite: async (publicId: string) => (await api.delete(`/api/user/favorites/${publicId}`)).data,
};

export default api;