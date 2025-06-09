import { translations as homeTranslations } from './pages-translations/home_translations.js';
import { translations as catalogTranslations } from './pages-translations/catalog_translations.js';
import { translations as accountTranslations } from './pages-translations/account_translations.js';
import { translations as headerTranslations } from './pages-translations/header_translations.js';
import { translations as headerAccountTranslations } from './pages-translations/header_account_translations.js';
import { translations as headerAuthTranslations } from './pages-translations/header_auth_translations.js';
import { translations as footerTranslations } from './pages-translations/footer_translations.js';
import { translations as adminTranslations } from './pages-translations/admin_translations.js';
import { translations as productTranslations } from './pages-translations/product_translations.js';
import { translations as cartTranslations } from './pages-translations/cart_translations.js';
import { translations as signinTranslations } from './pages-translations/signin_translations.js';
import { translations as signupTranslations } from './pages-translations/signup_translations.js';

const translationsByPage = {
  home: homeTranslations,
  catalog: catalogTranslations,
  account: accountTranslations,
  cart: cartTranslations,
  admin: adminTranslations,
  product: productTranslations,
  signin: signinTranslations,
  signup: signupTranslations
};

const headerTranslationsByPage = {
  home: headerTranslations,
  catalog: headerTranslations,
  cart: headerTranslations,
  account: headerAccountTranslations,
  auth: headerAuthTranslations,
  admin: headerTranslations,
  product: headerTranslations,
  signin: headerAuthTranslations,
  signup: headerAuthTranslations
};

export function initLanguageSwitcher(selector = '.language-selector') {
    const languageSelectors = document.querySelectorAll(selector);
    if (!languageSelectors.length) {
        console.warn('Language selector not found:', selector);
        return;
    }

    const pageType = document.body.dataset.pageType || 'home';
    const authSubType = pageType === 'auth' ? (window.location.pathname.includes('signin') ? 'signin' : 'signup') : pageType;
    console.log('Initializing language switcher for page type:', pageType, 'auth subtype:', authSubType);
    const pageTranslations = translationsByPage[authSubType] || translationsByPage[pageType] || {};
    const headerTranslations = headerTranslationsByPage[authSubType] || headerTranslationsByPage[pageType] || headerTranslations;
    const combinedTranslations = {
        ...pageTranslations,
        ...headerTranslations,
        ...footerTranslations
    };

    const savedLanguage = localStorage.getItem('language') || 'en';
    updateLanguage(savedLanguage, combinedTranslations);

    languageSelectors.forEach(selector => {
        const toggle = selector.querySelector('.language-toggle');
        const dropdown = selector.querySelector('.language-dropdown');

        if (toggle && dropdown) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', !isExpanded);
                console.log('Language dropdown toggled:', !isExpanded);
            });

            document.addEventListener('click', (e) => {
                if (!selector.contains(e.target)) {
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        selector.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.lang) {
                e.stopPropagation();
                const newLang = e.target.dataset.lang;
                console.log('Switching language to:', newLang);
                localStorage.setItem('language', newLang);
                updateLanguage(newLang, combinedTranslations);
                toggle.setAttribute('aria-expanded', 'false');
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: newLang } }));
            }
        });
    });
}

function updateLanguage(lang, translations) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = translations[key]?.[lang];
        if (translation) {
            if (element.dataset.i18nData) {
                try {
                    const data = JSON.parse(element.dataset.i18nData);
                    element.innerHTML = translation.replace(/\{(\w+)\}/g, (_, k) => data[k] || '');
                } catch (e) {
                    console.warn('Invalid i18n data:', element.dataset.i18nData);
                    element.innerHTML = translation;
                }
            } else {
                element.innerHTML = translation;
            }
        } else {
            console.warn(`Translation missing for key "${key}" in language "${lang}"`);
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const translation = translations[key]?.[lang];
        if (translation) {
            element.placeholder = translation;
        } else {
            console.warn(`Placeholder translation missing for key "${key}" in language "${lang}"`);
        }
    });

    document.querySelectorAll('.current-language').forEach(element => {
        const translation = translations.lang_current?.[lang] || lang.toUpperCase();
        element.textContent = translation;
    });
}