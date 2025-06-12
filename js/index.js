import { initBurgerMenu } from './modules/burgerMenu.js';
import { checkAuth, updateUserProfile } from './modules/auth.js';
import { initThemeSwitcher } from './modules/themeSwitcher.js';
import { initSlider } from './modules/ui/Slider.js';
import { initLanguageSwitcher } from './modules/languageSwitcher.js';
import { translations } from './modules/pages-translations/home_translations.js';
import { initPreloader } from './modules/preloader.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('index.js loaded');
    initPreloader();

    const auth = checkAuth();
    console.log('Auth status:', auth);

    initBurgerMenu(true);

    const getSlideData = (lang) => [
        {
            image: '../images/home_page_person1.jpg',
            alt: 'Slide 1',
            h2: translations.slider.slide_1.h2[lang],
            h3: translations.slider.slide_1.h3[lang],
            p: translations.slider.slide_1.p[lang],
            button: translations.slider.slide_1.button[lang]
        },
        {
            image: '../images/home_page_person2.jpg',
            alt: 'Slide 2',
            h2: translations.slider.slide_2.h2[lang],
            h3: translations.slider.slide_2.h3[lang],
            p: translations.slider.slide_2.p[lang],
            button: translations.slider.slide_2.button[lang]
        },
        {
            image: '../images/home_page_person3.jpg',
            alt: 'Slide 3',
            h2: translations.slider.slide_3.h2[lang],
            h3: translations.slider.slide_3.h3[lang],
            p: translations.slider.slide_3.p[lang],
            button: translations.slider.slide_3.button[lang]
        },
        {
            image: '../images/home_page_person4.jpg',
            alt: 'Slide 4',
            h2: translations.slider.slide_4.h2[lang],
            h3: translations.slider.slide_4.h3[lang],
            p: translations.slider.slide_4.p[lang],
            button: translations.slider.slide_4.button[lang]
        },
        {
            image: '../images/home_page_person5.jpg',
            alt: 'Slide 5',
            h2: translations.slider.slide_5.h2[lang],
            h3: translations.slider.slide_5.h3[lang],
            p: translations.slider.slide_5.p[lang],
            button: translations.slider.slide_5.button[lang]
        },
        {
            image: '../images/home_page_person6.jpg',
            alt: 'Slide 6',
            h2: translations.slider.slide_6.h2[lang],
            h3: translations.slider.slide_6.h3[lang],
            p: translations.slider.slide_6.p[lang],
            button: translations.slider.slide_6.button[lang]
        }
    ];

    let sliderInstance;
    const heroSlider = document.querySelector('.hero-slider');
    const initHeroSlider = (lang) => {
        if (heroSlider) {
            if (sliderInstance) {
                sliderInstance.destroy();
            }
            sliderInstance = initSlider('.hero-slider', {
                slidesData: getSlideData(lang)
            });
            console.log('Hero slider initialized:', sliderInstance);
        } else {
            console.warn('Hero slider not found');
        }
    };

    const savedLanguage = localStorage.getItem('language') || 'en';
    initHeroSlider(savedLanguage);

    setTimeout(() => {
        console.log('Triggering languageChanged event for:', savedLanguage);
        const languageChangedEvent = new CustomEvent('languageChanged', { detail: { lang: savedLanguage } });
        window.dispatchEvent(languageChangedEvent);
    }, 0);

    window.addEventListener('languageChanged', (e) => {
        const newLang = e.detail.lang;
        initHeroSlider(newLang);
        document.querySelectorAll('.shop-btn[data-i18n="slider_shop_now"]').forEach(btn => {
            btn.textContent = translations.slider.slide_1.button[newLang];
        });
    });

    document.querySelectorAll('.saving-zone__card .shop-now-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const href = btn.getAttribute('href');
            console.log('Shop Now button clicked, navigating to:', href);
            window.location.href = href;
        });
    });

    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle .toggle-input');
    const mobileThemeToggle = document.querySelector('.mobile-menu .custom-toggle .toggle-input');
    if (headerThemeToggle) {
        console.log('Header theme toggle found:', headerThemeToggle);
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        console.log('Mobile theme toggle found:', mobileThemeToggle);
        initThemeSwitcher(mobileThemeToggle);
    }

    initLanguageSwitcher('.language-selector');

    updateUserProfile();
});