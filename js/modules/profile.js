import { checkAuth } from './auth.js';
import { showSimpleModal } from './modal.js';
import { translations } from './pages-translations/account_translations.js';

export function initProfileEditing() {
    console.log('Initializing profile editing');
    const auth = checkAuth();
    const lang = localStorage.getItem('language') || 'en';

    if (!auth.isAuthenticated) {
        console.log('User not authenticated, redirecting to signin.html');
        showSimpleModal('Error', translations.please_login[lang], 'modal-error');
        setTimeout(() => window.location.assign('../auth/signin.html'), 1000);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User data from localStorage:', user);

    async function loadUserData() {
        try {
            console.log(`Fetching user data for ID: ${user.id}`);
            const res = await fetch(`http://localhost:3000/users/${user.id}`);
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            const fetchedUser = await res.json();
            console.log('Fetched user data:', fetchedUser);

            localStorage.setItem('user', JSON.stringify({
                id: fetchedUser.id,
                email: fetchedUser.email || '',
                nickname: fetchedUser.nickname || '',
                role: fetchedUser.role || 'user',
                firstName: fetchedUser.firstName || '',
                lastName: fetchedUser.lastName || '',
                phoneNumber: fetchedUser.phoneNumber || '',
                birthDate: fetchedUser.birthDate || '',
            }));

            return fetchedUser;
        } catch (error) {
            console.error('Error fetching user data:', error.message);
            showSimpleModal('Error', translations.error_loading[lang], 'modal-error');
            return user;
        }
    }

    const fieldMap = {
        'account_username': 'nickname',
        'account_first_name': 'firstName',
        'account_last_name': 'lastName',
        'account_phone': 'phoneNumber',
        'account_email': 'email',
        'account_dob': 'birthDate',
        'account_password': 'password'
    };

    loadUserData().then(userData => {
        console.log('Populating profile fields with user data:', userData);
        document.querySelectorAll('.account-field').forEach(field => {
            const dataI18n = field.querySelector('.field-label').getAttribute('data-i18n');
            const fieldKey = fieldMap[dataI18n];
            const fieldElement = field.querySelector('.field-value');
            if (fieldKey && fieldElement) {
                fieldElement.textContent = fieldKey === 'password' ? '********' : userData[fieldKey] || translations.no_data[lang];
                console.log(`Set ${fieldKey} to:`, fieldElement.textContent);
            } else {
                console.warn(`Field not found or invalid key for data-i18n: ${dataI18n}`);
            }
        });
    });

    document.querySelectorAll('.change-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Change button clicked');
            const fieldElement = btn.closest('.account-field').querySelector('.field-value');
            const dataI18n = btn.closest('.account-field').querySelector('.field-label').getAttribute('data-i18n');
            const fieldKey = fieldMap[dataI18n];
            const currentValue = fieldElement.textContent === '********' ? '' : fieldElement.textContent;

            console.log(`Editing field: ${fieldKey}, data-i18n: ${dataI18n}`);

            if (fieldKey === 'password') {
                showPasswordVerificationModal(async (verified) => {
                    if (verified) {
                        showEditModal({
                            title: translations.change_password[lang],
                            currentValue: '',
                            fieldType: 'password',
                            onConfirm: async (newValue) => {
                                if (!confirm(`Confirm changing ${fieldKey}?`)) return;
                                await updateUserField(fieldKey, newValue, fieldElement);
                            }
                        });
                    }
                });
            } else {
                const fieldLabel = translations[dataI18n]?.[lang] || dataI18n.replace('account_', '').replace('_', ' ');
                showEditModal({
                    title: `${translations.change[lang]} ${fieldLabel}`,
                    currentValue,
                    fieldType: fieldKey === 'email' ? 'email' : fieldKey === 'phoneNumber' ? 'tel' : 'text',
                    onConfirm: async (newValue) => {
                        if (!confirm(`Confirm changing ${fieldLabel} to ${newValue}?`)) return;
                        await updateUserField(fieldKey, newValue, fieldElement);
                    }
                });
            }
        });
    });

    async function updateUserField(field, newValue, fieldElement) {
        try {
            console.log(`Updating ${field} to ${newValue}`);
            const res = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: newValue })
            });
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            fieldElement.textContent = field === 'password' ? '********' : newValue;
            localStorage.setItem('user', JSON.stringify({
                ...user,
                [field]: newValue
            }));
            showSimpleModal('Success', translations[field + '_updated'][lang], 'modal-success');
        } catch (error) {
            console.error(`Error updating ${field}:`, error.message);
            showSimpleModal('Error', translations.error_updating[lang], 'modal-error');
        }
    }

    function showEditModal({ title, currentValue, fieldType, onConfirm }) {
        console.log('Showing edit modal:', title);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">${title}</h3>
                <input type="${fieldType}" value="${fieldType === 'password' ? '' : currentValue}" class="form-input" id="edit-field-input">
                <div class="modal-actions">
                    <button class="modal-btn confirm-btn">${translations.confirm[lang]}</button>
                    <button class="modal-btn cancel-btn">${translations.cancel[lang]}</button>
                </div>
            </div>
        `;
        document.getElementById('modal-container').appendChild(modal);

        setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const input = modal.querySelector('#edit-field-input');

        confirmBtn.addEventListener('click', () => {
            const newValue = input.value.trim();
            if (newValue) {
                onConfirm(newValue);
                modal.remove();
            } else {
                showSimpleModal('Error', translations.empty_field[lang], 'modal-error');
            }
        });

        cancelBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    function showPasswordVerificationModal(onVerified) {
        console.log('Showing password verification modal');
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">${translations.verify_password[lang]}</h3>
                <div class="form-group">
                    <label for="current-password-1">${translations.current_password[lang]}</label>
                    <input type="password" class="form-input" id="current-password-1">
                </div>
                <div class="form-group">
                    <label for="current-password-2">${translations.confirm_password[lang]}</label>
                    <input type="password" class="form-input" id="current-password-2">
                </div>
                <div class="modal-actions">
                    <button class="modal-btn confirm-btn">${translations.verify[lang]}</button>
                    <button class="modal-btn cancel-btn">${translations.cancel[lang]}</button>
                </div>
            </div>
        `;
        document.getElementById('modal-container').appendChild(modal);

        setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const password1 = modal.querySelector('#current-password-1');
        const password2 = modal.querySelector('#current-password-2');

        confirmBtn.addEventListener('click', async () => {
            const pass1 = password1.value.trim();
            const pass2 = password2.value.trim();

            if (!pass1 || !pass2) {
                showSimpleModal('Error', translations.required_fields[lang], 'modal-error');
                return;
            }

            if (pass1 !== pass2) {
                showSimpleModal('Error', translations.passwords_not_match[lang], 'modal-error');
                return;
            }

            try {
                const res = await fetch(`http://localhost:3000/users/${user.id}`);
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                const fetchedUser = await res.json();

                if (fetchedUser.password === pass1) {
                    modal.remove();
                    onVerified(true);
                } else {
                    showSimpleModal('Error', translations.incorrect_password[lang], 'modal-error');
                }
            } catch (error) {
                console.error('Error verifying password:', error.message);
                showSimpleModal('Error', translations.error_verifying[lang], 'modal-error');
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
}