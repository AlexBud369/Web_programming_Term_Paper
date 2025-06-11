export function initSlider(containerSelector, options = {}) {
    console.log('Initializing slider with selector:', containerSelector, 'and options:', options);

    const defaultOptions = {
        slideSelector: '.hero-slide',
        prevBtnSelector: '.slider-prev',
        nextBtnSelector: '.slider-next',
        progressBarSelector: '.progress-bar',
        imageSelector: '.slide-image',
        autoplay: false,
        slidesData: []
    };

    const config = { ...defaultOptions, ...options };
    const container = document.querySelector(containerSelector);

    if (!container) {
        console.error('Slider container not found:', containerSelector);
        return null;
    }
    console.log('Slider container found:', container);

    const slidesContainer = container.querySelector('.hero-images');
    if (!slidesContainer) {
        console.error('Slides container (.hero-images) not found');
        return null;
    }

    if (!Array.isArray(config.slidesData) || config.slidesData.length === 0) {
        console.error('No valid slides data provided');
        return null;
    }

    console.log('Generating slides from data:', config.slidesData);
    slidesContainer.innerHTML = '';
    const slides = config.slidesData.map((slideData, index) => {
        const slide = document.createElement('div');
        slide.classList.add('hero-slide');
        slide.dataset.index = index;
        slide.innerHTML = `
            <img src="${slideData.image}" alt="${slideData.alt}" class="${config.imageSelector.replace('.', '')}">
            <div class="hero-content">
                <h2>${slideData.h2}</h2>
                <h3>${slideData.h3}</h3>
                <p>${slideData.p}</p>
                <a href="../pages/catalog.html" class="shop-btn">${slideData.button}</a>
            </div>
        `;
        slidesContainer.appendChild(slide);
        return slide;
    });

    if (slides.length === 0) {
        console.error('No slides generated');
        return null;
    }
    console.log('Slides generated:', slides.length);

    const prevBtn = container.querySelector(config.prevBtnSelector);
    const nextBtn = container.querySelector(config.nextBtnSelector);
    const progressBar = container.querySelector(config.progressBarSelector);

    if (!prevBtn) console.warn('Previous button not found:', config.prevBtnSelector);
    if (!nextBtn) console.warn('Next button not found:', config.nextBtnSelector);
    if (!progressBar) console.warn('Progress bar not found:', config.progressBarSelector);

    let currentIndex = 0;
    let isAnimating = false;

    function updateSlideSizes() {
        const containerHeight = container.offsetHeight;
        slides.forEach(slide => {
            slide.style.height = `${containerHeight}px`;
            const img = slide.querySelector(config.imageSelector);
            if (img) {
                img.style.height = `${containerHeight}px`;
                img.style.objectPosition = 'center center';
            }
        });
    }

    function updateProgressBar() {
        if (!progressBar) return;
        const progress = slides.length > 1 ? currentIndex / (slides.length - 1) : 1;
        progressBar.style.transition = 'width 0.3s ease';
        progressBar.style.width = `${progress * 100}%`;
        console.log('Progress bar updated to:', progress * 100, '%');
    }

    function showSlide(index) {
        if (isAnimating || !slides.length) return;
        isAnimating = true;

        const newIndex = (index + slides.length) % slides.length;
        currentIndex = newIndex;

        slides.forEach(slide => slide.classList.remove('active'));
        slides[currentIndex].classList.add('active');

        updateProgressBar();

        setTimeout(() => {
            isAnimating = false;
        }, 800);
    }

    function nextSlide() {
        showSlide(currentIndex + 1);
    }

    function prevSlide() {
        showSlide(currentIndex - 1);
    }

    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateSlideSizes();
            updateProgressBar();
        }, 100);
    }

    function setupEvents() {
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
            prevBtn.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    prevSlide();
                }
            });
            console.log('Previous button event listeners added');
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
            nextBtn.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nextSlide();
                }
            });
            console.log('Next button event listeners added');
        }
        window.addEventListener('resize', handleResize);
    }

    function cleanupEvents() {
        if (prevBtn) {
            prevBtn.removeEventListener('click', prevSlide);
            prevBtn.removeEventListener('keydown', prevSlide);
        }
        if (nextBtn) {
            nextBtn.removeEventListener('click', nextSlide);
            nextBtn.removeEventListener('keydown', nextSlide);
        }
        window.removeEventListener('resize', handleResize);
    }

    function init() {
        updateSlideSizes();
        showSlide(0);
        setupEvents();
    }

    let resizeTimer;
    init();

    return {
        next: nextSlide,
        prev: prevSlide,
        goTo: showSlide,
        updateSizes: updateSlideSizes,
        destroy: cleanupEvents
    };
}