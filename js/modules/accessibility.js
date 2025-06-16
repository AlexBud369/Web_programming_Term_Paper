export function initAccessibility(container) {
    console.log('Initializing accessibility settings with container:', container);
    if (!container || !window.location.pathname.includes('account.html')) {
        console.warn('Accessibility settings are only available on account.html');
        return;
    }

    const fontSizeButtons = container.querySelectorAll('.font-size-btn');
    const colorSchemeRadios = container.querySelectorAll('input[name="color-scheme"]');
    const showImagesCheckbox = container.querySelector('#show-images');
    const a11yToggles = document.querySelectorAll('.a11y-toggle .toggle-input');

    const savedTextSize = localStorage.getItem('a11y-text-size') || '100';
    const savedColorScheme = localStorage.getItem('a11y-color-scheme') || 'default';
    const savedShowImages = localStorage.getItem('a11y-show-images') !== 'false';


    document.documentElement.setAttribute('data-text-size', savedTextSize);
    document.documentElement.setAttribute('data-color-scheme', savedColorScheme);
    document.documentElement.classList.toggle('no-images', !savedShowImages);
    document.documentElement.classList.add('a11y-mode');
    localStorage.setItem('a11y-active', 'true');

    container.classList.add('a11y-active');
    console.log('A11y settings shown with class: a11y-active');

    a11yToggles.forEach(toggle => {
        toggle.checked = true;
        console.log('A11y toggle set to checked:', toggle.id);
    });

    fontSizeButtons.forEach(button => {
        const fontSize = button.dataset.fontSize;
        button.classList.toggle('active', savedTextSize === fontSize);
        button.addEventListener('click', () => {
            fontSizeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const scale = fontSize / 100;
            document.documentElement.style.setProperty('--a11y-font-scale', scale);
            document.documentElement.setAttribute('data-text-size', fontSize);
            localStorage.setItem('a11y-text-size', fontSize);
            console.log('Font size set to:', fontSize);
        });
    });

    colorSchemeRadios.forEach(radio => {
        radio.checked = radio.value === savedColorScheme;
        radio.addEventListener('change', () => {
            document.documentElement.setAttribute('data-color-scheme', radio.value);
            localStorage.setItem('a11y-color-scheme', radio.value);
            console.log('Color scheme set to:', radio.value);
        });
    });

    if (showImagesCheckbox) {
        showImagesCheckbox.checked = savedShowImages;
        showImagesCheckbox.addEventListener('change', () => {
            document.documentElement.classList.toggle('no-images', !showImagesCheckbox.checked);
            localStorage.setItem('a11y-show-images', showImagesCheckbox.checked);
            console.log('Show images set to:', showImagesCheckbox.checked);
        });
    }

    console.log('Accessibility settings initialized');
}

export function resetAccessibility() {
    console.log('Resetting accessibility settings');
    if (!window.location.pathname.includes('account.html')) {
        console.warn('Accessibility reset is only available on account.html');
        return;
    }

    localStorage.setItem('a11y-text-size', '100');
    localStorage.setItem('a11y-color-scheme', 'default');
    localStorage.setItem('a11y-show-images', 'true');
    localStorage.setItem('a11y-active', 'false');

    document.documentElement.setAttribute('data-text-size', '100');
    document.documentElement.setAttribute('data-color-scheme', 'default');
    document.documentElement.classList.remove('no-images', 'a11y-mode');
    document.documentElement.style.removeProperty('--a11y-font-scale');

    const fontSizeButtons = document.querySelectorAll('.font-size-btn');
    const colorSchemeRadios = document.querySelectorAll('input[name="color-scheme"]');
    const showImagesCheckbox = document.querySelector('#show-images');
    const a11yToggles = document.querySelectorAll('.a11y-toggle .toggle-input');
    const a11ySettings = document.querySelector('.a11y-settings');

    fontSizeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.fontSize === '100');
    });

    colorSchemeRadios.forEach(radio => {
        radio.checked = radio.value === 'default';
    });

    if (showImagesCheckbox) {
        showImagesCheckbox.checked = true;
    }

    a11yToggles.forEach(toggle => {
        toggle.checked = false;
        console.log('A11y toggle reset:', toggle.id);
    });

    if (a11ySettings) {
        a11ySettings.classList.remove('a11y-active');
        console.log('A11y settings hidden after reset');
    }

    console.log('Accessibility settings reset to default');
}