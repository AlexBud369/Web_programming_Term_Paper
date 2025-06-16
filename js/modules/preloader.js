export function showPreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.display = 'flex';
        preloader.style.opacity = '1';
    }
}

export function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 300); 
    }
}

export function initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        showPreloader();
        window.addEventListener('load', () => {
            hidePreloader();
        });

        document.addEventListener('asyncStart', () => showPreloader());
        document.addEventListener('asyncEnd', () => hidePreloader());
    }
}