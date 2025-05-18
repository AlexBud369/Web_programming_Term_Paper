export function showModal(title, message) {
  const modalContainer = document.querySelector('#modal-container');
  if (!modalContainer) {
    console.error('Modal container not found');
    return;
  }

  document.body.style.overflow = 'hidden';

  const modalHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">${title}</h2>
        <p class="modal-message">${message}</p>
        <button class="modal-ok-btn">OK</button>
      </div>
    </div>
  `;

  modalContainer.innerHTML = modalHTML;

  const modalOverlay = modalContainer.querySelector('.modal-overlay');
  const modalContent = modalContainer.querySelector('.modal-content');
  const okButton = modalContainer.querySelector('.modal-ok-btn');

  function closeModal() {
    modalContainer.innerHTML = '';
    document.body.style.overflow = '';
  }

  okButton.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (!modalContent.contains(e.target)) {
      closeModal();
    }
  });
}