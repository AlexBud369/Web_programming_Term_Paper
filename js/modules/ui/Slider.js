export function initSlider(containerSelector) {
  console.log('Attempting to initialize slider with selector:', containerSelector);
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn('Slider container not found');
    return null;
  }
  console.log('Slider container found:', container);

  const slides = Array.from(container.querySelectorAll('.hero-slide'));
  const prevBtn = container.querySelector('.slider-prev');
  const nextBtn = container.querySelector('.slider-next');
  const progressBar = container.querySelector('.progress-bar');

  if (slides.length === 0) {
    console.warn('No slides found');
    return null;
  }
  console.log('Slides found:', slides.length);

  if (!prevBtn) console.warn('Previous button not found');
  if (!nextBtn) console.warn('Next button not found');
  if (!progressBar) console.warn('Progress bar not found');

  let currentIndex = 0;
  let isAnimating = false;

  function updateSlideSizes() {
    const containerHeight = container.offsetHeight;
    slides.forEach(slide => {
      slide.style.height = `${containerHeight}px`;
      const img = slide.querySelector('.slide-image');
      if (img) {
        img.style.height = `${containerHeight}px`;
        img.style.objectPosition = 'center center';
      }
    });
  }

  function updateProgressBar() {
    if (!progressBar) return;

    // Прогресс: от 0 до 1, где 0 — первый слайд, 1 — последний
    const progress = currentIndex / (slides.length - 1);
    progressBar.style.transition = 'width 0.3s ease';
    progressBar.style.width = `${progress * 100}%`;
    console.log('Progress bar updated to:', progress * 100, '%');
  }

  function showSlide(index) {
    if (isAnimating || !slides.length) return;
    isAnimating = true;

    // Бесконечная прокрутка
    const newIndex = (index + slides.length) % slides.length;
    currentIndex = newIndex;

    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentIndex].classList.add('active');

    updateProgressBar();

    setTimeout(() => {
      isAnimating = false;
    }, 800); // Синхронизация с CSS transition
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
      console.log('Previous button event listener added');
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', nextSlide);
      console.log('Next button event listener added');
    }
    window.addEventListener('resize', handleResize);
  }

  function cleanupEvents() {
    if (prevBtn) prevBtn.removeEventListener('click', prevSlide);
    if (nextBtn) nextBtn.removeEventListener('click', nextSlide);
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
    destroy: () => {
      cleanupEvents();
      clearTimeout(resizeTimer);
    }
  };
}