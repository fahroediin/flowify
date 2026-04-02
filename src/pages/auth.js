import { apiCall } from '../utils/api.js';
import { setAuth } from '../utils/auth.js';
import { navigate, showToast } from '../main.js';

export const renderAuthPage = (container, type = 'login') => {
    const isLogin = type === 'login';
    
    container.innerHTML = `
        <div class="page" style="align-items: center; justify-content: center; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTEwIDB2NDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==');">
            <div class="auth-container">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <a href="/" class="brand" style="justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Flowify</span>
                    </a>
                    <p style="color: var(--text-muted); margin-top: 0.5rem;">
                        ${isLogin ? 'Welcome back to Flowify' : 'Create your Flowify account'}
                    </p>
                </div>

                <form id="auth-form" class="auth-form">
                    ${!isLogin ? `
                        <div>
                            <label style="display:block; margin-bottom: 0.5rem; font-size: 0.9rem;">Name</label>
                            <input type="text" id="name" required placeholder="John Doe">
                        </div>
                    ` : ''}
                    <div>
                        <label style="display:block; margin-bottom: 0.5rem; font-size: 0.9rem;">Email</label>
                        <input type="email" id="email" required placeholder="name@example.com">
                    </div>
                    <div>
                        <label style="display:block; margin-bottom: 0.5rem; font-size: 0.9rem;">Password</label>
                        <input type="password" id="password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="primary" style="margin-top: 1rem; padding: 0.75rem;">
                        ${isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                    
                    <div style="text-align: center; margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                        ${isLogin ? "Don't have an account?" : "Already have an account?"} 
                        <a href="javascript:void(0)" id="toggle-auth" style="color: var(--accent); text-decoration: none;">
                            ${isLogin ? 'Sign up' : 'Sign in'}
                        </a>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('toggle-auth').addEventListener('click', () => {
        navigate(isLogin ? '/register' : '/login');
    });

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.textContent = 'Loading...';
            submitBtn.disabled = true;

            let data;
            if (isLogin) {
                data = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
            } else {
                const name = document.getElementById('name').value;
                data = await apiCall('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });
            }

            setAuth(data.data.token, data.data.user);
            showToast('Authentication successful!');
            navigate('/editor');

        } catch (error) {
            showToast(error.message, 'error');
            submitBtn.textContent = isLogin ? 'Sign In' : 'Sign Up';
            submitBtn.disabled = false;
        }
    });
};
