import { validateEmail, loginUser } from '../modules/auth.js';
import { initBurgerMenu } from '../modules/burgerMenu.js';
import { initLanguageSwitcher } from '../modules/languageSwitcher.js';
import { initThemeSwitcher } from '../modules/themeSwitcher.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signinForm');
    const usernameEmailInput = document.getElementById('usernameEmail');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const errorElements = {
        usernameEmail: document.getElementById('usernameEmailError'),
        password: document.getElementById('passwordError'),
    };

    togglePasswordBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePasswordBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    function validateForm() {
        let isValid = true;
        Object.values(errorElements).forEach((el) => {
            el.textContent = '';
            el.classList.remove('active');
        });

        const usernameEmail = usernameEmailInput.value.trim();
        const password = passwordInput.value;

        if (!usernameEmail || !validateEmail(usernameEmail)) {
            errorElements.usernameEmail.textContent = 'Invalid email address';
            errorElements.usernameEmail.classList.add('active');
            isValid = false;
        }

        if (!password) {
            errorElements.password.textContent = 'Password is required';
            errorElements.password.classList.add('active');
            isValid = false;
        }

        return isValid;
    }

    [usernameEmailInput, passwordInput].forEach((input) => {
        input.addEventListener('input', validateForm);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const loginData = {
            usernameEmail: usernameEmailInput.value.trim(),
            password: passwordInput.value,
        };

        try {
            const user = await loginUser(loginData);
            localStorage.setItem('user', JSON.stringify({ id: user.id, email: user.email, nickname: user.nickname, role: user.role }));
            window.location.href = user.role === 'admin' ? '../pages/admin.html' : '../pages/account.html';
        } catch (error) {
            errorElements.usernameEmail.textContent = error.message || 'Login failed';
            errorElements.usernameEmail.classList.add('active');
        }
    });

    initBurgerMenu(false, true);

    const headerLanguageSelector = document.querySelector('.header-controls .language-selector');
    if (headerLanguageSelector) {
        initLanguageSwitcher(headerLanguageSelector);
    }

    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle');
    if (headerThemeToggle) {
        initThemeSwitcher(headerThemeToggle);
    }
});