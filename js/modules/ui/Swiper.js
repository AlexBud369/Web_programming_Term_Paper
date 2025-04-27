import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';

export function initProductSwiper() {
  try {
    const swiperContainer = document.querySelector('.new-arrivals .swiper');
    if (!swiperContainer) {
      console.warn('Product swiper container not found');
      return null;
    }

    const swiper = new Swiper(swiperContainer, {
      slidesPerView: 'auto',
      spaceBetween: 0,
      freeMode: true,
      watchOverflow: true,
      navigation: {
        nextEl: '.new-arrivals .swiper-button-next',
        prevEl: '.new-arrivals .swiper-button-prev',
      },
      breakpoints: {
        768: { slidesPerView: 2 },
        992: { slidesPerView: 3 },
        1200: { slidesPerView: 4 }
      }
    });

    console.log('Product swiper initialized successfully');
    return swiper;
    
  } catch (error) {
    console.error('Product swiper initialization error:', error);
    return null;
  }
}