const htmlElement = document.documentElement;
const colorSchemeRadios = document.querySelectorAll('input[name="color-scheme"]');

function setTheme(theme) {
    console.log('Applying theme:', theme);
    htmlElement.setAttribute('data-theme', theme);
    htmlElement.classList.toggle('dark-theme', theme === 'dark');
    const toggles = document.querySelectorAll('.custom-toggle .toggle-input');
    toggles.forEach(toggle => {
        console.log('Syncing toggle:', toggle.id, 'to', theme);
        toggle.checked = theme === 'dark';
    });
    localStorage.setItem('theme', theme);
}

function isCustomColorSchemeActive() {
    return Array.from(colorSchemeRadios).some(radio => radio.checked);
}

function loadSavedTheme(toggleInput) {
    console.log('Loading saved theme for:', toggleInput.id);
    let savedTheme = localStorage.getItem('theme');
    if (!['light', 'dark'].includes(savedTheme)) {
        savedTheme = 'light';
        localStorage.setItem('theme', savedTheme);
    }
    setTheme(savedTheme);
}

function handleThemeToggle(event) {
    console.log('Theme toggle triggered:', event.target.id, event.target.checked);
    // if (isCustomColorSchemeActive()) {
    //     console.log('Custom color scheme active, preventing theme toggle');
    //     event.target.checked = !event.target.checked;
    //     return;
    // }
    const newTheme = event.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
}

export function initThemeSwitcher(toggleInput) {
    console.log('Initializing theme switcher for:', toggleInput);
    if (!toggleInput) {
        console.error('Theme toggle input not found');
        return;
    }
    if (!toggleInput.classList.contains('toggle-input')) {
        console.error('Provided element is not a theme toggle input', toggleInput);
        return;
    }
    console.log('Found toggle input:', toggleInput.id);
    loadSavedTheme(toggleInput);
    toggleInput.addEventListener('change', handleThemeToggle);
}