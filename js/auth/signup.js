import { validatePhoneNumber, validateEmail, validateBirthDate, validatePassword, generateRandomPassword, generateNickname, registerUser, updateUserProfile } from '../modules/auth.js';
import { initBurgerMenu } from '../modules/burgerMenu.js';
import { initLanguageSwitcher } from '../modules/languageSwitcher.js';
import { initThemeSwitcher } from '../modules/themeSwitcher.js';
import { showErrorModal, showSuccessModal } from '../modules/modal.js';
import { translations } from '../modules/pages-translations/signup_translations.js';
import { translations as footerTranslations } from '../modules/pages-translations/footer_translations.js';
import { translations as headerTranslations } from '../modules/pages-translations/header_translations.js';
import { showPreloader, hidePreloader, initPreloader } from '../modules/preloader.js';

function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[key]?.[lang] || translations[key]?.['en'] || key;
        if (typeof translation === 'string' && translation.includes('<')) {
            element.innerHTML = translation;
        } else {
            element.textContent = translation;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = translations[key]?.[lang] || translations[key]?.['en'] || key;
        element.placeholder = translation;
    });

    document.querySelectorAll('.current-language').forEach(element => {
        const translation = translations.lang_current?.[lang] || translations.lang_current?.['en'] || lang.toUpperCase();
        element.textContent = translation;
    });

    document.title = translations.signup_title?.[lang] || translations.signup_title?.['en'] || 'Sign Up - Euphoria';
}

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();

    const savedLanguage = localStorage.getItem('language') || 'en';
    applyTranslations(savedLanguage);

    const form = document.getElementById('signupForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const emailInput = document.getElementById('email');
    const birthDateInput = document.getElementById('birthDate');
    const passwordMethodInputs = document.getElementsByName('passwordMethod');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const autoPasswordInput = document.getElementById('autoPassword');
    const toggleAutoPasswordBtn = document.getElementById('toggleAutoPassword');
    const generatePasswordBtn = document.getElementById('generatePassword');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const middleNameInput = document.getElementById('middleName');
    const nicknameInput = document.getElementById('nickname');
    const generateNicknameBtn = document.getElementById('generateNickname');
    const termsAgreementInput = document.getElementById('termsAgreement');
    const submitBtn = document.getElementById('submitBtn');
    const manualPasswordGroup = document.getElementById('manualPasswordGroup');
    const autoPasswordGroup = document.getElementById('autoPasswordGroup');
    const errorElements = {
        phoneNumber: document.getElementById('phoneNumberError'),
        email: document.getElementById('emailError'),
        birthDate: document.getElementById('birthDateError'),
        password: document.getElementById('passwordError'),
        confirmPassword: document.getElementById('confirmPasswordError'),
        autoPassword: document.getElementById('autoPasswordError'),
        firstName: document.getElementById('firstNameError'),
        lastName: document.getElementById('lastNameError'),
        middleName: document.getElementById('middleNameError'),
        nickname: document.getElementById('nicknameError'),
        termsAgreement: document.getElementById('termsAgreementError'),
    };

    if (!form || !submitBtn) {
        const lang = localStorage.getItem('language') || 'en';
        showErrorModal(translations.form_initialization_error?.[lang] || 'Form initialization failed');
        return;
    }

    let nicknameAttempts = 0;
    let serverUnavailable = false;

    togglePasswordBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        const lang = localStorage.getItem('language') || 'en';
        togglePasswordBtn.textContent = translations[isHidden ? 'toggle_password_show' : 'toggle_password_hide']?.[lang] || (isHidden ? 'Show' : 'Hide');
    });

    toggleConfirmPasswordBtn.addEventListener('click', () => {
        const isHidden = confirmPasswordInput.type === 'password';
        confirmPasswordInput.type = isHidden ? 'text' : 'password';
        const lang = localStorage.getItem('language') || 'en';
        toggleConfirmPasswordBtn.textContent = translations[isHidden ? 'toggle_password_show' : 'toggle_password_hide']?.[lang] || (isHidden ? 'Show' : 'Hide');
    });

    toggleAutoPasswordBtn.addEventListener('click', () => {
        const isHidden = autoPasswordInput.type === 'password';
        autoPasswordInput.type = isHidden ? 'text' : 'password';
        const lang = localStorage.getItem('language') || 'en';
        toggleAutoPasswordBtn.textContent = translations[isHidden ? 'toggle_password_show' : 'toggle_password_hide']?.[lang] || (isHidden ? 'Show' : 'Hide');
    });

    function updatePasswordFields() {
        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        if (passwordMethod === 'auto') {
            manualPasswordGroup.style.display = 'none';
            autoPasswordGroup.style.display = 'block';
            autoPasswordInput.value = generateRandomPassword();
            passwordInput.removeAttribute('required');
            confirmPasswordInput.removeAttribute('required');
            autoPasswordInput.setAttribute('required', '');
        } else {
            manualPasswordGroup.style.display = 'block';
            autoPasswordGroup.style.display = 'none';
            passwordInput.setAttribute('required', '');
            confirmPasswordInput.setAttribute('required', '');
            autoPasswordInput.removeAttribute('required');
            passwordInput.value = '';
            confirmPasswordInput.value = '';
            autoPasswordInput.value = '';
        }
        updateForm();
    }

    passwordMethodInputs.forEach((input) => {
        input.addEventListener('change', updatePasswordFields);
    });

    generatePasswordBtn.addEventListener('click', () => {
        autoPasswordInput.value = generateRandomPassword();
        updateForm();
    });

    generateNicknameBtn.addEventListener('click', async () => {
        const lang = localStorage.getItem('language') || 'en';
        if (nicknameAttempts >= 5 || serverUnavailable) {
            generateNicknameBtn.disabled = true;
            nicknameInput.readOnly = false;
            nicknameInput.value = '';
            errorElements.nickname.textContent = serverUnavailable ? 
                (translations.nickname_server_unavailable?.[lang] || 'Server unavailable, enter nickname manually') : 
                (translations.nickname_max_attempts?.[lang] || 'Maximum attempts reached, enter nickname manually');
            errorElements.nickname.classList.add('active');
            return;
        }

        nicknameAttempts++;
        try {
            showPreloader();
            const nickname = await generateNickname(nicknameAttempts);
            nicknameInput.value = nickname;
            errorElements.nickname.textContent = '';
            errorElements.nickname.classList.remove('active');
        } catch (error) {
            serverUnavailable = true;
            generateNicknameBtn.disabled = true;
            nicknameInput.readOnly = false;
            nicknameInput.value = '';
            errorElements.nickname.textContent = translations.nickname_server_unavailable?.[lang] || 'Server unavailable, enter nickname manually';
            errorElements.nickname.classList.add('active');
        } finally {
            hidePreloader();
        }
        updateForm();
    });

    function updateForm() {
        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        const isFormFilled = phoneNumberInput.value.trim()
            && emailInput.value.trim()
            && birthDateInput.value
            && firstNameInput.value.trim()
            && lastNameInput.value.trim()
            && nicknameInput.value.trim()
            && termsAgreementInput.checked
            && (passwordMethod === 'auto' ? autoPasswordInput.value : passwordInput.value && confirmPasswordInput.value);

        submitBtn.disabled = !isFormFilled;
    }

    function validateForm() {
        let isValid = true;
        const lang = localStorage.getItem('language') || 'en';
        Object.values(errorElements).forEach((el) => {
            if (el) {
                el.textContent = '';
                el.classList.remove('active');
            }
        });

        const phoneNumber = phoneNumberInput.value.trim();
        const email = emailInput.value.trim();
        const birthDate = birthDateInput.value;
        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const autoPassword = autoPasswordInput.value.trim();
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const middleName = middleNameInput.value.trim();
        const nickname = nicknameInput.value.trim();
        const termsAgreed = termsAgreementInput.checked;

        if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
            errorElements.phoneNumber.textContent = translations.phone_number_invalid?.[lang] || 'Invalid Belarus phone number (+375 XX XXX XX XX)';
            errorElements.phoneNumber.classList.add('active');
            isValid = false;
        }

        if (!email || !validateEmail(email)) {
            errorElements.email.textContent = translations.email_invalid?.[lang] || 'Invalid email address';
            errorElements.email.classList.add('active');
            isValid = false;
        }

        if (!birthDate || !validateBirthDate(birthDate)) {
            errorElements.birthDate.textContent = translations.birth_date_invalid?.[lang] || 'You must be at least 16 years old';
            errorElements.birthDate.classList.add('active');
            isValid = false;
        }

        if (passwordMethod === 'manual') {
            if (!password || !validatePassword(password)) {
                errorElements.password.textContent = translations.password_invalid?.[lang] || 'Password must be 8-18 characters, include uppercase letters';
                errorElements.password.classList.add('active');
                isValid = false;
            }
            if (password !== confirmPassword) {
                errorElements.confirmPassword.textContent = translations.confirm_password_mismatch?.[lang] || 'Passwords do not match';
                errorElements.confirmPassword.classList.add('active');
                isValid = false;
            }
        } else if (passwordMethod === 'auto') {
            if (!autoPassword || !validatePassword(autoPassword)) {
                errorElements.autoPassword.textContent = translations.auto_password_invalid?.[lang] || 'Generated password is invalid';
                errorElements.autoPassword.classList.add('active');
                isValid = false;
            }
        } else {
            errorElements.password.textContent = translations.password_method_required?.[lang] || 'Please select a password method';
            errorElements.password.classList.add('active');
            isValid = false;
        }

        if (!firstName) {
            errorElements.firstName.textContent = translations.first_name_required?.[lang] || 'First name is required';
            errorElements.firstName.classList.add('active');
            isValid = false;
        } else if (firstName.length > 50) {
            errorElements.firstName.textContent = translations.first_name_too_long?.[lang] || 'First name is too long (max 50)';
            errorElements.firstName.classList.add('active');
            isValid = false;
        }

        if (!lastName) {
            errorElements.lastName.textContent = translations.last_name_required?.[lang] || 'Last name is required';
            errorElements.lastName.classList.add('active');
            isValid = false;
        } else if (lastName.length > 50) {
            errorElements.lastName.textContent = translations.last_name_too_long?.[lang] || 'Last name is too long (max 50 characters)';
            errorElements.lastName.classList.add('active');
            isValid = false;
        }

        if (middleName && middleName.length > 50) {
            errorElements.middleName.textContent = translations.middle_name_too_long?.[lang] || 'Middle name is too long';
            errorElements.middleName.classList.add('active');
            isValid = false;
        }

        if (!nickname) {
            errorElements.nickname.textContent = translations.nickname_required?.[lang] || 'Nickname is required';
            errorElements.nickname.classList.add('active');
            isValid = false;
        } else if (nickname.length > 30) {
            errorElements.nickname.textContent = translations.nickname_too_long?.[lang] || 'Nickname is too long (max 30 characters)';
            errorElements.nickname.classList.add('active');
            isValid = false;
        }

        if (!termsAgreed) {
            errorElements.termsAgreement.textContent = translations.terms_agreement_required?.[lang] || 'You must agree to the Terms of Service';
            errorElements.termsAgreement.classList.add('active');
            isValid = false;
        }

        submitBtn.disabled = !isValid;
        return isValid;
    }

    [phoneNumberInput, emailInput, birthDateInput, passwordInput, confirmPasswordInput, autoPasswordInput, firstNameInput, lastNameInput, middleNameInput, nicknameInput, termsAgreementInput].forEach((input) => {
        input.addEventListener('input', () => {
            updateForm();
            validateForm();
        });
        if (input === termsAgreementInput) {
            input.addEventListener('change', () => {
                updateForm();
                validateForm();
            });
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        Object.values(errorElements).forEach((el) => {
            if (el) {
                el.textContent = '';
                el.classList.remove('active');
            }
        });

        if (!validateForm()) {
            return;
        }

        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        const userData = {
            phoneNumber: phoneNumberInput.value.trim(),
            email: emailInput.value.trim(),
            birthDate: birthDateInput.value,
            password: passwordMethod === 'auto' ? autoPasswordInput.value : passwordInput.value,
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            middleName: middleNameInput.value.trim() || '',
            nickname: nicknameInput.value.trim(),
            role: 'user'
        };

        try {
            showPreloader();
            const user = await registerUser(userData);
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                email: user.email || '',
                nickname: user.nickname || '',
                role: user.role || 'user',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                birthDate: user.birthDate || '',
            }));
            const lang = localStorage.getItem('language') || 'en';
            showSuccessModal(translations.registration_success?.[lang] || 'Registration successful!');
            updateUserProfile();
            setTimeout(() => {
                window.location.assign('../pages/account.html');
                hidePreloader();
            }, 1000);
        } catch (error) {
            const lang = localStorage.getItem('language') || 'en';
            showErrorModal(error.message || translations.registration_failed?.[lang] || 'Registration failed');
            hidePreloader();
        }
    });

    initBurgerMenu(false, true, false, { ...translations, ...headerTranslations, ...footerTranslations });

    setTimeout(() => {
        initLanguageSwitcher('.language-selector', { ...translations, ...headerTranslations, ...footerTranslations });
    }, 0);

    const headerThemeToggle = document.querySelector('.header-controls .custom-toggle .toggle-input');
    const mobileThemeToggle = document.querySelector('.mobile-menu .custom-toggle .toggle-input');
    if (headerThemeToggle) {
        initThemeSwitcher(headerThemeToggle);
    }
    if (mobileThemeToggle) {
        initThemeSwitcher(mobileThemeToggle);
    }

    window.addEventListener('languageChanged', (e) => {
        const lang = e.detail.lang;
        applyTranslations(lang);
        validateForm();
        updateForm();
        togglePasswordBtn.textContent = passwordInput.type === 'password' ? 
            translations.toggle_password_show?.[lang] || 'Show' : 
            translations.toggle_password_hide?.[lang] || 'Hide';
        toggleConfirmPasswordBtn.textContent = confirmPasswordInput.type === 'password' ? 
            translations.toggle_password_show?.[lang] || 'Show' : 
            translations.toggle_password_hide?.[lang] || 'Hide';
        toggleAutoPasswordBtn.textContent = autoPasswordInput.type === 'password' ? 
            translations.toggle_password_show?.[lang] || 'Show' : 
            translations.toggle_password_hide?.[lang] || 'Hide';
    });

    autoPasswordGroup.style.display = 'none';
    autoPasswordInput.removeAttribute('required');
    updatePasswordFields();
    updateForm();
    validateForm();
});