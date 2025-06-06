import { initSlider } from './modules/ui/Slider.js';
import { initProductSwiper } from './modules/ui/Swiper.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing components');
  try {
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
      window.heroSlider = initSlider('.hero-slider');
      console.log('Hero slider initialized:', window.heroSlider);
    } else {
      console.warn('Hero slider not found');
    }
    window.productSwiper = initProductSwiper();
    console.log('Product swiper initialized:', window.productSwiper);
    initMap();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});