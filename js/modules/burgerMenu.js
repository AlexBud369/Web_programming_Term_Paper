import { checkAuth, updateUserProfile, logoutUser } from './auth.js';
import { initAccessibility, resetAccessibility } from './accessibility.js';
import { translations } from './pages-translations/header_translations.js';
import { updateLanguage } from './languageSwitcher.js';

export function initBurgerMenu(isIndexPage = false, isAuthPage = false, isSignInPage = false) {
    const burgerBtn = document.querySelector('.burger-menu');
    const closeBtn = document.querySelector('.close-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const authSection = document.querySelector('.auth-section');
    const menuContainer = document.querySelector('.menu-container');
    const a11ySettings = document.querySelector('.a11y-settings');

    if (!burgerBtn || !mobileMenu || !menuOverlay || !closeBtn || !authSection || !menuContainer) {
        console.error('Burger menu elements not found', {
            burgerBtn: !!burgerBtn,
            mobileMenu: !!mobileMenu,
            menuOverlay: !!menuOverlay,
            closeBtn: !!closeBtn,
            authSection: !!authSection,
            menuContainer: !!menuContainer
        });
        return;
    }

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
        burgerBtn.setAttribute('aria-expanded', mobileMenu.classList.contains('active'));
        burgerBtn.classList.toggle('active');
    }

    burgerBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);

    function initAuthSection() {
        const logoutBtn = authSection.querySelector('.logout-btn');
        const loginBtn = authSection.querySelector('.login-btn');
        const registerBtn = authSection.querySelector('.register-btn');
        const authBtn = authSection.querySelector('.auth-btn');
        const mobileAuthBtn = mobileMenu.querySelector('.auth-section .auth-btn');

        const currentLang = localStorage.getItem('language') || 'en';
        if (loginBtn) loginBtn.setAttribute('data-i18n', 'login_btn');
        if (registerBtn) registerBtn.setAttribute('data-i18n', 'register_btn');
        if (logoutBtn) logoutBtn.setAttribute('data-i18n', 'logout_btn');
        updateLanguage(currentLang, translations);

        const isInPagesDir = window.location.pathname.includes('/pages/');
        const basePath = isInPagesDir ? '../' : '';

        if (isAuthPage) {
            if (authBtn) {
                authBtn.setAttribute('data-i18n', isSignInPage ? 'register_btn' : 'login_btn');
                authBtn.addEventListener('click', () => {
                    window.location.href = `${basePath}auth/${isSignInPage ? 'signup.html' : 'signin.html'}`;
                    toggleMenu();
                });
            }
            if (mobileAuthBtn) {
                mobileAuthBtn.setAttribute('data-i18n', isSignInPage ? 'register_btn' : 'login_btn');
                mobileAuthBtn.addEventListener('click', () => {
                    window.location.href = `${basePath}auth/${isSignInPage ? 'signup.html' : 'signin.html'}`;
                    toggleMenu();
                });
            }
        } else {
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    window.location.href = `${basePath}auth/signin.html`;
                    toggleMenu();
                });
            }
            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    window.location.href = `${basePath}auth/signup.html`;
                    toggleMenu();
                });
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('Logout button clicked, calling logoutUser');
                logoutUser();
                toggleMenu();
            });
        }

        console.log('Initializing user profile on page load');
        try {
            updateUserProfile();
        } catch (error) {
            console.error('Error in updateUserProfile on init:', error);
        }
    }

    function initMobileMenu() {
        let resetBtn = menuContainer.querySelector('.reset-btn');
        if (!resetBtn) {
            console.log('Creating reset button');
            resetBtn = document.createElement('button');
            resetBtn.className = 'reset-btn';
            resetBtn.setAttribute('data-i18n', 'reset_btn');
            menuContainer.insertBefore(resetBtn, authSection);
        }

        const currentLang = localStorage.getItem('language') || 'en';
        resetBtn.textContent = translations.reset_btn?.[currentLang] || 'Reset Settings';
        resetBtn.setAttribute('aria-label', translations.reset_btn?.[currentLang] || 'Reset Settings');

        const isAccountPage = window.location.pathname.includes('account.html');

        resetBtn.addEventListener('click', () => {
            console.log('Reset button clicked');
            try {
                localStorage.setItem('language', 'en');
                localStorage.setItem('theme', 'light');
                document.documentElement.setAttribute('data-theme', 'light');

               
                if (isAccountPage) {
                    console.log('Resetting accessibility settings for account page');
                    resetAccessibility();
                } else {
                    console.log('Skipping accessibility reset, not on account page');
                }

                const languageChangedEvent = new CustomEvent('languageChanged', { detail: { lang: 'en' } });
                window.dispatchEvent(languageChangedEvent);
                console.log('Calling updateUserProfile for reset');
                try {
                    updateUserProfile();
                } catch (error) {
                    console.error('Error in updateUserProfile during reset:', error);
                }
                toggleMenu();
                console.log('Settings reset, UI updated');
            } catch (error) {
                console.error('Error during reset:', error);
                toggleMenu();
            }
        });

        updateLanguage(currentLang, translations);
    }

    initAuthSection();
    initMobileMenu();

    console.log('a11ySettings found:', a11ySettings);
    if (isIndexPage && a11ySettings) {
        console.log('Initializing accessibility with container:', a11ySettings);
        initAccessibility(a11ySettings);
    }

    window.addEventListener('languageChanged', (e) => {
        const newLang = e.detail.lang;
        updateLanguage(newLang, translations);
    });
}