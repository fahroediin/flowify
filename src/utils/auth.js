import { navigate } from '../main.js';

export const setAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthToken = () => {
    return localStorage.getItem('token');
};

export const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return null;
    
    try {
        return JSON.stringify(userStr) ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
};
