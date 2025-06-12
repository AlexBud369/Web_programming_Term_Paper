import { translations } from './pages-translations/account_translations.js';
import { showSimpleModal } from './modal.js';

export function initAccessibility(container) {
  if (!container) {
    console.error('Accessibility container not found');
    return;
  }

  const a11yToggleMobile = document.querySelector('.mobile-menu #a11y-toggle-mobile');
  const a11yToggleDesktop = document.querySelector('#a11y-toggle-desktop');
  const a11yOptions = container.querySelector('.a11y-options');
  const fontSizeButtons = container.querySelectorAll('.font-size-btn');
  const colorSchemes = container.querySelectorAll('input[name="color-scheme"]');
  const imagesToggle = container.querySelector('#images-toggle');
  const resetButton = document.querySelector('.reset-btn');
  const lang = localStorage.getItem('language') || 'en';

  function applyA11ySettings(checked) {
    if (checked) {
      const savedFontSize = localStorage.getItem('a11yFontSize') || '100';
      document.documentElement.style.setProperty('--a11y-font-scale', parseInt(savedFontSize) / 100);
      const activeButton = container.querySelector(`.font-size-btn[data-font-size="${savedFontSize}"]`);
      if (activeButton) {
        fontSizeButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
      }

      const savedColorScheme = localStorage.getItem('a11yColorScheme') || 'black-white';
      document.body.classList.remove('black-white', 'beige-brown', 'blue-darkblue');
      document.body.classList.add(savedColorScheme);
      const selectedScheme = container.querySelector(`input[value="${savedColorScheme}"]`);
      if (selectedScheme) selectedScheme.checked = true;

      const savedShowImages = localStorage.getItem('a11yShowImages') !== 'false';
      document.body.classList.toggle('no-images', !savedShowImages);
      if (imagesToggle) imagesToggle.checked = savedShowImages;
    } else {

      document.documentElement.style.setProperty('--a11y-font-scale', '1');
      document.body.classList.remove('a11y-mode', 'black-white', 'beige-brown', 'blue-darkblue', 'no-images');
    }

    if (a11yToggleMobile) a11yToggleMobile.checked = checked;
    if (a11yToggleDesktop) a11yToggleDesktop.checked = checked;
    if (a11yOptions) a11yOptions.style.display = checked ? 'block' : 'none';
    document.body.classList.toggle('a11y-mode', checked);
    localStorage.setItem('a11yMode', checked);
  }

  if (a11yToggleMobile) {
    a11yToggleMobile.addEventListener('change', () => {
      applyA11ySettings(a11yToggleMobile.checked);
    });
  }

  if (a11yToggleDesktop) {
    a11yToggleDesktop.addEventListener('change', () => {
      applyA11ySettings(a11yToggleDesktop.checked);
    });
  }

  if (fontSizeButtons.length > 0) {
    fontSizeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const fontSize = parseInt(button.dataset.fontSize);
        fontSizeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.documentElement.style.setProperty('--a11y-font-scale', fontSize / 100);
        localStorage.setItem('a11yFontSize', fontSize);
      });
    });
  }

  if (colorSchemes.length > 0) {
    colorSchemes.forEach(scheme => {
      scheme.addEventListener('change', () => {
        document.body.classList.remove('black-white', 'beige-brown', 'blue-darkblue');
        document.body.classList.add(scheme.value);
        localStorage.setItem('a11yColorScheme', scheme.value);
      });
    });
  }

  if (imagesToggle) {
    imagesToggle.addEventListener('change', () => {
      document.body.classList.toggle('no-images', !imagesToggle.checked);
      localStorage.setItem('a11yShowImages', imagesToggle.checked);
      document.querySelectorAll('.product-image-container').forEach(container => {
        container.dataset.transcription = imagesToggle.checked
          ? ''
          : translations.image_hidden?.[lang] || 'Image hidden for accessibility';
      });
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetAccessibility();
      showSimpleModal('Success', translations.reset_success?.[lang] || 'Accessibility settings reset.', 'modal-success');
    });
  }

  const savedA11yMode = localStorage.getItem('a11yMode') === 'true';
  applyA11ySettings(savedA11yMode);
}

export function resetAccessibility() {
  localStorage.removeItem('a11yFontSize');
  localStorage.removeItem('a11yColorScheme');
  localStorage.removeItem('a11yShowImages');
  localStorage.removeItem('a11yMode');

  document.documentElement.style.setProperty('--a11y-font-scale', '1');
  document.body.classList.remove('a11y-mode', 'black-white', 'beige-brown', 'blue-darkblue', 'no-images');
  document.body.classList.add('black-white');

  const fontSizeButtons = document.querySelectorAll('.font-size-btn');
  fontSizeButtons.forEach(button => {
    button.classList.remove('active');
    if (button.dataset.fontSize === '100') button.classList.add('active');
  });

  const colorSchemes = document.querySelectorAll('input[name="color-scheme"]');
  colorSchemes.forEach(scheme => {
    scheme.checked = scheme.value === 'black-white';
  });

  const imagesToggle = document.querySelector('#images-toggle');
  if (imagesToggle) imagesToggle.checked = true;

  const a11yToggleMobile = document.querySelector('.mobile-menu #a11y-toggle-mobile');
  const a11yToggleDesktop = document.querySelector('#a11y-toggle-desktop');
  const a11yOptions = document.querySelector('.a11y-options');
  if (a11yToggleMobile) a11yToggleMobile.checked = false;
  if (a11yToggleDesktop) a11yToggleDesktop.checked = false;
  if (a11yOptions) a11yOptions.style.display = 'none';

  document.querySelectorAll('.product-image-container').forEach(container => {
    container.dataset.transcription = '';
  });
}