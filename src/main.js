import { renderAuthPage } from './pages/auth.js';
import { renderEditorPage } from './pages/editor.js';
import { checkAuth } from './utils/auth.js';

// Simple Router
const router = () => {
    const app = document.getElementById('app');
    const path = window.location.pathname;

    const user = checkAuth();

    if (!user && path !== '/login' && path !== '/register') {
        window.history.pushState({}, '', '/login');
        renderAuthPage(app, 'login');
        return;
    }

    if (user && (path === '/login' || path === '/register' || path === '/')) {
        window.history.pushState({}, '', '/editor');
        renderEditorPage(app, user);
        return;
    }

    if (path === '/login') {
        renderAuthPage(app, 'login');
    } else if (path === '/register') {
        renderAuthPage(app, 'register');
    } else if (path === '/editor') {
        renderEditorPage(app, user);
    } else if (path === '/history') {
        // renderHistoryPage(app, user);
    } else {
        renderEditorPage(app, user); // fallback
    }
};

window.addEventListener('popstate', router);
document.addEventListener('DOMContentLoaded', router);

export const navigate = (path) => {
    window.history.pushState({}, '', path);
    router();
};

// Global Toast System
export const showToast = (message, type = 'success') => {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};
