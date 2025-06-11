import { validateEmail, loginUser, updateUserProfile } from '../modules/auth.js';
import { initBurgerMenu } from '../modules/burgerMenu.js';
import { initLanguageSwitcher } from '../modules/languageSwitcher.js';
import { initThemeSwitcher } from '../modules/themeSwitcher.js';
import { showErrorModal, showSuccessModal } from '../modules/modal.js';
import { translations } from '../modules/pages-translations/signin_translations.js';
import { showPreloader, hidePreloader, initPreloader } from '../modules/preloader.js';

console.log('signin.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    initPreloader();

    const form = document.getElementById('signinForm');
    const usernameEmailInput = document.getElementById('usernameEmail');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const submitBtn = document.getElementById('submitBtn');
    const errorElements = {
        usernameEmail: document.getElementById('usernameEmailError'),
        password: document.getElementById('passwordError'),
    };

    if (!form || !usernameEmailInput || !passwordInput || !submitBtn || !togglePasswordBtn) {
        console.error('Form or inputs not found:', { form, usernameEmailInput, passwordInput, submitBtn, togglePasswordBtn });
        const lang = localStorage.getItem('language') || 'en';
        showErrorModal(translations.form_initialization_error?.[lang] || 'Form initialization failed');
        return;
    }

    togglePasswordBtn.addEventListener('click', () => {
        console.log('Toggle password visibility clicked');
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        const lang = localStorage.getItem('language') || 'en';
        togglePasswordBtn.textContent = translations[isHidden ? 'toggle_password_hide' : 'toggle_password_show']?.[lang] || (isHidden ? 'Hide' : 'Show');
    });

    function validateForm() {
        console.log('Validating form');
        let isValid = true;
        const lang = localStorage.getItem('language') || 'en';
        Object.values(errorElements).forEach(element => {
            if (element) {
                element.textContent = '';
                element.classList.remove('active');
            }
        });

        const usernameEmail = usernameEmailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!usernameEmail) {
            errorElements.usernameEmail.textContent = translations.username_email_required?.[lang] || 'Email or username is required';
            errorElements.usernameEmail.classList.add('active');
            isValid = false;
        } else if (validateEmail(usernameEmail) || usernameEmail.length <= 30) {
            errorElements.usernameEmail.textContent = '';
        } else {
            errorElements.usernameEmail.textContent = translations.username_email_invalid?.[lang] || 'Invalid email or username (max 30 characters)';
            errorElements.usernameEmail.classList.add('active');
            isValid = false;
        }

        if (!password) {
            errorElements.password.textContent = translations.password_required?.[lang] || 'Password is required';
            errorElements.password.classList.add('active');
            isValid = false;
        }

        submitBtn.disabled = !isValid;
        console.log('Form validation result:', isValid, 'usernameEmail:', usernameEmail, 'password:', !!password);
        return isValid;
    }

    [usernameEmailInput, passwordInput].forEach((input) => {
        input.addEventListener('input', () => {
            console.log(`Input changed: ${input.id}`);
            validateForm();
        });
    });

    form.addEventListener('submit', async (e) => {
        console.log('Form submission');
        e.preventDefault();
        if (!validateForm()) return;

        const loginData = {
            usernameEmail: usernameEmailInput.value.trim(),
            password: passwordInput.value,
        };

        try {
            showPreloader();
            const user = await loginUser(loginData);
            console.log('Login successful:', user);
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                email: user.email || '',
                nickname: user.nickname || '',
                role: user.role || 'user',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                birthDate: user.birthDate || '',
            }));
            const lang = localStorage.getItem('language') || 'en';
            showSuccessModal(translations.login_success?.[lang] || 'Login successful!');
            updateUserProfile();
            setTimeout(() => {
                window.location.assign(user.role === 'admin' ? '../pages/admin.html' : '../pages/account.html');
                hidePreloader();
            }, 1000);
        } catch (error) {
            console.error('Login error:', error.message);
            const lang = localStorage.getItem('language') || 'en';
            showErrorModal(error.message || translations.login_failed?.[lang] || 'Login failed');
            hidePreloader();
        }
    });

    console.log('Initializing UI components');
    updateUserProfile();

    const burgerButton = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeButton = document.querySelector('.close-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    if (burgerButton && mobileMenu && closeButton && menuOverlay) {
        console.log('Burger menu elements found, initializing');
        initBurgerMenu(false, true, true);
    } else {
        console.error('Burger menu elements missing:', { burgerButton, mobileMenu, closeButton, menuOverlay });
    }

    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector) {
        console.log('Language selector found, initializing');
        initLanguageSwitcher();
    } else {
        console.warn('Language selector not found');
    }

    const headerThemeToggle = document.querySelector('#theme-toggle');
    const mobileThemeToggle = document.querySelector('#theme-toggle-mobile');
    if (headerThemeToggle) {
        console.log('Header theme toggle found, initializing');
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        console.log('Mobile theme toggle found, initializing');
        initThemeSwitcher(mobileThemeToggle);
    }

    // Добавляем обработчик для кнопки сброса настроек в шапке
    const headerResetBtn = document.querySelector('.header-controls .reset-btn');
    if (headerResetBtn) {
        console.log('Header reset button found, initializing');
        headerResetBtn.addEventListener('click', () => {
            console.log('Header reset button clicked');
            try {
                localStorage.setItem('language', 'en');
                localStorage.setItem('theme', 'light');
                document.documentElement.setAttribute('data-theme', 'light');
                const languageChangedEvent = new CustomEvent('languageChanged', { detail: { lang: 'en' } });
                window.dispatchEvent(languageChangedEvent);
                console.log('Triggering page reload');
                setTimeout(() => {
                    window.location.reload(true);
                }, 100);
            } catch (error) {
                console.error('Error during header reset:', error);
            }
        });
    } else {
        console.warn('Header reset button not found');
    }

    window.addEventListener('languageChanged', () => {
        console.log('Language changed, revalidating form');
        validateForm();
        const lang = localStorage.getItem('language') || 'en';
        togglePasswordBtn.textContent = passwordInput.type === 'password' ? 
            (translations.toggle_password_show?.[lang] || 'Show') : 
            (translations.toggle_password_hide?.[lang] || 'Hide');
    });

    validateForm();
});