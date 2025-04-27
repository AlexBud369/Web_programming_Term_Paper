import { initSlider } from './modules/ui/Slider.js';
import { initProductSwiper } from './modules/ui/Swiper.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
   
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
      window.heroSlider = initSlider('.hero-slider');
    }

    window.productSwiper = initProductSwiper();

  } catch (error) {
    console.error('Initialization error:', error);
  }
});