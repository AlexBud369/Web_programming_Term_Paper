export function initSlider(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return null;

  const slides = Array.from(container.querySelectorAll('.hero-slide'));
  const prevBtn = container.querySelector('.slider-prev');
  const nextBtn = container.querySelector('.slider-next');
  const progressBar = container.querySelector('.progress-bar');

  if (slides.length === 0) return null;

  let currentIndex = 0;
  let isAnimating = false;
  const autoPlayDelay = 5000;
  let autoPlayInterval;
  let progressStartTime = 0;
  let progressAnimationFrame;
  let resizeTimer;

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

  function showSlide(index, isAutoPlay = false) {
    if (isAnimating || !slides.length) return;
    isAnimating = true;

    const newIndex = (index + slides.length) % slides.length;
    
    if (!isAutoPlay) {
      resetProgressBar();
    }

    currentIndex = newIndex;

    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentIndex].classList.add('active');

    if (isAutoPlay) {
      startProgressBar();
    }

    setTimeout(() => {
      isAnimating = false;
    }, 500);
  }

  function animateProgressBar(timestamp) {
    if (!progressStartTime) {
      progressStartTime = timestamp;
    }

    const elapsed = timestamp - progressStartTime;
    const progress = Math.min(elapsed / autoPlayDelay, 1);

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    if (progress < 1) {
      progressAnimationFrame = requestAnimationFrame(animateProgressBar);
    } else {
      nextSlide(true);
    }
  }

  function startProgressBar() {
    if (!progressBar) return;
    
    cancelAnimationFrame(progressAnimationFrame);
    progressStartTime = 0;
    
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    void progressBar.offsetWidth;
    
    progressAnimationFrame = requestAnimationFrame(animateProgressBar);
  }

  function resetProgressBar() {
    if (!progressBar) return;
    
    cancelAnimationFrame(progressAnimationFrame);
    progressStartTime = 0;
    
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    void progressBar.offsetWidth;
  }

  function nextSlide(isAutoPlay = false) {
    showSlide(currentIndex + 1, isAutoPlay);
    if (!isAutoPlay) {
      resetAutoPlay();
    }
  }

  function prevSlide() {
    showSlide(currentIndex - 1);
    resetAutoPlay();
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setTimeout(() => {
      nextSlide(true);
    }, autoPlayDelay);
    startProgressBar();
  }

  function stopAutoPlay() {
    clearTimeout(autoPlayInterval);
    resetProgressBar();
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateSlideSizes();
    }, 100);
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    stopAutoPlay();
  }

  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
    } else {
      startAutoPlay();
    }
  }

  function setupEvents() {
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    let touchStartX = 0;
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);
    window.addEventListener('resize', handleResize);
  }

  function cleanupEvents() {
    if (prevBtn) prevBtn.removeEventListener('click', prevSlide);
    if (nextBtn) nextBtn.removeEventListener('click', nextSlide);
    
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchend', handleTouchEnd);
    
    container.removeEventListener('mouseenter', stopAutoPlay);
    container.removeEventListener('mouseleave', startAutoPlay);
    window.removeEventListener('resize', handleResize);
  }

  function init() {
    updateSlideSizes();
    showSlide(0);
    setupEvents();
    startAutoPlay();
  }

  init();

  return {
    next: () => nextSlide(),
    prev: prevSlide,
    goTo: (index) => showSlide(index),
    stop: stopAutoPlay,
    start: startAutoPlay,
    updateSizes: updateSlideSizes,
    destroy: () => {
      cleanupEvents();
      stopAutoPlay();
      clearTimeout(resizeTimer);
      cancelAnimationFrame(progressAnimationFrame);
    }
  };
}