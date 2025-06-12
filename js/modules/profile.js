import { checkAuth, validatePassword } from './auth.js';
import { showSimpleModal } from './modal.js';
import { translations } from './pages-translations/account_translations.js';
import { showPreloader, hidePreloader } from './preloader.js';
import { COMMON_PASSWORDS } from './constants.js';

function validateName(value) {
    const regex = /^[A-Za-zА-Яа-яЁё-]+$/;
    return regex.test(value) && value.length <= 50;
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 100;
}

function validatePhoneNumber(phone) {
    const regex = /^\+375\s?(29|25|44|33)\s?\d{3}\s?\d{2}\s?\d{2}$/;
    return regex.test(phone);
}

function validateBirthDate(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const birth = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1 >= 16;
    }
    return age >= 16 && birth <= today;
}

async function checkUniqueField(field, value, currentUserId) {
    try {
        showPreloader();
        const res = await fetch(`http://localhost:3000/users?${field}=${encodeURIComponent(value)}`);
        if (!res.ok) {
            if (res.status === 404) {
                console.log(`Users endpoint not found for ${field}, redirecting to 404 page`);
                window.location.assign('../pages/page_404_error.html');
                return false;
            }
            throw new Error(`HTTP error: ${res.status}`);
        }
        const users = await res.json();
        return !users.some(user => user.id !== currentUserId);
    } catch (error) {
        console.error(`Error checking unique ${field}:`, error.message);
        return false;
    } finally {
        hidePreloader();
    }
}

export function initProfileEditing() {
    console.log('Initializing profile editing');
    const auth = checkAuth();
    const lang = localStorage.getItem('language') || 'en';

    if (!auth.isAuthenticated) {
        console.log('User not authenticated, redirecting to signin.html');
        showSimpleModal(translations.error?.[lang] || 'Error', translations.please_login?.[lang] || 'Please log in', 'modal-error');
        setTimeout(() => window.location.assign('../auth/signin.html'), 1000);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User data from localStorage:', user);

    async function loadUserData() {
        try {
            showPreloader();
            console.log(`Fetching user data for ID: ${user.id}`);
            const res = await fetch(`http://localhost:3000/users/${user.id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    console.log(`User ID ${user.id} not found, redirecting to 404 page`);
                    window.location.assign('../pages/page_404_error.html');
                    return user;
                }
                throw new Error(`HTTP error: ${res.status}`);
            }
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
            showSimpleModal(translations.error?.[lang] || 'Error', translations.error_loading?.[lang] || 'Failed to load user data', 'modal-error');
            return user;
        } finally {
            hidePreloader();
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
                fieldElement.textContent = fieldKey === 'password' ? '********' : userData[fieldKey] || translations.no_data?.[lang] || 'No data';
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
                            title: translations.change_password?.[lang] || 'Change Password',
                            currentValue: '',
                            fieldType: 'password',
                            fieldKey,
                            onConfirm: async (newValue) => {
                                const validationResult = await validateField(fieldKey, newValue, user.id, lang);
                                if (!validationResult.isValid) {
                                    showSimpleModal(translations.error?.[lang] || 'Error', validationResult.message, 'modal-error');
                                    return;
                                }
                                if (!confirm(`Confirm changing ${fieldKey}?`)) return;
                                await updateUserField(fieldKey, newValue, fieldElement);
                            }
                        });
                    }
                });
            } else {
                const fieldLabel = translations[dataI18n]?.[lang] || dataI18n.replace('account_', '').replace('_', ' ');
                showEditModal({
                    title: `${translations.change?.[lang] || 'Change'} ${fieldLabel}`,
                    currentValue,
                    fieldType: fieldKey === 'email' ? 'email' : fieldKey === 'phoneNumber' ? 'tel' : fieldKey === 'birthDate' ? 'date' : 'text',
                    fieldKey,
                    onConfirm: async (newValue) => {
                        const validationResult = await validateField(fieldKey, newValue, user.id, lang);
                        if (!validationResult.isValid) {
                            showSimpleModal(translations.error?.[lang] || 'Error', validationResult.message, 'modal-error');
                            return;
                        }
                        if (!confirm(`${translations.confirm_change?.[lang] || 'Confirm changing'} ${fieldLabel} ${translations.to?.[lang] || 'to'} ${newValue}?`)) return;
                        await updateUserField(fieldKey, newValue, fieldElement);
                    }
                });
            }
        });
    });

    async function validateField(fieldKey, value, currentUserId, lang) {
        if (!value.trim()) {
            return { isValid: false, message: translations.empty_field?.[lang] || 'Field cannot be empty' };
        }

        switch (fieldKey) {
            case 'firstName':
            case 'lastName':
                if (!validateName(value)) {
                    return { isValid: false, message: translations.invalid_name?.[lang] || 'Name must contain only letters and hyphens, max 50 characters' };
                }
                break;
            case 'email':
                if (!validateEmail(value)) {
                    return { isValid: false, message: translations.email_invalid?.[lang] || 'Invalid email format' };
                }
                if (!(await checkUniqueField('email', value, currentUserId))) {
                    return { isValid: false, message: translations.email_taken?.[lang] || 'Email is already taken' };
                }
                break;
            case 'phoneNumber':
                if (!validatePhoneNumber(value)) {
                    return { isValid: false, message: translations.phone_number_invalid?.[lang] || 'Invalid Belarus phone number (+375 XX XXX XX XX)' };
                }
                if (!(await checkUniqueField('phoneNumber', value, currentUserId))) {
                    return { isValid: false, message: translations.phone_taken?.[lang] || 'Phone number is already taken' };
                }
                break;
            case 'birthDate':
                if (!validateBirthDate(value)) {
                    return { isValid: false, message: translations.birth_date_invalid?.[lang] || 'Invalid date format (YYYY-MM-DD) or user must be at least 16 years old' };
                }
                break;
            case 'nickname':
                if (value.length > 30 || !/^[A-Za-z0-9_-]+$/.test(value)) {
                    return { isValid: false, message: translations.nickname_invalid?.[lang] || 'Nickname must be up to 30 characters, letters, numbers, underscores, or hyphens' };
                }
                if (!(await checkUniqueField('nickname', value, currentUserId))) {
                    return { isValid: false, message: translations.nickname_taken?.[lang] || 'Nickname is already taken' };
                }
                break;
            case 'password':
                if (!validatePassword(value)) {
                    return { isValid: false, message: translations.password_invalid?.[lang] || 'Password must be 8-20 characters, include uppercase, lowercase, digit, and special character' };
                }
                if (COMMON_PASSWORDS.includes(value)) {
                    return { isValid: false, message: translations.password_common?.[lang] || 'Password is too common, please choose a different one' };
                }
                break;
            default:
                break;
        }
        return { isValid: true };
    }

    async function updateUserField(field, newValue, fieldElement) {
        try {
            showPreloader();
            console.log(`Updating ${field} to ${newValue}`);
            const res = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: newValue })
            });
            if (!res.ok) {
                if (res.status === 404) {
                    console.log(`User ID ${user.id} not found, redirecting to 404 page`);
                    window.location.assign('../pages/page_404_error.html');
                    return;
                }
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error: ${res.status}`);
            }
            fieldElement.textContent = field === 'password' ? '********' : newValue;
            localStorage.setItem('user', JSON.stringify({
                ...user,
                [field]: newValue
            }));
            showSimpleModal(translations.success?.[lang] || 'Success', translations[`${field}_updated`]?.[lang] || 'Field updated successfully', 'modal-success');
        } catch (error) {
            console.error(`Error updating ${field}:`, error.message);
            showSimpleModal(translations.error?.[lang] || 'Error', error.message || translations.error_updating?.[lang] || 'Failed to update field', 'modal-error');
        } finally {
            hidePreloader();
        }
    }

    function showEditModal({ title, currentValue, fieldType, fieldKey, onConfirm }) {
        console.log('Showing edit modal:', title);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        let inputHtml = `
            <input type="${fieldType}" value="${fieldType === 'password' ? '' : currentValue}" class="form-input" id="edit-field-input"
                ${fieldKey === 'phoneNumber' ? 'placeholder="+375 XX XXX XX XX"' : ''}
                ${fieldKey === 'birthDate' ? 'pattern="\\d{4}-\\d{2}-\\d{2}" placeholder="YYYY-MM-DD"' : ''}>
        `;
        if (fieldKey === 'password') {
            inputHtml = `
                <div class="password-wrapper">
                    <input type="password" value="" class="form-input" id="edit-field-input">
                    <button type="button" class="toggle-password">${translations.toggle_password_show?.[lang] || 'Show'}</button>
                </div>
            `;
        }
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">${title}</h3>
                ${inputHtml}
                <div class="modal-actions">
                    <button class="modal-btn confirm-btn">${translations.confirm?.[lang] || 'Confirm'}</button>
                    <button class="modal-btn cancel-btn">${translations.cancel?.[lang] || 'Cancel'}</button>
                </div>
            </div>
        `;
        document.getElementById('modal-container').appendChild(modal);

        setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const input = modal.querySelector('#edit-field-input');

        if (fieldKey === 'password') {
            const toggleBtn = modal.querySelector('.toggle-password');
            toggleBtn.addEventListener('click', () => {
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                toggleBtn.textContent = translations[isHidden ? 'toggle_password_hide' : 'toggle_password_show']?.[lang] || (isHidden ? 'Hide' : 'Show');
            });
        }

        confirmBtn.addEventListener('click', () => {
            const newValue = input.value.trim();
            onConfirm(newValue);
            modal.remove();
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
                <h3 class="modal-title">${translations.verify_password?.[lang] || 'Verify Password'}</h3>
                <div class="form-group">
                    <label for="current-password-1">${translations.current_password?.[lang] || 'Current Password'}</label>
                    <div class="password-wrapper">
                        <input type="password" class="form-input" id="current-password-1">
                        <button type="button" class="toggle-password">${translations.toggle_password_show?.[lang] || 'Show'}</button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="current-password-2">${translations.confirm_password?.[lang] || 'Confirm Password'}</label>
                    <div class="password-wrapper">
                        <input type="password" class="form-input" id="current-password-2">
                        <button type="button" class="toggle-password">${translations.toggle_password_show?.[lang] || 'Show'}</button>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn confirm-btn">${translations.verify?.[lang] || 'Verify'}</button>
                    <button class="modal-btn cancel-btn">${translations.cancel?.[lang] || 'Cancel'}</button>
                </div>
            </div>
        `;
        document.getElementById('modal-container').appendChild(modal);

        setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const password1 = modal.querySelector('#current-password-1');
        const password2 = modal.querySelector('#current-password-2');
        const toggleButtons = modal.querySelectorAll('.toggle-password');

        toggleButtons.forEach((toggleBtn, index) => {
            const input = index === 0 ? password1 : password2;
            toggleBtn.addEventListener('click', () => {
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                toggleBtn.textContent = translations[isHidden ? 'toggle_password_hide' : 'toggle_password_show']?.[lang] || (isHidden ? 'Hide' : 'Show');
            });
        });

        confirmBtn.addEventListener('click', async () => {
            const pass1 = password1.value.trim();
            const pass2 = password2.value.trim();

            if (!pass1 || !pass2) {
                showSimpleModal(translations.error?.[lang] || 'Error', translations.required_fields?.[lang] || 'All fields are required', 'modal-error');
                return;
            }

            if (pass1 !== pass2) {
                showSimpleModal(translations.error?.[lang] || 'Error', translations.passwords_not_match?.[lang] || 'Passwords do not match', 'modal-error');
                return;
            }

            try {
                showPreloader();
                const res = await fetch(`http://localhost:3000/users/${user.id}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        console.log(`User ID ${user.id} not found, redirecting to 404 page`);
                        window.location.assign('../pages/page_404_error.html');
                        return;
                    }
                    throw new Error(`HTTP error: ${res.status}`);
                }
                const fetchedUser = await res.json();

                if (fetchedUser.password === pass1) {
                    modal.remove();
                    onVerified(true);
                } else {
                    showSimpleModal(translations.error?.[lang] || 'Error', translations.incorrect_password?.[lang] || 'Incorrect password', 'modal-error');
                }
            } catch (error) {
                console.error('Error verifying password:', error.message);
                showSimpleModal(translations.error?.[lang] || 'Error', translations.error_verifying?.[lang] || 'Error verifying password', 'modal-error');
            } finally {
                hidePreloader();
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