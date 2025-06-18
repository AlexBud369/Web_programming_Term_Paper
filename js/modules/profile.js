import { checkAuth, validatePassword } from './auth.js';
import { showSimpleModal, showErrorModal } from './modal.js';
import { translations as profileTranslations } from './pages-translations/account_translations.js';
import { showPreloader, hidePreloader } from './preloader.js';
import { COMMON_PASSWORDS } from './constants.js';

function validateName(value) {
    const regex = /^[A-Za-zА-Яа-яЁё-]+$/;
    return regex.test(value) && value.length <= 50;
}

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email) && email.length <= 100;
}

function validatePhoneNumber(phone) {
    const regex = /^\+375\s?(29|25|44|33)\s?-?\d{3}\s?-?\d{2}\s?-?\d{2}$/;
    return regex.test(phone.replace(/\s+/g, ' ').trim());
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
    const lang = localStorage.getItem('language') || 'en';
    try {
        showPreloader();
        const res = await fetch(`http://localhost:3000/users?${field}=${encodeURIComponent(value)}`);
        console.log(`Checking ${field} availability: Status ${res.status}`);
        if (res.status === 404) {
            showErrorModal('page_not_found', lang);
            setTimeout(() => window.location.assign('../pages/page_404_error.html'), 1500);
            return false;
        }
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`Error checking ${field}: HTTP ${res.status}`, errorData);
            throw new Error(`HTTP error: ${res.status}`);
        }
        const users = await res.json();
        console.log(`Checking ${field} response:`, users);
        return !users.some(user => user.id !== currentUserId);
    } catch (error) {
        console.error(`Error checking unique ${field}:`, error.message);
        showErrorModal('error_checking_field', lang, { field: profileTranslations[`account_${field}`]?.[lang] || field });
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
        showErrorModal('please_login', lang);
        setTimeout(() => window.location.assign('../auth/signin.html'), 1000);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    async function loadUserData() {
        try {
            showPreloader();
            const res = await fetch(`http://localhost:3000/users/${user.id}`);
            console.log(`Loading user data: Status ${res.status}`);
            if (res.status === 404) {
                showErrorModal('user_not_found', lang);
                setTimeout(() => window.location.assign('../pages/page_404_error.html'), 1500);
                return user;
            }
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error(`Error loading user data: HTTP ${res.status}`, errorData);
                throw new Error(`HTTP error: ${res.status}`);
            }
            const fetchedUser = await res.json();
            console.log('Loading user data response:', fetchedUser);

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
            showErrorModal('error_loading_user', lang);
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
        document.querySelectorAll('.account-field').forEach(field => {
            const fieldLabel = field.querySelector('.field-label');
            if (!fieldLabel) {
                console.error('Field label not found in account-field:', field);
                return;
            }
            const dataI18n = fieldLabel.getAttribute('data-i18n');
            if (!dataI18n) {
                console.error('data-i18n attribute missing on field-label:', fieldLabel);
                return;
            }
            const fieldKey = fieldMap[dataI18n];
            const fieldElement = field.querySelector('.field-value');
            if (fieldKey && fieldElement) {
                const value = userData[fieldKey] || '';
                fieldElement.textContent = fieldKey === 'password' ? '********' : (value || profileTranslations.no_data?.[lang] || 'Not provided');
            } else {
                console.error(`Invalid fieldKey (${fieldKey}) or fieldElement for data-i18n: ${dataI18n}`);
            }
        });
    });

    document.querySelectorAll('.change-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const accountField = btn.closest('.account-field');
            if (!accountField) {
                console.error('Account field not found for button:', btn);
                return;
            }
            const fieldElement = accountField.querySelector('.field-value');
            const fieldLabelElement = accountField.querySelector('.field-label');
            if (!fieldElement || !fieldLabelElement) {
                console.error('Field element or label not found in account-field:', accountField);
                return;
            }
            const dataI18n = fieldLabelElement.getAttribute('data-i18n');
            if (!dataI18n) {
                console.error('data-i18n attribute not found on field-label:', fieldLabelElement);
                return;
            }
            const fieldKey = fieldMap[dataI18n];
            if (!fieldKey) {
                console.error(`No fieldKey mapped for data-i18n: ${dataI18n}`);
                return;
            }
            let currentValue = fieldElement.textContent === '********' ? '' : fieldElement.textContent;
            if (currentValue === profileTranslations.no_data?.[lang] || currentValue === 'Not provided') {
                currentValue = '';
            }

            if (fieldKey === 'password') {
                showPasswordVerificationModal(async (verified) => {
                    if (verified) {
                        showEditModal({
                            title: profileTranslations.change_password?.[lang] || 'Change Password',
                            currentValue: '',
                            fieldType: 'password',
                            fieldKey,
                            onConfirm: async (newValue) => {
                                const validationResult = await validateField(fieldKey, newValue, user.id, lang);
                                if (!validationResult.isValid) {
                                    showErrorModal(validationResult.messageKey, lang);
                                    return;
                                }
                                const confirmMessage = profileTranslations.confirm_change?.[lang] || 'Confirm changing {field} to {value}?';
                                if (!confirm(confirmMessage.replace('{field}', profileTranslations.account_password?.[lang] || 'Password').replace('{value}', newValue))) return;
                                await updateUserField(fieldKey, newValue, fieldElement);
                            }
                        });
                    }
                });
            } else {
                const fieldLabel = profileTranslations[dataI18n]?.[lang] || dataI18n.replace('account_', '').replace('_', ' ');
                showEditModal({
                    title: `${profileTranslations.change?.[lang] || 'Change'} ${fieldLabel}`,
                    currentValue,
                    fieldType: fieldKey === 'email' ? 'email' : fieldKey === 'phoneNumber' ? 'tel' : fieldKey === 'birthDate' ? 'date' : 'text',
                    fieldKey,
                    onConfirm: async (newValue) => {
                        const validationResult = await validateField(fieldKey, newValue, user.id, lang);
                        if (!validationResult.isValid) {
                            showErrorModal(validationResult.messageKey, lang);
                            return;
                        }
                        const confirmMessage = profileTranslations.confirm_change?.[lang] || 'Confirm changing {field} to {value}?';
                        if (!confirm(confirmMessage.replace('{field}', fieldLabel).replace('{value}', newValue))) return;
                        await updateUserField(fieldKey, newValue, fieldElement);
                    }
                });
            }
        });
    });

    async function validateField(fieldKey, value, currentUserId, lang) {
        if (!value.trim()) {
            return { isValid: false, messageKey: 'required_field' };
        }

        switch (fieldKey) {
            case 'firstName':
            case 'lastName':
                if (!validateName(value)) {
                    return { isValid: false, messageKey: 'invalid_name' };
                }
                break;
            case 'email':
                if (!validateEmail(value)) {
                    return { isValid: false, messageKey: 'email_invalid' };
                }
                if (!(await checkUniqueField('email', value, currentUserId))) {
                    return { isValid: false, messageKey: 'email_taken' };
                }
                break;
            case 'phoneNumber':
                if (!validatePhoneNumber(value)) {
                    return { isValid: false, messageKey: 'invalid_phone' };
                }
                if (!(await checkUniqueField('phoneNumber', value, currentUserId))) {
                    return { isValid: false, messageKey: 'phone_taken' };
                }
                break;
            case 'birthDate':
                if (!validateBirthDate(value)) {
                    return { isValid: false, messageKey: 'birth_date_invalid' };
                }
                break;
            case 'nickname':
                if (value.length > 30 || !/^[A-Za-z0-9_-]+$/.test(value)) {
                    return { isValid: false, messageKey: 'nickname_invalid' };
                }
                if (!(await checkUniqueField('nickname', value, currentUserId))) {
                    return { isValid: false, messageKey: 'nickname_taken' };
                }
                break;
            case 'password':
                if (!validatePassword(value)) {
                    return { isValid: false, messageKey: 'password_invalid' };
                }
                if (COMMON_PASSWORDS.includes(value)) {
                    return { isValid: false, messageKey: 'password_common' };
                }
                break;
            default:
                break;
        }
        return { isValid: true };
    }

    async function updateUserField(fieldKey, newValue, fieldElement) {
        const lang = localStorage.getItem('language') || 'en';
        try {
            showPreloader();
            const res = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [fieldKey]: newValue })
            });
            console.log(`Updating ${fieldKey}: Status ${res.status}, Headers:`, res.headers);

            if (res.status === 404) {
                showErrorModal('page_not_found', lang);
                setTimeout(() => window.location.assign('../pages/page_404_error.html'), 1500);
                return;
            }

            let updatedUser = {};
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                updatedUser = await res.json();
            } else {
                console.warn(`Non-JSON response for ${fieldKey} update:`, await res.text());
            }

            if (!res.ok) {
                console.error(`Error updating ${fieldKey}: HTTP ${res.status}`, updatedUser);
                if (updatedUser.message === 'Email already exists') {
                    showErrorModal('email_taken', lang);
                } else if (updatedUser.message === 'Phone number already exists') {
                    showErrorModal('phone_taken', lang);
                } else if (updatedUser.message === 'Nickname already exists') {
                    showErrorModal('nickname_taken', lang);
                } else {
                    showErrorModal('error_updating_profile', lang);
                }
                return;
            }

            console.log(`Updating ${fieldKey} response:`, updatedUser);
            fieldElement.textContent = fieldKey === 'password' ? '********' : newValue;
            localStorage.setItem('user', JSON.stringify({
                ...user,
                [fieldKey]: newValue
            }));
            sessionStorage.setItem('showSuccessModal', JSON.stringify({
                messageKey: `${fieldKey}_updated`,
                params: {}
            }));
            showSimpleModal('success_title', `${fieldKey}_updated`, 'modal-success', null, lang);
            setTimeout(() => {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error(`Error updating ${fieldKey}:`, error.message);
            showErrorModal('error_updating_profile', lang);
        } finally {
            hidePreloader();
        }
    }

    function showEditModal({ title, currentValue, fieldType, fieldKey, onConfirm }) {
        const lang = localStorage.getItem('language') || 'en';
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        let inputHtml = '';
        if (fieldKey === 'phoneNumber') {
            inputHtml = `
                <input type="tel" value="${currentValue}" class="form-input" id="edit-field-input" placeholder="+375 XX XXX XX XX">
                <small class="form-hint">${profileTranslations.phone_format_hint?.[lang] || 'Format: +375 XX XXX XX XX'}</small>
            `;
        } else if (fieldKey === 'password') {
            inputHtml = `
                <div class="password-wrapper">
                    <input type="password" value="" class="form-input" id="edit-field-input">
                    <button type="button" class="toggle-password">${profileTranslations.toggle_password_show?.[lang] || 'Show'}</button>
                </div>
            `;
        } else if (fieldKey === 'birthDate') {
            inputHtml = `
                <input type="date" value="${currentValue}" class="form-input" id="edit-field-input" placeholder="YYYY-MM-DD">
                <small class="form-hint">${profileTranslations.date_format_hint?.[lang] || 'Format: YYYY-MM-DD'}</small>
            `;
        } else {
            inputHtml = `
                <input type="${fieldType}" value="${currentValue}" class="form-input" id="edit-field-input">
            `;
        }

        modal.innerHTML = `
            <div class="modal-dialog-content">
                <h3 class="modal-title">${title}</h3>
                ${inputHtml}
                <div class="modal-dialog-actions">
                    <button type="button" class="modal-dialog-btn confirm-btn">${profileTranslations.confirm?.[lang] || 'Confirm'}</button>
                    <button type="button" class="modal-dialog-btn cancel-btn">${profileTranslations.cancel?.[lang] || 'Cancel'}</button>
                </div>
            </div>
        `;
        modalContainer.appendChild(modal);

        setTimeout(() => modal.querySelector('.modal-dialog-content').classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const input = modal.querySelector('#edit-field-input');

        if (fieldKey === 'password') {
            const toggleBtn = modal.querySelector('.toggle-password');
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                toggleBtn.textContent = profileTranslations[isHidden ? 'toggle_password_hide' : 'toggle_password_show']?.[lang] || (isHidden ? 'Hide' : 'Show');
            });
        }

        confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newValue = input.value.trim();
            onConfirm(newValue);
            modal.remove();
        });

        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    function showPasswordVerificationModal(onVerified) {
        const lang = localStorage.getItem('language') || 'en';
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog-content">
                <h3 class="modal-title">${profileTranslations.verify_password?.[lang] || 'Verify Current Password'}</h3>
                <div class="modal-form-group">
                    <label for="current-password-1">${profileTranslations.current_password?.[lang] || 'Current Password'}</label>
                    <div class="password-wrapper">
                        <input type="password" class="form-input" id="current-password-1">
                        <button type="button" class="toggle-password">${profileTranslations.toggle_password_show?.[lang] || 'Show'}</button>
                    </div>
                </div>
                <div class="modal-form-group">
                    <label for="current-password-2">${profileTranslations.confirm_password?.[lang] || 'Confirm Password'}</label>
                    <div class="password-wrapper">
                        <input type="password" class="form-input" id="current-password-2">
                        <button type="button" class="toggle-password">${profileTranslations.toggle_password_show?.[lang] || 'Show'}</button>
                    </div>
                </div>
                <div class="modal-dialog-actions">
                    <button type="button" class="modal-dialog-btn confirm-btn">${profileTranslations.verify?.[lang] || 'Verify'}</button>
                    <button type="button" class="modal-dialog-btn cancel-btn">${profileTranslations.cancel?.[lang] || 'Cancel'}</button>
                </div>
            </div>
        `;
        modalContainer.appendChild(modal);

        setTimeout(() => modal.querySelector('.modal-dialog-content').classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const password1 = modal.querySelector('#current-password-1');
        const password2 = modal.querySelector('#current-password-2');
        const toggleButtons = modal.querySelectorAll('.toggle-password');

        toggleButtons.forEach((toggleBtn, index) => {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const input = index === 0 ? password1 : password2;
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                toggleBtn.textContent = profileTranslations[isHidden ? 'toggle_password_hide' : 'toggle_password_show']?.[lang] || (isHidden ? 'Hide' : 'Show');
            });
        });

        confirmBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const pass1 = password1.value.trim();
            const pass2 = password2.value.trim();

            if (!pass1 || !pass2) {
                showErrorModal('required_fields', lang);
                return;
            }

            if (pass1 !== pass2) {
                showErrorModal('passwords_not_match', lang);
                return;
            }

            try {
                showPreloader();
                const res = await fetch(`http://localhost:3000/users/${user.id}`);
                console.log(`Password verification: Status ${res.status}`);
                if (res.status === 404) {
                    showErrorModal('page_not_found', lang);
                    setTimeout(() => window.location.assign('../pages/page_404_error.html'), 1500);
                    return;
                }
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error(`Error verifying password: HTTP ${res.status}`, errorData);
                    throw new Error(`HTTP error: ${res.status}`);
                }
                const fetchedUser = await res.json();
                console.log('Password verification response:', fetchedUser);
                if (fetchedUser.password === pass1) {
                    modal.remove();
                    onVerified(true);
                } else {
                    showErrorModal('incorrect_password', lang);
                }
            } catch (error) {
                console.error('Error verifying password:', error.message);
                showErrorModal('error_verifying', lang);
            } finally {
                hidePreloader();
            }
        });

        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
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