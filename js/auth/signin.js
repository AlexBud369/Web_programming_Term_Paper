import { validateEmail, loginUser, updateUserProfile } from '../modules/auth.js';
import { initBurgerMenu } from '../modules/burgerMenu.js';
import { initLanguageSwitcher } from '../modules/languageSwitcher.js';
import { initThemeSwitcher } from '../modules/themeSwitcher.js';
import { showErrorModal, showSuccessModal } from '../modules/modal.js';
import { translations as signinTranslations } from '../modules/pages-translations/signin_translations.js';
import { translations as headerTranslations } from '../modules/pages-translations/header_translations.js';
import { translations as footerTranslations } from '../modules/pages-translations/footer_translations.js';
import { showPreloader, hidePreloader, initPreloader } from '../modules/preloader.js';

document.addEventListener('DOMContentLoaded', () => {
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
        const lang = localStorage.getItem('language') || 'en';
        showErrorModal(signinTranslations.form_initialization_error?.[lang] || 'Form initialization failed');
        return;
    }

    togglePasswordBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        const lang = localStorage.getItem('language') || 'en';
        togglePasswordBtn.textContent = signinTranslations[isHidden ? 'toggle_password_hide' : 'toggle_password_show']?.[lang] || (isHidden ? 'Hide' : 'Show');
    });

    function validateForm() {
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
            errorElements.usernameEmail.textContent = signinTranslations.username_email_required?.[lang] || 'Email or username is required';
            errorElements.usernameEmail.classList.add('active');
            isValid = false;
        } else if (validateEmail(usernameEmail) || usernameEmail.length <= 30) {
            errorElements.usernameEmail.textContent = '';
        } else {
            errorElements.usernameEmail.textContent = signinTranslations.username_email_invalid?.[lang] || 'Invalid email or username (max 30 characters)';
            errorElements.usernameEmail.classList.add('active');
            isValid = false;
        }

        if (!password) {
            errorElements.password.textContent = signinTranslations.password_required?.[lang] || 'Password is required';
            errorElements.password.classList.add('active');
            isValid = false;
        }

        submitBtn.disabled = !isValid;
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
            showPreloader();
            const user = await loginUser(loginData);
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
            showSuccessModal(signinTranslations.login_success?.[lang] || 'Login successful!');
            updateUserProfile();
            setTimeout(() => {
                window.location.assign(user.role === 'admin' ? '../pages/admin.html' : '../pages/account.html');
                hidePreloader();
            }, 1000);
        } catch (error) {
            const lang = localStorage.getItem('language') || 'en';
            showErrorModal(error.message || signinTranslations.login_failed?.[lang] || 'Login failed');
            hidePreloader();
        }
    });

    updateUserProfile();

    const burgerButton = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeButton = document.querySelector('.close-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    if (burgerButton && mobileMenu && closeButton && menuOverlay) {
        initBurgerMenu(false, true, true, { ...signinTranslations, ...headerTranslations, ...footerTranslations });
    }

    // Передаём объединённые переводы в initLanguageSwitcher
    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector) {
        initLanguageSwitcher('.language-selector', { ...signinTranslations, ...headerTranslations, ...footerTranslations });
    }

    const headerThemeToggle = document.querySelector('#theme-toggle');
    const mobileThemeToggle = document.querySelector('#theme-toggle-mobile');
    if (headerThemeToggle) {
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        initThemeSwitcher(mobileThemeToggle);
    }

    const headerResetBtn = document.querySelector('.header-controls .reset-btn');
    if (headerResetBtn) {
        headerResetBtn.addEventListener('click', () => {
            try {
                localStorage.setItem('language', 'en');
                localStorage.setItem('theme', 'light');
                document.documentElement.setAttribute('data-theme', 'light');
                const languageChangedEvent = new CustomEvent('languageChanged', { detail: { lang: 'en' } });
                window.dispatchEvent(languageChangedEvent);
                setTimeout(() => {
                    window.location.reload(true);
                }, 100);
            } catch (error) {
                console.error('Error during header reset:', error);
            }
        });
    }

    window.addEventListener('languageChanged', (e) => {
        const lang = e.detail.lang;
        validateForm();
        togglePasswordBtn.textContent = passwordInput.type === 'password' ? 
            (signinTranslations.toggle_password_show?.[lang] || 'Show') : 
            (signinTranslations.toggle_password_hide?.[lang] || 'Hide');
        document.title = signinTranslations.signin_title?.[lang] || signinTranslations.signin_title?.['en'] || 'Sign In - Euphoria';
    });

    validateForm();
});