export function initProfileEditing() {
  async function loadUserData() {
    try {
      const res = await fetch('http://localhost:3000/users/1');
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const user = await res.json();
      document.querySelectorAll('.account-field').forEach(field => {
        const fieldLabel = field.querySelector('.field-label').textContent.toLowerCase().replace(' ', '-');
        const fieldElement = field.querySelector('.field-value');
        if (fieldLabel in user) {
          fieldElement.textContent = fieldLabel === 'password' ? '********' : user[fieldLabel];
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error.message);
      showModal('Error', 'Failed to load user data. Please try again.', 'error');
    }
  }

  document.querySelectorAll('.change-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldElement = btn.closest('.account-field').querySelector('.field-value');
      const field = btn.closest('.account-field').querySelector('.field-label').textContent.toLowerCase().replace(' ', '-');
      const currentValue = fieldElement.textContent;
      
      if (field === 'password') {
        showPasswordVerificationModal(async (verified) => {
          if (verified) {
            showEditModal({
              title: 'Enter New Password',
              currentValue: '',
              fieldType: 'password',
              onConfirm: async (newValue) => {
                if (!confirmAction('Confirm changing password?')) {
                  return;
                }
                await updateUserField(field, newValue, fieldElement);
              }
            });
          }
        });
      } else {
        showEditModal({
          title: `Change ${field.replace('-', ' ')}`,
          currentValue,
          fieldType: field === 'email' ? 'email' : field === 'phone-number' ? 'tel' : 'text',
          onConfirm: async (newValue) => {
            if (!confirmAction(`Confirm changing ${field.replace('-', ' ')} to ${newValue}?`)) {
              return;
            }
            await updateUserField(field, newValue, fieldElement);
          }
        });
      }
    });
  });

  async function updateUserField(field, newValue, fieldElement) {
    try {
      console.log(`Sending PATCH request to update ${field} to ${newValue}`);
      const res = await fetch('http://localhost:3000/users/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error: ${res.status}, ${errorText}`);
      }
      fieldElement.textContent = field === 'password' ? '********' : newValue;
      showModal('Success', `${field.replace('-', ' ')} updated successfully`, 'success');
    } catch (error) {
      console.error(`Error updating ${field}:`, error.message);
      showModal('Error', `Failed to update ${field.replace('-', ' ')}. Server error: ${error.message}`, 'error');
    }
  }

  loadUserData();
}

function showModal(title, message, type) {
  const modal = document.createElement('div');
  modal.className = `modal-overlay modal-${type}`;
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">${title}</h3>
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-ok-btn">Close</button>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').appendChild(modal);
  
  setTimeout(() => {
    modal.querySelector('.modal-content').classList.add('show');
  }, 10);
  
  modal.querySelector('.modal-ok-btn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function confirmAction(message) {
  return confirm(message);
}

function showEditModal({ title, currentValue, fieldType, onConfirm }) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">${title}</h3>
      <input type="${fieldType}" value="${fieldType === 'password' ? '' : currentValue}" class="form-input" id="edit-field-input">
      <div class="modal-actions">
        <button class="modal-btn confirm-btn">Confirm</button>
        <button class="modal-btn cancel-btn">Cancel</button>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').appendChild(modal);
  
  setTimeout(() => {
    modal.querySelector('.modal-content').classList.add('show');
  }, 10);
  
  const confirmBtn = modal.querySelector('.confirm-btn');
  const cancelBtn = modal.querySelector('.cancel-btn');
  const input = modal.querySelector('#edit-field-input');
  
  confirmBtn.addEventListener('click', () => {
    const newValue = input.value.trim();
    if (newValue) {
      onConfirm(newValue);
      modal.remove();
    } else {
      showModal('Error', 'Field cannot be empty', 'error');
    }
  });
  
  cancelBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function showPasswordVerificationModal(onVerified) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">Verify Current Password</h3>
      <div class="form-group">
        <label for="current-password-1">Current Password</label>
        <input type="password" class="form-input" id="current-password-1">
      </div>
      <div class="form-group">
        <label for="current-password-2">Confirm Current Password</label>
        <input type="password" class="form-input" id="current-password-2">
      </div>
      <div class="modal-actions">
        <button class="modal-btn confirm-btn">Verify</button>
        <button class="modal-btn cancel-btn">Cancel</button>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').appendChild(modal);
  
  setTimeout(() => {
    modal.querySelector('.modal-content').classList.add('show');
  }, 10);
  
  const confirmBtn = modal.querySelector('.confirm-btn');
  const cancelBtn = modal.querySelector('.cancel-btn');
  const password1 = modal.querySelector('#current-password-1');
  const password2 = modal.querySelector('#current-password-2');
  
  confirmBtn.addEventListener('click', async () => {
    const pass1 = password1.value.trim();
    const pass2 = password2.value.trim();
    
    if (!pass1 || !pass2) {
      showModal('Error', 'Both password fields are required', 'error');
      return;
    }
    
    if (pass1 !== pass2) {
      showModal('Error', 'Passwords do not match', 'error');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/users/1');
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const user = await res.json();
      
      if (user.password === pass1) {
        modal.remove();
        onVerified(true);
      } else {
        showModal('Error', 'Incorrect password. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error verifying password:', error.message);
      showModal('Error', 'Failed to verify password. Server error: ' + error.message, 'error');
    }
  });
  
  cancelBtn.addEventListener('click', () => {
    modal.remove();
    onVerified(false);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      onVerified(false);
    }
  });
}