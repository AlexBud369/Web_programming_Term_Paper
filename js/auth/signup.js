import { validatePhoneNumber, validateEmail, validateBirthDate, validatePassword, generateRandomPassword, generateNickname, registerUser } from '../modules/auth.js';
import { initBurgerMenu } from '../modules/burgerMenu.js';

document.addEventListener('DOMContentLoaded', () => {
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
    const submitBtn = document.getElementById('submit-btn');
    const manualPasswordGroup = document.getElementById('manualPasswordGroup');
    const autoPasswordGroup = document.getElementById('autoPasswordGroup');
    const errorElements = {
        phoneNumber: document.getElementById('phoneNumberError'),
        email: document.getElementById('emailError'),
        birthDate: document.getElementById('birthDateError'),
        password: document.getElementById('passwordError'),
        passwordConfirm: document.getElementById('confirmPasswordError'),
        autoPassword: document.getElementById('autoPasswordError'),
        firstName: document.getElementById('firstNameError'),
        lastName: document.getElementById('lastNameError'),
        middleName: null,
        nickname: document.getElementById('nicknameError'),
        termsAgreement: document.getElementById('termsAgreementError'),
    };

    let nicknameAttempts = 0;
    let serverUnavailable = false;

    togglePasswordBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePasswordBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    toggleConfirmPasswordBtn.addEventListener('click', () => {
        const isHidden = confirmPasswordInput.type === 'password';
        confirmPasswordInput.type = isHidden ? 'text' : 'password';
        toggleConfirmPasswordBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    toggleAutoPasswordBtn.addEventListener('click', () => {
        const isHidden = autoPasswordInput.type === 'password';
        autoPasswordInput.type = isHidden ? 'text' : 'password';
        toggleAutoPasswordBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    passwordMethodInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (input.value === 'auto') {
                manualPasswordGroup.style.display = 'none';
                autoPasswordGroup.style.display = 'block';
                autoPasswordInput.value = generateRandomPassword();
            } else {
                manualPasswordGroup.style.display = 'block';
                autoPasswordGroup.style.display = 'none';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                autoPasswordInput.value = '';
            }
            validateForm();
        });
    });

    generatePasswordBtn.addEventListener('click', () => {
        autoPasswordInput.value = generateRandomPassword();
        validateForm();
    });

    generateNicknameBtn.addEventListener('click', async () => {
        if (nicknameAttempts >= 5 || serverUnavailable) {
            generateNicknameBtn.disabled = true;
            nicknameInput.readOnly = false;
            nicknameInput.value = '';
            errorElements.nickname.textContent = serverUnavailable ? 'Server unavailable, enter nickname manually' : 'Max attempts reached, enter nickname manually';
            errorElements.nickname.classList.add('active');
            return;
        }

        nicknameAttempts++;
        try {
            const nickname = await generateNickname(nicknameAttempts);
            nicknameInput.value = nickname;
            errorElements.nickname.textContent = '';
            errorElements.nickname.classList.remove('active');
        } catch (error) {
            serverUnavailable = true;
            generateNicknameBtn.disabled = true;
            nicknameInput.readOnly = false;
            nicknameInput.value = '';
            errorElements.nickname.textContent = 'Server unavailable, enter nickname manually';
            errorElements.nickname.classList.add('active');
        }
        validateForm();
    });

    function validateForm() {
        let isValid = true;
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
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const autoPassword = autoPasswordInput.value;
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const middleName = middleNameInput.value.trim();
        const nickname = nicknameInput.value.trim();
        const termsAgreed = termsAgreementInput.checked;

        if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
            errorElements.phoneNumber.textContent = 'Invalid Belarus phone number (+375 XX XXX XX XX)';
            errorElements.phoneNumber.classList.add('active');
            isValid = false;
        }

        if (!email || !validateEmail(email)) {
            errorElements.email.textContent = 'Invalid email address';
            errorElements.email.classList.add('active');
            isValid = false;
        }

        if (!birthDate || !validateBirthDate(birthDate)) {
            errorElements.birthDate.textContent = 'You must be at least 16 years old';
            errorElements.birthDate.classList.add('active');
            isValid = false;
        }

        if (passwordMethod === 'manual') {
            if (!password || !validatePassword(password)) {
                errorElements.password.textContent = 'Password must be 8-20 characters, include uppercase, lowercase, number, and special character';
                errorElements.password.classList.add('active');
                isValid = false;
            }
            if (password !== confirmPassword) {
                errorElements.confirmPassword.textContent = 'Passwords do not match';
                errorElements.confirmPassword.classList.add('active');
                isValid = false;
            }
        } else if (passwordMethod === 'auto') {
            if (!autoPassword || !validatePassword(autoPassword)) {
                errorElements.autoPassword.textContent = 'Generated password is invalid';
                errorElements.autoPassword.classList.add('active');
                isValid = false;
            }
        } else {
            errorElements.password.textContent = 'Please select a password method';
            errorElements.password.classList.add('active');
            isValid = false;
        }

        if (!firstName) {
            errorElements.firstName.textContent = 'First name is required';
            errorElements.firstName.classList.add('active');
            isValid = false;
        }

        if (!lastName) {
            errorElements.lastName.textContent = 'Last name is required';
            errorElements.lastName.classList.add('active');
            isValid = false;
        }

        if (!nickname) {
            errorElements.nickname.textContent = 'Nickname is required';
            errorElements.nickname.classList.add('active');
            isValid = false;
        }

        if (!termsAgreed) {
            errorElements.termsAgreement.textContent = 'You must agree to the Terms of Service';
            errorElements.termsAgreement.classList.add('active');
            isValid = false;
        }

        submitBtn.disabled = !isValid;
        return isValid;
    }

    [phoneNumberInput, emailInput, birthDateInput, passwordInput, confirmPasswordInput, autoPasswordInput, firstNameInput, lastNameInput, middleNameInput, nicknameInput, termsAgreementInput].forEach((input) => {
        input.addEventListener('input', validateForm);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
        const userData = {
            phoneNumber: phoneNumberInput.value.trim(),
            email: emailInput.value.trim(),
            birthDate: birthDateInput.value,
            password: passwordMethod === 'auto' ? autoPasswordInput.value : passwordInput.value,
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            middleName: middleNameInput.value.trim() || null,
            nickname: nicknameInput.value.trim(),
            username: nicknameInput.value.trim(),
            role: emailInput.value.trim() === 'admin@example.com' ? 'admin' : 'user',
        };

        try {
            console.log('Sending user data:', userData);
            const user = await registerUser(userData);
            console.log('Registration response:', user);
            localStorage.setItem('user', JSON.stringify({ id: user.id, email: user.email, nickname: user.nickname, role: user.role }));
            window.location.href = user.role === 'admin' ? '../pages/admin.html' : '../pages/account.html';
        } catch (error) {
            console.error('Registration error:', error.message);
            errorElements.email.textContent = error.message || 'Registration failed';
            errorElements.email.classList.add('active');
            submitBtn.disabled = true;
        }
    });

    middleNameInput.parentElement.classList.add('non-required');

    autoPasswordGroup.style.display = 'none';

    initBurgerMenu(false, true);
});