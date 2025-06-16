import { checkAuth, updateUserProfile, logoutUser } from './auth.js';
import { initAccessibility, resetAccessibility } from './accessibility.js';
import { updateLanguage } from './languageSwitcher.js';
import { setTheme } from './themeSwitcher.js';

export function initBurgerMenu(isIndexPage = false, isAuthPage = false, isSignInPage = false, translations = {}) {
    const burgerBtn = document.querySelector('.burger-menu');
    const closeBtn = document.querySelector('.close-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const authSection = document.querySelector('.auth-section');
    const menuContainer = document.querySelector('.menu-container');
    const a11ySettings = document.querySelector('.a11y-settings');
    const a11yToggles = document.querySelectorAll('.a11y-toggle .toggle-input');

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
                    console.log('Auth button clicked:', isSignInPage ? 'signup' : 'signin');
                    window.location.href = `${basePath}auth/${isSignInPage ? 'signup.html' : 'signin.html'}`;
                    toggleMenu();
                });
            }
            if (mobileAuthBtn) {
                mobileAuthBtn.setAttribute('data-i18n', isSignInPage ? 'register_btn' : 'login_btn');
                mobileAuthBtn.addEventListener('click', () => {
                    console.log('Mobile auth button clicked:', isSignInPage ? 'signup' : 'signin');
                    window.location.href = `${basePath}auth/${isSignInPage ? 'signup.html' : 'signin.html'}`;
                    toggleMenu();
                });
            }
        } else {
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    console.log('Login button clicked');
                    window.location.href = `${basePath}auth/signin.html`;
                    toggleMenu();
                });
            }
            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    console.log('Register button clicked');
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
        resetBtn.textContent = translations.reset_btn?.[currentLang] || translations.reset_btn?.['en'] || 'Reset Settings';
        resetBtn.setAttribute('aria-label', translations.reset_btn?.[currentLang] || translations.reset_btn?.['en'] || 'Reset Settings');

        const isAccountPage = window.location.pathname.includes('account.html');

        resetBtn.addEventListener('click', () => {
            console.log('Reset button clicked');
            try {
                const currentLang = localStorage.getItem('language') || 'en';
                if (currentLang !== 'en') {
                    localStorage.setItem('language', 'en');
                    const languageChangedEvent = new CustomEvent('languageChanged', { detail: { lang: 'en' } });
                    window.dispatchEvent(languageChangedEvent);
                }

                const currentTheme = localStorage.getItem('theme') || 'light';
                if (currentTheme !== 'light') {
                    setTheme('light');
                }

                if (isAccountPage) {
                    console.log('Resetting accessibility settings for account page');
                    resetAccessibility();
                    a11yToggles.forEach(toggle => {
                        toggle.checked = false;
                        toggle.setAttribute('aria-label', translations.a11y_enable?.[currentLang] || translations.a11y_enable?.['en'] || 'Enable Accessibility');
                    });
                    if (a11ySettings) {
                        a11ySettings.classList.remove('a11y-active');
                        console.log('A11y settings hidden after reset');
                    }
                }

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

        if (isAccountPage && a11yToggles.length && a11ySettings) {
            console.log('Initializing a11y toggles for account page');
            const isA11yActive = localStorage.getItem('a11y-active') === 'true';
            a11ySettings.classList.toggle('a11y-active', isA11yActive);
            console.log('A11y settings class set to:', a11ySettings.classList.contains('a11y-active') ? 'a11y-active' : 'hidden');

            a11yToggles.forEach(toggle => {
                toggle.checked = isA11yActive;
                toggle.setAttribute('aria-label', isA11yActive ? 
                    translations.a11y_disable?.[currentLang] || translations.a11y_disable?.['en'] || 'Disable Accessibility' : 
                    translations.a11y_enable?.[currentLang] || translations.a11y_enable?.['en'] || 'Enable Accessibility');
                
                toggle.addEventListener('change', () => {
                    const newState = toggle.checked;
                    console.log('A11y toggle changed, new state:', newState);
                    localStorage.setItem('a11y-active', newState.toString());
                    a11yToggles.forEach(t => {
                        t.checked = newState;
                        t.setAttribute('aria-label', newState ? 
                            translations.a11y_disable?.[currentLang] || translations.a11y_disable?.['en'] || 'Disable Accessibility' : 
                            translations.a11y_enable?.[currentLang] || translations.a11y_enable?.['en'] || 'Enable Accessibility');
                    });

                    if (newState) {
                        console.log('Enabling accessibility settings');
                        a11ySettings.classList.add('a11y-active');
                        initAccessibility(a11ySettings);
                    } else {
                        console.log('Disabling accessibility settings');
                        a11ySettings.classList.remove('a11y-active');
                        resetAccessibility();
                    }
                });
            });
        } else if (a11yToggles.length) {
            a11yToggles.forEach(toggle => {
                toggle.parentElement.style.display = 'none';
            });
        }

        updateLanguage(currentLang, translations);
    }

    initAuthSection();
    initMobileMenu();

    window.addEventListener('languageChanged', (e) => {
        const newLang = e.detail.lang;
        updateLanguage(newLang, translations);
        if (a11yToggles.length && window.location.pathname.includes('account.html')) {
            const isA11yActive = localStorage.getItem('a11y-active') === 'true';
            a11yToggles.forEach(toggle => {
                toggle.setAttribute('aria-label', isA11yActive ? 
                    translations.a11y_disable?.[newLang] || translations.a11y_disable?.['en'] || 'Disable Accessibility' : 
                    translations.a11y_enable?.[newLang] || translations.a11y_enable?.['en'] || 'Enable Accessibility');
            });
        }
    });
}