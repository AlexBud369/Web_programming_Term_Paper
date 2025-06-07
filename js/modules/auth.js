import { API_URL, COMMON_PASSWORDS, LOWERCASE, UPPERCASE, DIGITS, SPECIALS } from './constants.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&*_])[A-Za-z\d@$!%*?&*_]{8,20}$/;

function validatePhoneNumber(phone) {
  const phoneRegex = /^\+375\s?(25|29|33|44)\s?\d{3}\s?\d{2}\s?\d{2}$/;
  return phoneRegex.test(phone);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateBirthDate(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 16;
  }
  return age >= 16;
}

function validatePassword(password) {
  return passwordRegex.test(password) && !COMMON_PASSWORDS.includes(password);
}

function generateRandomPassword() {
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

  if (!validatePassword(password)) {
    return generateRandomPassword();
  }
  return password;
}

async function generateNickname(attempts = 0) {
  const adjectives = ['Cool', 'Brave', 'Swift', 'Bright', 'Clever'];
  const nouns = ['Star', 'Wolf', 'Eagle', 'Fox', 'River'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  const nickname = `${randomAdjective}${randomNoun}${randomNumber}`;

  try {
    const response = await fetch(`${API_URL}/users?nickname=${nickname}`);
    if (!response.ok) {
      throw new Error('Failed to check nickname availability');
    }
    const users = await response.json();
    if (users.length > 0 && attempts < 5) {
      return generateNickname(attempts + 1);
    }
    return nickname;
  } catch (error) {
    return `${randomAdjective}${randomNoun}${randomNumber + attempts}`;
  }
}

function checkAuth(requiredRole = null) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return { isAuthenticated: false, role: null };
  }
  if (requiredRole && user.role !== requiredRole) {
    return { isAuthenticated: true, role: user.role, hasRequiredRole: false };
  }
  return { isAuthenticated: true, role: user.role, hasRequiredRole: true };
}

function updateUserProfile() {
  const auth = checkAuth();
  const loginBtn = document.querySelector('.login-btn');
  const registerBtn = document.querySelector('.register-btn');
  const userProfile = document.querySelector('.user-profile');
  const usernameSpan = document.querySelector('.username');
  const logoutBtn = document.querySelector('.logout-btn');
  const authLinks = document.querySelectorAll('.auth-only');

  if (!auth.isAuthenticated) {
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (userProfile) userProfile.style.display = 'none';
    authLinks.forEach(el => el.style.display = 'none');
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));
  if (loginBtn) loginBtn.style.display = 'none';
  if (registerBtn) registerBtn.style.display = 'none';
  if (userProfile) userProfile.style.display = 'block';
  if (usernameSpan) usernameSpan.textContent = user.nickname || 'User';
  authLinks.forEach(el => el.style.display = 'list-item');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user');
      window.location.href = '../auth/signin.html';
    });
  }
}

async function registerUser(userData) {
  try {
    const emailResponse = await fetch(`${API_URL}/users?email=${userData.email}`);
    if (!emailResponse.ok) {
      throw new Error('Failed to check email availability');
    }
    const existingEmail = await emailResponse.json();
    if (existingEmail.length > 0) {
      throw new Error('Email already registered');
    }

    const phoneResponse = await fetch(`${API_URL}/users?phoneNumber=${userData.phoneNumber}`);
    if (!phoneResponse.ok) {
      throw new Error('Failed to check phone availability');
    }
    const existingPhone = await phoneResponse.json();
    if (existingPhone.length > 0) {
      throw new Error('Phone number already registered');
    }

    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const newUser = await response.json();
    console.log('New user registered:', newUser);
    return newUser;
  } catch (error) {
    console.error('Register user error:', error);
    throw new Error(error.message || 'Registration failed');
  }
}

async function loginUser({ usernameEmail, password }) {
  try {
    const response = await fetch(`${API_URL}/users?email=${usernameEmail}&password=${password}`);
    if (!response.ok) {
      throw new Error('Login failed');
    }
    const users = await response.json();
    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }
    const user = users[0];
    user.role = user.email === 'admin@example.com' ? 'admin' : 'user';
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
}

function logoutUser() {
  localStorage.removeItem('user');
  window.location.href = '/auth/signin.html';
}

export {
  validatePhoneNumber,
  validateEmail,
  validateBirthDate,
  validatePassword,
  generateRandomPassword,
  generateNickname,
  checkAuth,
  updateUserProfile,
  registerUser,
  loginUser,
  logoutUser
};