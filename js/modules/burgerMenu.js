import { checkAuth, updateUserProfile } from './auth.js';
import { initAccessibility } from './accessibility.js';
import { resetAccessibility } from './accessibility.js';

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

        if (isAuthPage) {
            if (authBtn) {
                authBtn.textContent = isSignInPage ? 'Register' : 'Login';
                authBtn.addEventListener('click', () => {
                    window.location.href = isSignInPage ? 'signup.html' : 'signin.html';
                    toggleMenu();
                });
            }
            if (mobileAuthBtn) {
                mobileAuthBtn.textContent = isSignInPage ? 'Register' : 'Login';
                mobileAuthBtn.addEventListener('click', () => {
                    window.location.href = isSignInPage ? 'signup.html' : 'signin.html';
                    toggleMenu();
                });
            }
        } else {
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    window.location.href = isIndexPage ? 'pages/signin.html' : '../auth/signin.html';
                    toggleMenu();
                });
            }
            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    window.location.href = isIndexPage ? 'pages/signup.html' : '../auth/signup.html';
                    toggleMenu();
                });
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('user');
                updateUserProfile();
                toggleMenu();
                window.location.href = isIndexPage ? 'pages/signin.html' : isAuthPage ? 'signin.html' : '../auth/signin.html';
            });
        }

        updateUserProfile();
    }

    function initMobileMenu() {
        let resetBtn = menuContainer.querySelector('.reset-btn');
        if (!resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.className = 'reset-btn';
            resetBtn.textContent = 'Reset Settings';
            resetBtn.setAttribute('aria-label', 'Reset all settings');
            menuContainer.insertBefore(resetBtn, authSection);
        }

        resetBtn.addEventListener('click', () => {
            console.log('Reset button clicked');
            resetAccessibility();
            toggleMenu();
            setTimeout(() => window.location.reload(), 100);
        });
    }
    initAuthSection();
    initMobileMenu();


   console.log('a11ySettings found:', a11ySettings);
    if (isIndexPage && a11ySettings) {
        console.log('Initializing accessibility with container:', a11ySettings);
        initAccessibility(a11ySettings);
    }
}