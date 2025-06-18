import { API_URL, COMMON_PASSWORDS, LOWERCASE, UPPERCASE, DIGITS, SPECIALS } from './constants.js';
import { showErrorModal } from './modal.js';

const FALLBACK_API_URL = 'http://localhost:3000';
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&*_])[A-Za-z\d@$!%*?&*_]{8,20}$/;

export function validatePhoneNumber(phone) {
    console.log('Validating phone number:', phone);
    const phoneRegex = /^\+375\s?(25|29|33|44)\s?\d{3}\s?\d{2}\s?\d{2}$/;
    return phoneRegex.test(phone);
}

export function validateEmail(email) {
    console.log('Validating email:', email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validateBirthDate(birthDate) {
    console.log('Validating birth date:', birthDate);
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1 >= 16;
    }
    return age >= 16;
}

export function validatePassword(password) {
    console.log('Validating password');
    const isValid = passwordRegex.test(password) && !COMMON_PASSWORDS.includes(password);
    console.log('Password validation result:', isValid);
    return isValid;
}

export function generateRandomPassword() {
    console.log('Generating random password');
    const allChars = LOWERCASE + UPPERCASE + DIGITS + SPECIALS;
    let password = '';
    const length = 12;

    password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
    password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
    password += DIGITS[Math.floor(Math.random() * DIGITS.length)];
    password += SPECIALS[Math.floor(Math.random() * SPECIALS.length)];

    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('');

    if (!passwordRegex.test(password)) {
        console.log('Generated password invalid, retrying');
        return generateRandomPassword();
    }
    console.log('Generated password:', password);
    return password;
}

export async function generateNickname(attempts = 0) {
    const lang = localStorage.getItem('language') || 'en';
    console.log(`Generating nickname, attempt ${attempts + 1}`);
    const maxAttempts = 4;
    if (attempts >= maxAttempts) {
        showErrorModal('error_nickname_generation', lang);
        throw new Error('Maximum nickname generation attempts reached');
    }

    const adjectives = ['Cool', 'Bold', 'Swift', 'Bright', 'Clever', 'Smart', 'Vivid', 'Neat'];
    const nouns = ['Star', 'Wolf', 'Eagle', 'Fox', 'River', 'Cloud', 'Tree', 'Moon'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    const nickname = `${randomAdjective}${randomNoun}${randomNumber}`;

    try {
        const apiUrl = API_URL || FALLBACK_API_URL;
        console.log(`Checking nickname availability: ${nickname} at ${apiUrl}`);
        const response = await fetch(`${apiUrl}/users?nickname=${encodeURIComponent(nickname)}`);
        if (!response.ok) {
            console.log('Nickname check failed:', response.statusText);
            showErrorModal('error_check_nickname', lang);
            throw new Error('Failed to check nickname availability');
        }
        const users = await response.json();
        if (users.length > 0) {
            console.log('Nickname exists, retrying');
            return generateNickname(attempts + 1);
        }
        console.log('Nickname generated:', nickname);
        return nickname;
    } catch (error) {
        console.log('Nickname generation error:', error.message);
        if (attempts + 1 < maxAttempts) {
            console.log('Retrying nickname generation');
            return generateNickname(attempts + 1);
        }
        const fallbackNickname = `${randomAdjective}${randomNoun}${randomNumber + attempts}`;
        console.log('Using fallback nickname:', fallbackNickname);
        return fallbackNickname;
    }
}

export function checkAuth(requiredRole = null) {
    console.log('Checking authentication status, requiredRole:', requiredRole);
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        console.log('No user found in localStorage');
        return { isAuthenticated: false, role: null, hasRequiredRole: false, userId: null };
    }
    console.log('User found:', user);
    const hasRequiredRole = requiredRole ? user.role === requiredRole : true;
    console.log(`User role: ${user.role}, hasRequiredRole: ${hasRequiredRole}, userId: ${user.id}`);
    return { isAuthenticated: true, role: user.role, hasRequiredRole, userId: user.id };
}

export function updateUserProfile() {
    console.log('updateUserProfile called');
    const auth = checkAuth();
    const loginBtn = document.querySelector('.header-controls .login-btn');
    const registerBtn = document.querySelector('.header-controls .register-btn');
    const mobileLoginBtn = document.querySelector('.auth-section .login-btn');
    const mobileRegisterBtn = document.querySelector('.auth-section .register-btn');
    const userProfile = document.querySelector('.user-profile');
    const usernameSpan = document.querySelector('.username');
    const authLinks = document.querySelectorAll('.auth-only');
    const adminLinks = document.querySelectorAll('.admin-only');
    const isSignInPage = window.location.pathname.includes('signin.html');
    const isSignUpPage = window.location.pathname.includes('signup.html');

    if (!auth.isAuthenticated) {
        console.log('User not authenticated, updating UI for unauthenticated state');
        if (loginBtn) {
            loginBtn.style.display = isSignInPage ? 'none' : 'block';
            loginBtn.textContent = 'Login';
            loginBtn.addEventListener('click', () => {
                console.log('Login button clicked, redirecting to signin.html');
                window.location.assign('../auth/signin.html');
            }, { once: true });
        }
        if (registerBtn) {
            registerBtn.style.display = isSignUpPage ? 'none' : 'block';
            registerBtn.textContent = 'Register';
            registerBtn.addEventListener('click', () => {
                console.log('Register button clicked, redirecting to signup.html');
                window.location.assign('../auth/signup.html');
            }, { once: true });
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.style.display = isSignInPage ? 'none' : 'block';
            mobileLoginBtn.textContent = 'Login';
            mobileLoginBtn.addEventListener('click', () => {
                console.log('Mobile login button clicked, redirecting to signin.html');
                window.location.assign('../auth/signin.html');
            }, { once: true });
        }
        if (mobileRegisterBtn) {
            mobileRegisterBtn.style.display = isSignUpPage ? 'none' : 'block';
            mobileRegisterBtn.textContent = 'Register';
            mobileRegisterBtn.addEventListener('click', () => {
                console.log('Mobile register button clicked, redirecting to signup.html');
                window.location.assign('../auth/signup.html');
            }, { once: true });
        }
        if (userProfile) {
            userProfile.style.display = 'none';
            console.log('Hiding user profile');
        }
        authLinks.forEach(link => {
            link.style.display = 'none';
            console.log('Hiding auth link:', link);
        });
        adminLinks.forEach(link => {
            link.style.display = 'none';
            console.log('Hiding admin link:', link);
        });
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User authenticated, updating UI for user:', user.nickname, 'role:', user.role);
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = 'block';
        console.log('Showing user profile');
    }
    if (usernameSpan) {
        usernameSpan.textContent = user.nickname || 'User';
        console.log('Setting username to:', user.nickname || 'User');
    }
    authLinks.forEach(link => {
        link.style.display = 'list-item';
        console.log('Showing auth link:', link);
    });
    adminLinks.forEach(link => {
        link.style.display = user.role === 'admin' ? 'list-item' : 'none';
        console.log('Admin link visibility (', user.role, '):', link.style.display);
    });
}

export async function registerUser(userData) {
    const lang = localStorage.getItem('language') || 'en';
    console.log('Registering user:', userData);
    try {
        const apiUrl = API_URL || FALLBACK_API_URL;

        console.log('Checking phone number availability:', userData.phoneNumber);
        const phoneResponse = await fetch(`${apiUrl}/users?phoneNumber=${encodeURIComponent(userData.phoneNumber)}`);
        if (!phoneResponse.ok) {
            console.log('Phone check failed:', phoneResponse.statusText);
            showErrorModal('error_check_phone', lang);
            throw new Error('Failed to check phone availability');
        }
        const existingPhone = await phoneResponse.json();
        if (existingPhone.length > 0) {
            console.log('Phone number already registered');
            showErrorModal('phone_taken', lang);
            throw new Error('Phone number already registered');
        }

        console.log('Checking email availability:', userData.email);
        const emailResponse = await fetch(`${apiUrl}/users?email=${encodeURIComponent(userData.email)}`);
        if (!emailResponse.ok) {
            console.log('Email check failed:', emailResponse.statusText);
            showErrorModal('error_check_email', lang);
            throw new Error('Failed to check email availability');
        }
        const existingEmail = await emailResponse.json();
        if (existingEmail.length > 0) {
            console.log('Email already registered');
            showErrorModal('email_taken', lang);
            throw new Error('Email already registered');
        }

        console.log('Checking nickname availability:', userData.nickname);
        const nicknameResponse = await fetch(`${apiUrl}/users?nickname=${encodeURIComponent(userData.nickname)}`);
        if (!nicknameResponse.ok) {
            console.log('Nickname check failed:', nicknameResponse.statusText);
            showErrorModal('error_check_nickname', lang);
            throw new Error('Failed to check nickname availability');
        }
        const existingNickname = await nicknameResponse.json();
        if (existingNickname.length > 0) {
            console.log('Nickname already registered');
            showErrorModal('nickname_taken', lang);
            throw new Error('Nickname already registered');
        }

        console.log('Sending registration request');
        const response = await fetch(`${apiUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            console.log('Registration failed:', response.statusText);
            showErrorModal('error_register', lang);
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const newUser = await response.json();
        console.log('New user registered:', newUser);

        const userToSave = {
            id: newUser.id || Date.now(),
            email: newUser.email || '',
            nickname: newUser.nickname || '',
            phoneNumber: newUser.phoneNumber || '',
            firstName: newUser.firstName || '',
            lastName: newUser.lastName || '',
            birthDate: newUser.birthDate || '',
            role: newUser.role || 'user'
        };
        localStorage.setItem('user', JSON.stringify(userToSave));
        console.log('User saved to localStorage:', userToSave);

        updateUserProfile();

        console.log('Redirecting to account.html after registration');
        window.location.assign('../pages/account.html');

        return userToSave;
    } catch (error) {
        console.log('Registration error:', error.message);
        throw error;
    }
}

export async function loginUser({ usernameEmail, password }) {
    const lang = localStorage.getItem('language') || 'en';
    console.log('Logging in user:', usernameEmail);
    try {
        const apiUrl = API_URL || FALLBACK_API_URL;
        const isEmail = validateEmail(usernameEmail);
        const loginQuery = isEmail ? `email=${encodeURIComponent(usernameEmail)}` : `nickname=${encodeURIComponent(usernameEmail)}`;
        console.log(`Sending login request with query: ${loginQuery}`);
        const response = await fetch(`${apiUrl}/users?${loginQuery}`);
        if (!response.ok) {
            console.log('Login request failed:', response.statusText);
            showErrorModal('error_login', lang);
            throw new Error('Login failed');
        }
        const users = await response.json();
        if (users.length === 0) {
            console.log('User not found');
            showErrorModal('user_not_found', lang);
            throw new Error('User does not exist');
        }
        const user = users[0];
        if (user.password !== password) {
            console.log('Incorrect password');
            showErrorModal('incorrect_password', lang);
            throw new Error('Incorrect password');
        }
        console.log('Login successful:', user);

        const userToSave = {
            id: user.id || Date.now(),
            email: user.email || '',
            nickname: user.nickname || '',
            phoneNumber: user.phoneNumber || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            birthDate: user.birthDate || '',
            role: user.role || 'user'
        };
        localStorage.setItem('user', JSON.stringify(userToSave));
        console.log('User saved to localStorage:', userToSave);

        updateUserProfile();

        console.log('Redirecting to account.html after login');
        window.location.assign('../pages/account.html');

        return userToSave;
    } catch (error) {
        console.log('Login error:', error.message);
        throw error;
    }
}

export function logoutUser() {
    console.log('Logging out user');
    localStorage.removeItem('user');
    updateUserProfile();
    console.log('Redirecting to index.html after logout');
    window.location.assign('./index.html');
}